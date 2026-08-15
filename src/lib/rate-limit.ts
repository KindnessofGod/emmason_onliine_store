import "server-only";
import { headers } from "next/headers";

/**
 * Fixed-window rate limiter for server actions.
 *
 * Deliberately in-process and dependency-free. On serverless each instance
 * keeps its own counter, so a determined attacker spread across many cold
 * starts gets more than the stated budget — this stops casual abuse and
 * runaway retry loops, not a funded adversary. The order path has a second,
 * harder line of defence in Postgres: `place_order()` locks stock rows and
 * decrements them in one transaction, so flooding it cannot oversell.
 *
 * If abuse ever becomes real, swap the Map for Upstash Redis behind the same
 * `checkRateLimit` signature; nothing at the call sites needs to change.
 */
type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

/** Stop the Map growing without bound on a long-lived instance. */
function sweep(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Best-effort client identity. Vercel sets `x-forwarded-for`; the leftmost
 * entry is the client. Falls back to a shared bucket, which is safe in the
 * sense that it fails closed rather than open.
 */
async function clientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return ip;
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

/**
 * @param name    Distinct bucket per action, so checkout and seller signup do
 *                not share a budget.
 * @param limit   Requests allowed per window.
 * @param windowMs Window length in milliseconds.
 */
export async function checkRateLimit(
  name: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  sweep(now);

  const key = `${name}:${await clientKey()}`;
  const window = buckets.get(key);

  if (!window || window.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (window.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - now) / 1000)),
    };
  }

  window.count += 1;
  return { ok: true };
}
