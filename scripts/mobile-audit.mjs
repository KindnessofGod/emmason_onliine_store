// Mobile audit. Walks the storefront at phone widths and reports the things
// that actually cost sales on a phone: sideways scroll, tap targets too small
// to hit, and text too small to read.
//
// Run with the app served on :3000. `node scripts/mobile-audit.mjs`
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT =
  process.env.OUT ??
  "/tmp/claude-0/-home-user-emmason-onliine-store/610feaac-a03d-58ca-9fd3-5c83b902323b/scratchpad";

// 360 is the widest floor worth designing to in Nigeria — a lot of Android
// stock still reports it.
const WIDTHS = [360, 390, 414];

const PATHS = [
  ["/en", "home"],
  ["/en/shop", "shop"],
  ["/en/category/earbuds", "category"],
  ["/en/product/oraimo-freepods-4-anc-earbuds", "product"],
  ["/en/cart", "cart"],
  ["/en/checkout", "checkout"],
  ["/en/sell", "sell"],
  ["/en/sell/register", "register"],
  ["/en/contact", "contact"],
];

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});

const findings = [];

for (const width of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; SM-A047F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
  });
  const page = await context.newPage();

  page.on("pageerror", (e) => findings.push(`[${width}] pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") findings.push(`[${width}] console: ${m.text().slice(0, 160)}`);
  });

  for (const [path, label] of PATHS) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });

    const report = await page.evaluate((vw) => {
      const out = { overflow: null, smallTargets: [], smallText: 0 };

      // Horizontal scroll: the single worst mobile defect, and invisible on a
      // desktop browser that has room to spare.
      if (document.documentElement.scrollWidth > vw + 1) {
        const guilty = [...document.querySelectorAll("*")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.right > vw + 1 && r.width > 8 && getComputedStyle(el).position !== "fixed";
          })
          .slice(0, 4)
          .map((el) => `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}`);
        out.overflow = { scrollWidth: document.documentElement.scrollWidth, guilty };
      }

      // 44x44 CSS px is the accessible minimum for a touch target.
      const seen = new Set();
      for (const el of document.querySelectorAll(
        'a, button, input, select, textarea, [role="button"], [role="option"]',
      )) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // Screen-reader-only affordances (skip links) are clipped to 1px and
        // are never touched, so they are not tap-target failures.
        if (r.width <= 2 || r.height <= 2) continue;
        if (r.height >= 44 && r.width >= 44) continue;
        const label =
          (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 32) ||
          el.tagName;
        const key = `${label}|${Math.round(r.width)}x${Math.round(r.height)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.smallTargets.push(key);
      }

      // Only prose. Badges and pill labels are legitimately small and are not
      // read as body copy.
      for (const el of document.querySelectorAll("p, li, dd, td")) {
        if (el.querySelector("p, li, dd, td")) continue;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size && size < 12 && el.textContent?.trim()) out.smallText++;
      }

      return out;
    }, width);

    if (report.overflow) {
      findings.push(
        `[${width}] ${label}: horizontal overflow ${report.overflow.scrollWidth}px — ${report.overflow.guilty.join(", ")}`,
      );
    }
    if (report.smallTargets.length) {
      findings.push(
        `[${width}] ${label}: ${report.smallTargets.length} tap target(s) under 44px — ${report.smallTargets.slice(0, 5).join("; ")}`,
      );
    }
    if (report.smallText > 0) {
      findings.push(`[${width}] ${label}: ${report.smallText} element(s) under 12px text`);
    }

    if (width === 390) {
      // A full-page capture of the 102-product listing can exceed the
      // renderer's texture limit; the audit findings matter more than the
      // picture, so fall back to the viewport rather than aborting the run.
      await page
        .screenshot({ path: `${OUT}/mob-${label}.png`, fullPage: true })
        .catch(() => page.screenshot({ path: `${OUT}/mob-${label}.png` }));
    }
  }

  await context.close();
}

await browser.close();

console.log(`\n=== mobile audit: ${findings.length} finding(s) ===`);
for (const f of findings) console.log("  " + f);
if (!findings.length) console.log("  clean at 360, 390 and 414px");
