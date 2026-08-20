"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setLeadContacted } from "@/actions/admin";

export function LeadContactedToggle({
  leadId,
  contacted,
}: {
  leadId: string;
  contacted: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setLeadContacted(leadId, !contacted);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
        contacted
          ? "border border-ink-200 hover:border-flash-500 hover:text-flash-600"
          : "bg-brand-600 text-white hover:bg-brand-700"
      }`}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {contacted ? "Mark as not contacted" : "Mark as contacted"}
    </button>
  );
}
