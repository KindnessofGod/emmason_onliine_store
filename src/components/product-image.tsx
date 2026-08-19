import Image from "next/image";
import { categoryStyle } from "@/lib/category-style";

/**
 * A product's primary photo when one has been sourced, or a deterministic
 * branded tile — the category gradient, glyph and wave motif from Emmason's
 * print artwork — for the rows still waiting on one. Once `src` is set this
 * renders the photo alone; the glyph is a placeholder, not a decoration to
 * layer on top of a real picture.
 */
export function ProductImage({
  categorySlug,
  name,
  src,
  size = "card",
  className = "",
  priority = false,
}: {
  categorySlug: string;
  name: string;
  /** Public URL of the sourced/uploaded photo, if any. */
  src?: string;
  size?: "card" | "hero" | "thumb";
  className?: string;
  priority?: boolean;
}) {
  if (src) {
    const sizes =
      size === "hero"
        ? "(min-width: 1024px) 50vw, 100vw"
        : size === "thumb"
          ? "25vw"
          : "(min-width: 1024px) 25vw, 50vw";

    return (
      <div className={`relative overflow-hidden bg-ink-50 ${className}`}>
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  const { glyph, gradient } = categoryStyle(categorySlug);
  const [from, to] = gradient;

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
