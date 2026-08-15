import Link from "next/link";
import { listSellerApplications } from "@/actions/admin";
import { ApplicationDecision } from "@/components/admin/application-decision";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = FILTERS.some((f) => f.value === status) ? status! : "pending";
  const applications = await listSellerApplications(active);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Seller applications</h1>
      <p className="mt-1 text-sm text-ink-500">
        Approving an application creates the seller and makes them visible on the
        marketplace straight away.
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/applications?status=${filter.value}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              active === filter.value
                ? "bg-brand-600 text-white"
                : "border border-ink-200 hover:border-brand-400"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {applications.length === 0 ? (
        <p className="mt-5 rounded-xl border border-ink-200 bg-white px-5 py-16 text-center text-sm text-ink-500">
          No {active === "all" ? "" : active} applications.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {applications.map((application) => (
            <article
              key={application.id}
              className="rounded-xl border border-ink-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{application.business_name}</h2>
                  <p className="text-sm text-ink-500">
                    {application.contact_name} · {application.phone} ·{" "}
                    {application.email}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-500">
                    {application.address}, {application.city}, {application.state}
                  </p>
                </div>
                <span className="font-mono text-xs text-ink-500">
                  {application.reference}
                </span>
              </div>

              {application.categories.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {application.categories.map((category) => (
                    <li
                      key={category}
                      className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800"
                    >
                      {category}
                    </li>
                  ))}
                </ul>
              )}

              {application.about && (
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  {application.about}
                </p>
              )}

              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-500">
                <div className="flex gap-1.5">
                  <dt>NIN:</dt>
                  <dd className="font-mono">{application.nin_masked ?? "not given"}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt>Applied:</dt>
                  <dd>
                    {new Date(application.created_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>

              {application.status === "pending" ? (
                <ApplicationDecision applicationId={application.id} />
              ) : (
                <p className="mt-4 text-sm font-semibold capitalize text-ink-600">
                  {application.status}
                  {application.review_notes ? ` — ${application.review_notes}` : ""}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
