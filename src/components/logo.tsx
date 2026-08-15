/**
 * Wordmark built from the brand's circuit-node motif — an open "e" ring with
 * three contact points, matching the printed logo without tracing the artwork.
 */
export function Logo({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const word = tone === "light" ? "text-white" : "text-ink-900";
  const sub = tone === "light" ? "text-brand-200" : "text-ink-500";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
        <circle cx="20" cy="20" r="18.5" className="fill-brand-500" />
        <path
          d="M28 20a8 8 0 1 0-3 6.2"
          fill="none"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path d="M12.6 20H28" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="28" cy="20" r="2.6" fill="white" />
        <circle cx="25.4" cy="26.6" r="2.2" fill="white" />
        <circle cx="12.6" cy="20" r="2" fill="white" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className={`text-[1.15rem] font-extrabold tracking-tight sm:text-[1.35rem] ${word}`}>
          emmason
        </span>
        {/* The descriptor is what pushes the header past the viewport on a
            360px phone. It is decoration next to the wordmark, so it goes
            first rather than squeezing the cart and menu off the edge. */}
        <span
          className={`mt-0.5 hidden text-[0.5rem] font-semibold uppercase tracking-[0.16em] sm:block ${sub}`}
        >
          Mobile Phone &amp; Tech Gadget
        </span>
      </span>
    </span>
  );
}
