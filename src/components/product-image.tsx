/**
 * Product imagery.
 *
 * The seed catalogue ships without photos, so rather than render a broken
 * image or a grey box, we draw a deterministic branded tile from the product
 * name. Real photos uploaded through the admin panel replace it automatically.
 */

const TILE_HUES = [155, 200, 250, 25, 320, 95];

function hueFor(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return TILE_HUES[hash % TILE_HUES.length];
}

function initialsFor(name: string): string {
  return name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

interface ProductImageProps {
  images: string[];
  name: string;
  className?: string;
  /** Render at a larger scale for the product detail page. */
  large?: boolean;
}

export function ProductImage({ images, name, className = "", large }: ProductImageProps) {
  const src = images?.[0];

  if (src) {
    return (
      // Product photos are arbitrary uploaded URLs, so a plain img avoids
      // having to whitelist every future storage host in next.config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const hue = hueFor(name);

  return (
    <div
      role="img"
      aria-label={name}
      className={`flex h-full w-full items-center justify-center ${className}`}
      style={{
        background: `linear-gradient(140deg, oklch(0.93 0.05 ${hue}), oklch(0.84 0.09 ${hue}))`,
      }}
    >
      <span
        className={`font-semibold tracking-tight ${large ? "text-6xl" : "text-2xl"}`}
        style={{ color: `oklch(0.35 0.09 ${hue})` }}
      >
        {initialsFor(name)}
      </span>
    </div>
  );
}
