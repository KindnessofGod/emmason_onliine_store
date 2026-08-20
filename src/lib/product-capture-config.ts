/**
 * Shared between the capture form (client) and the extraction server action —
 * lives outside `product-capture.ts` because a `"use server"` module may only
 * export async functions; a plain `export const` there breaks the whole
 * module's server-action manifest, not just that one export (see
 * node_modules/next/dist/docs — this Next.js major has its own breaking
 * changes on server action exports, per AGENTS.md).
 */

// Keeps a single capture request to a handful of images — enough to cover a
// box's front, back and any inserts, without an admin accidentally queuing
// up dozens of photos (and paged tokens) in one Claude call.
export const MAX_CAPTURE_PHOTOS = 6;
