"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { approveProduct } from "@/actions/admin";

/**
 * One-click exit from the review queue for a pending-review product. Kept
 * separate from the full edit form's status dropdown so approving a batch
 * of AI-captured products doesn't require opening each one and finding the
 * right <select> value — staff can still open the full editor first to fix
 * a misread AI field, then approve from there or from the list.
 */
export function ApproveProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await approveProduct(productId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={approve}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="size-3 animate-spin" aria-hidden />
        ) : (
          <CheckCircle2 className="size-3" aria-hidden />
        )}
        Approve &amp; publish
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
