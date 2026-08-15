import { NextResponse } from "next/server";
import { verifyTransaction, verifyWebhookSignature } from "@/lib/paystack";
import { getOrderByReference, markOrderPaid } from "@/lib/orders";

/**
 * Paystack webhook.
 *
 * Paystack retries on any non-2xx, so this returns 200 for anything it has
 * genuinely finished with — including events it does not care about. Only a
 * failed signature check or a real processing error returns an error status.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true, ignored: event.event });
  }

  const reference = event.data?.reference;
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  try {
    // The webhook body says a charge succeeded; verifying independently is
    // what makes it trustworthy, and it also gives us the amount to check.
    const verified = await verifyTransaction(reference);

    if (verified.status !== "success") {
      return NextResponse.json({ received: true, status: verified.status });
    }

    const order = await getOrderByReference(reference);
    if (!order) {
      // Nothing to reconcile against. Ack so Paystack stops retrying.
      return NextResponse.json({ received: true, unknownOrder: true });
    }

    // Underpayment guard: never fulfil an order for less than it costs.
    if (verified.amountKobo < order.total_kobo) {
      return NextResponse.json({
        received: true,
        underpaid: true,
        expected: order.total_kobo,
        received_amount: verified.amountKobo,
      });
    }

    await markOrderPaid(reference, verified.paidAt);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed", error);
    // 500 so Paystack retries — a transient database blip should not lose a
    // payment confirmation.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
