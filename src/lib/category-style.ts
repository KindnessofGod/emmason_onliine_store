/**
 * Category tile styling — glyph and gradient stops, keyed by slug.
 *
 * This is presentation, not data, so it stays static: `ProductImage` is a leaf
 * component rendered inside client components (the cart, the checkout summary)
 * where an async database lookup is not available. The same values are also
 * stored on the category row for the server-rendered category tiles; this is
 * the fallback that keeps a product thumbnail from needing a round trip.
 */
export interface CategoryStyle {
  glyph: string;
  gradient: [string, string];
}

export const categoryStyles: Record<string, CategoryStyle> = {
  "chargers-power-banks": { glyph: "🔋", gradient: ["#2F5C19", "#63B824"] },
  "bluetooth-speakers": { glyph: "🔊", gradient: ["#1B3E10", "#4A951A"] },
  earbuds: { glyph: "🎧", gradient: ["#245C2E", "#4FB56A"] },
  headsets: { glyph: "🎚️", gradient: ["#153A22", "#3E8C55"] },
  "smart-watches": { glyph: "⌚", gradient: ["#2B5F3A", "#5FBF7F"] },
  "smart-glasses": { glyph: "🕶️", gradient: ["#1F4633", "#4C9E77"] },
  "button-phones": { glyph: "📱", gradient: ["#2F5C19", "#7FD13B"] },
  "kids-tablets": { glyph: "🧸", gradient: ["#3F7A1A", "#8FD94E"] },
  cameras: { glyph: "📷", gradient: ["#1A4020", "#48A05A"] },
  microphones: { glyph: "🎤", gradient: ["#26512F", "#5CB472"] },
  tripods: { glyph: "🎬", gradient: ["#3A6B22", "#7CC24A"] },
  "car-stereos": { glyph: "🚗", gradient: ["#14351C", "#3D8B4E"] },
  clippers: { glyph: "✂️", gradient: ["#2D5A35", "#6ABF80"] },
  fans: { glyph: "🌀", gradient: ["#3F9E12", "#7FD13B"] },
  "home-appliances": { glyph: "🏠", gradient: ["#22502B", "#55A868"] },
  "multi-tool-kits": { glyph: "🧰", gradient: ["#2F5C19", "#9BDD5C"] },
};

const fallback: CategoryStyle = { glyph: "📦", gradient: ["#4A951A", "#83D243"] };

export function categoryStyle(slug: string): CategoryStyle {
  return categoryStyles[slug] ?? fallback;
}
