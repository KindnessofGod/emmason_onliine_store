import { chromium } from "playwright";

const OUT = "/tmp/claude-0/-home-user-emmason-onliine-store/610feaac-a03d-58ca-9fd3-5c83b902323b/scratchpad";
const BASE = "http://localhost:3000";

// Against a hosted Supabase project the browser itself must reach the internet
// — admin sign-in calls GoTrue from client code. In sandboxes where egress is
// proxied, Node picks HTTPS_PROXY up on its own but Chromium does not, so pass
// it through explicitly and keep localhost direct.
const proxyServer = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  ...(proxyServer
    ? { proxy: { server: proxyServer, bypass: "localhost,127.0.0.1" } }
    : {}),
});
const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
const page = await context.newPage();

const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console: ${m.text()}`);
});

const shot = async (n) => {
  await page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
  console.log(`   shot -> ${n}.png`);
};

// --- 1. All five locales render their own language -------------------------
console.log("1. Locales");
for (const [locale, expect] of [
  ["en", null], ["yo", null], ["ig", null], ["ha", null], ["fr", null],
]) {
  await page.goto(`${BASE}/${locale}`, { waitUntil: "networkidle" });
  const h1 = (await page.locator("h1").first().innerText()).replace(/\s+/g, " ").trim();
  const lang = await page.getAttribute("html", "lang");
  console.log(`   ${locale} (html lang=${lang}): ${h1.slice(0, 60)}`);
}
await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
await shot("m01-home-en");
await page.goto(`${BASE}/yo`, { waitUntil: "networkidle" });
await shot("m02-home-yo");

// --- 2. Catalogue comes from the database ----------------------------------
console.log("2. Catalogue from Postgres");
await page.goto(`${BASE}/en/shop`, { waitUntil: "networkidle" });
const count = await page.locator('a[href*="/product/"]').count();
console.log(`   product links on /en/shop: ${count}`);
await shot("m03-shop");

await page.goto(`${BASE}/en/category/clippers`, { waitUntil: "networkidle" });
console.log(`   clippers h1: ${await page.locator("h1").first().innerText()}`);

// --- 3. Language switch keeps the page -------------------------------------
console.log("3. Language switch");
await page.goto(`${BASE}/en/category/fans`, { waitUntil: "networkidle" });
// Open the switcher (its trigger is the only button labelled with the language name)
await page.locator('button[aria-label]').filter({ hasText: /English/i }).first().click();
await page.waitForTimeout(400);
await page.getByRole("option", { name: /Hausa/i }).first().click();
await page.waitForURL(/\/ha\//, { timeout: 15000 });
console.log(`   switched to: ${page.url()}`);

// --- 4. Product page + seller attribution ----------------------------------
console.log("4. Product page");
await page.goto(`${BASE}/en/product/wahl-magic-clip-cordless`, { waitUntil: "networkidle" });
console.log(`   h1: ${await page.locator("h1").first().innerText()}`);
const priceText = await page.locator("text=/₦[0-9,]+/").first().innerText();
console.log(`   price: ${priceText}`);
await shot("m04-product");

// --- 5. Cart -> checkout -> real order (pickup) -----------------------------
console.log("5. Checkout (store pickup, pay on delivery)");
await page.getByRole("button", { name: /add to cart|add to basket/i }).first().click();
await page.waitForTimeout(700);
await page.goto(`${BASE}/en/checkout`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);

await page.fill("#fullName", "Ngozi Eze");
await page.fill("#phone", "08031234567");
await page.fill("#email", "ngozi@example.com");
// choose pickup
await page.getByText(/pickup/i).first().click().catch(() => {});
await page.waitForTimeout(300);
await shot("m05-checkout");

await page.getByRole("button", { name: /place order|order/i }).last().click();
await page.waitForTimeout(6000);
const alerts = await page.locator('[role="alert"]').allInnerTexts();
const bodyText = await page.locator("body").innerText();
const ref = bodyText.match(/EMM-[A-Z0-9]{6}/);
console.log(`   order reference on page: ${ref ? ref[0] : "NONE"}`);
if (alerts.length) console.log(`   alerts: ${JSON.stringify(alerts.slice(0, 2))}`);
await shot("m06-order-placed");

// --- 6. Wholesale lead submits -----------------------------------------
console.log("6. Wholesale lead");
await page.goto(`${BASE}/en/sell`, { waitUntil: "networkidle" });
await page.getByLabel(/your name/i).fill("Playwright Test Wholesaler");
await page.getByLabel(/whatsapp number/i).fill("08039998877");
await page.waitForTimeout(300);
await page.getByRole("button", { name: /claim my 5% off/i }).click();
await page.waitForTimeout(3000);
const wholesaleBody = await page.locator("body").innerText();
console.log(`   success card shown: ${/you're in/i.test(wholesaleBody)}`);
console.log(`   error shown instead: ${/could not submit/i.test(wholesaleBody)}`);
await shot("m07-wholesale-lead");

// --- 7. Admin ---------------------------------------------------------------
console.log("7. Admin");
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await page.fill("#email", process.env.VERIFY_ADMIN_EMAIL ?? "admin@emmason.test");
await page.fill("#password", process.env.VERIFY_ADMIN_PASSWORD ?? "emmason-dev-2026");
await page.getByRole("button", { name: /sign in/i }).click();
await page.waitForURL((u) => !u.pathname.includes("login"), { timeout: 20000 });
await page.waitForTimeout(1500);
await shot("m08-admin-overview");

await page.goto(`${BASE}/admin/wholesale-leads`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const leadsText = await page.locator("body").innerText();
console.log(`   lead visible in admin: ${leadsText.includes("Playwright Test Wholesaler")}`);
await shot("m09-admin-wholesale-leads");

await page.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await shot("m10-admin-orders");

// --- 8. Mobile --------------------------------------------------------------
const mobile = await context.newPage();
await mobile.setViewportSize({ width: 390, height: 844 });
await mobile.goto(`${BASE}/en`, { waitUntil: "networkidle" });
await mobile.screenshot({ path: `${OUT}/m11-mobile.png` });
console.log("   shot -> m11-mobile.png");

console.log("\n=== page/console errors ===");
console.log(problems.length ? problems.slice(0, 12).join("\n") : "none");

await browser.close();
