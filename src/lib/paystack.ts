import "server-only";

import crypto from "node:crypto";

const PAYSTACK_API = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Missing PAYSTACK_SECRET_KEY");
  return key;
}

export interface InitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Open a Paystack transaction and get back the hosted checkout URL.
 * `amountKobo` is passed straight through — Paystack denominates NGN in kobo,
 * which is the same unit the database uses.
 */
export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<InitializeResult> {
  const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      currency: "NGN",
      channels: ["card", "bank", "ussd", "bank_transfer", "mobile_money"],
      metadata: params.metadata ?? {},
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.status) {
    throw new Error(
      payload?.message ?? `Paystack initialise failed (${response.status})`,
    );
  }

  return {
    authorizationUrl: payload.data.authorization_url,
    accessCode: payload.data.access_code,
    reference: payload.data.reference,
  };
}

export interface VerifyResult {
  status: string;
  amountKobo: number;
  reference: string;
  paidAt: string | null;
  channel: string | null;
  currency: string;
}

/**
 * Ask Paystack what actually happened to a transaction. This is the source of
 * truth — never mark an order paid on the strength of a redirect alone.
 */
export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const response = await fetch(
    `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey()}` },
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.status) {
    throw new Error(
      payload?.message ?? `Paystack verify failed (${response.status})`,
    );
  }

  return {
    status: payload.data.status,
    amountKobo: payload.data.amount,
    reference: payload.data.reference,
    paidAt: payload.data.paid_at ?? null,
    channel: payload.data.channel ?? null,
    currency: payload.data.currency ?? "NGN",
  };
}

/**
 * Validate the `x-paystack-signature` header against the raw request body.
 * Compared in constant time so the check cannot be probed byte by byte.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha512", secretKey())
    .update(rawBody, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
