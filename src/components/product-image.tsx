import { getCategory } from "@/lib/data/categories";

/**
 * The catalogue ships without photography, so each product gets a deterministic
 * branded tile instead of a broken image: the category gradient, the category
 * glyph, and the wave motif from Emmason's print artwork. Swap this component
 * for `next/image` once real product shots exist.
 */
export function ProductImage({
  categorySlug,
  name,
  size = "card",
  className = "",
}: {
  categorySlug: string;
  name: string;
  size?: "card" | "hero" | "thumb";
  className?: string;
}) {
  const category = getCategory(categorySlug);
  const [from, to] = category?.gradient ?? ["#4a951a", "#83d243"];
  const glyph = category?.glyph ?? "📦";

  const glyphSize =
    size === "hero"
      ? "text-[7rem] sm:text-[10rem]"
      : size === "thumb"
        ? "text-2xl"
        : "text-5xl";

  return (
    <div
      className={`relative isolate flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(145deg, ${from} 0%, ${to} 100%)` }}
      role="img"
      aria-label={name}
    >
      {/* Wave band, lifted from the brand's flyer language. */}
      <svg
        viewBox="0 0 400 400"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path d="M0 300 Q100 250 200 285 T400 265 V400 H0 Z" fill="white" fillOpacity="0.14" />
        <path d="M0 330 Q120 290 240 320 T400 300 V400 H0 Z" fill="white" fillOpacity="0.1" />
        <circle cx="330" cy="80" r="90" fill="white" fillOpacity="0.07" />
      </svg>
      <span className={`relative select-none drop-shadow-sm ${glyphSize}`} aria-hidden="true">
        {glyph}
      </span>
    </div>
  );
}
