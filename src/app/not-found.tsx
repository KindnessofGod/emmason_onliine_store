import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-5xl font-bold text-brand-600 dark:text-brand-300">404</p>
      <h1 className="mt-4 text-xl font-bold tracking-tight">
        We could not find that page
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The link may be out of date, or the product may have sold out and been
        delisted.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-brand-900 transition hover:bg-accent-400"
      >
        Back to the store
      </Link>
    </div>
  );
}
