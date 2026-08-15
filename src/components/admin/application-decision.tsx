"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { reviewSellerApplication } from "@/actions/admin";

export function ApplicationDecision({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(status: "approved" | "rejected") {
    setError(null);
    startTransition(async () => {
      const result = await reviewSellerApplication(applicationId, status, notes);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-4 border-t border-ink-200 pt-4">
      <label htmlFor={`notes-${applicationId}`} className="sr-only">
        Review notes
      </label>
      <input
        id={`notes-${applicationId}`}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Optional note (kept internal)"
        className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => decide("approved")}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Approve &amp; create seller
        </button>
        <button
          type="button"
          onClick={() => decide("rejected")}
          disabled={pending}
          className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold transition hover:border-flash-500 hover:text-flash-600 disabled:opacity-50"
        >
          Reject
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-flash-600">
          {error}
        </p>
      )}
    </div>
  );
}
