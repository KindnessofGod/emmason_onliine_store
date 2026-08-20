import Link from "next/link";
import { listWholesaleLeads } from "@/actions/admin";
import { LeadContactedToggle } from "@/components/admin/lead-contacted-toggle";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "uncontacted", label: "Not yet contacted" },
  { value: "all", label: "All" },
] as const;

export default async function WholesaleLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const active = FILTERS.some((f) => f.value === filter) ? (filter as "all" | "uncontacted") : "uncontacted";
  const leads = await listWholesaleLeads(active);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Wholesale leads</h1>
      <p className="mt-1 text-sm text-ink-500">
        Everyone who asked for 5% off their first wholesale order from the homepage popup or
        the /sell page. Message them on WhatsApp to add them to the channel and take their
        order, then mark them contacted.
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/wholesale-leads?filter=${f.value}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              active === f.value
                ? "bg-brand-600 text-white"
                : "border border-ink-200 hover:border-brand-400"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {leads.length === 0 ? (
        <p className="mt-5 rounded-xl border border-ink-200 bg-white px-5 py-16 text-center text-sm text-ink-500">
          No {active === "all" ? "" : "uncontacted "}leads yet.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {leads.map((lead) => (
            <article
              key={lead.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-200 bg-white p-5"
            >
              <div>
                <h2 className="font-semibold">{lead.name}</h2>
                <a
                  href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-700 hover:underline"
                >
                  {lead.whatsapp}
                </a>
                <p className="mt-0.5 text-xs text-ink-500">
                  {lead.source === "popup" ? "Homepage popup" : "/sell page"}
                  {lead.locale ? ` · ${lead.locale}` : ""} ·{" "}
                  {new Date(lead.created_at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <LeadContactedToggle leadId={lead.id} contacted={lead.contacted} />
            </article>
          ))}
        </div>
      )}
    </>
  );
}
