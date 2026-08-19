// Finds real product photographs and gets them onto the storefront.
//
// This is placeholder photography for a demo — Emmason will supply their own
// product photos later (see HANDOFF.md). Two consequences follow from that:
// this only pulls from sources licensed for reuse (never hotlinked, always
// re-hosted in our own Storage so nothing depends on a third-party site
// staying up), and every image keeps a credit trail so it's obvious later
// which rows still need Emmason's real photos.
//
// Subcommands:
//   search  <query> [limit]      Openverse candidates as JSON
//   fetch   <url> <outfile>      download a candidate for visual review
//   upload  <localfile> <path>   push a reviewed file into Storage
//   apply   <slug> <url> <credit-json>
//                                 upload by URL + write images/image_credits
//                                 for one product in a single step
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split(".")[0] : null;
const BUCKET = "product-images";
const LICENCES = "cc0,pdm,by"; // never by-sa: share-alike doesn't fit a storefront.
const MIN_W = 500;
const MIN_H = 400;

async function openverseSearch(query, limit) {
  const url =
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}` +
    `&page_size=${limit}&license=${LICENCES}&mature=false&extension=jpg,png,webp`;
  const res = await fetch(url, { headers: { "User-Agent": "emmason-store-demo/1.0" } });
  if (!res.ok) throw new Error(`openverse ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return (body.results ?? [])
    .filter((r) => (r.width ?? 0) >= MIN_W && (r.height ?? 0) >= MIN_H)
    .map((r) => ({
      title: (r.title ?? "").replace(/\+/g, " ").slice(0, 140),
      creator: r.creator ?? "Unknown",
      license: (r.license ?? "").toUpperCase(),
      license_version: r.license_version ?? "",
      license_url: r.license_url ?? "",
      source: r.foreign_landing_url ?? "",
      url: r.url,
      width: r.width,
      height: r.height,
    }));
}

async function downloadTo(url, outfile) {
  const res = await fetch(url, { headers: { "User-Agent": "emmason-store-demo/1.0" } });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`not an image: ${type}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 4_000) throw new Error(`suspiciously small (${bytes.length}b)`);
  writeFileSync(outfile, bytes);
  return { bytes: bytes.length, type };
}

// Real photos off the internet arrive at all kinds of sizes — the Nokia 105
// shot above was 5.8MB at 4608x3456, well past what any product tile needs.
// Re-encoding to a bounded JPEG keeps the bucket's size cap meaningful and
// keeps the storefront fast on the 3G/4G connections most shoppers here use.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 82;

async function uploadToStorage(localPathOrUrl, objectPath, isUrl) {
  let raw;
  if (isUrl) {
    const res = await fetch(localPathOrUrl, { headers: { "User-Agent": "emmason-store-demo/1.0" } });
    if (!res.ok) throw new Error(`download ${res.status}`);
    raw = Buffer.from(await res.arrayBuffer());
  } else {
    raw = readFileSync(localPathOrUrl);
  }
  if (raw.length < 4_000) throw new Error(`suspiciously small (${raw.length}b)`);

  const bytes = await sharp(raw)
    .rotate() // respect EXIF orientation before it's stripped
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  const type = "image/jpeg";
  objectPath = objectPath.replace(/\.(png|jpg|jpeg|webp)$/i, ".jpg");

  const put = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": type,
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!put.ok) throw new Error(`storage upload ${put.status}: ${(await put.text()).slice(0, 200)}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

async function runSql(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    },
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`sql ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const [, , cmd, ...rest] = process.argv;

if (cmd === "search") {
  const [query, limit] = rest;
  console.log(JSON.stringify(await openverseSearch(query, Number(limit ?? 8)), null, 2));
} else if (cmd === "fetch") {
  const [url, outfile] = rest;
  const r = await downloadTo(url, outfile);
  console.log(JSON.stringify(r));
} else if (cmd === "upload") {
  const [local, objectPath] = rest;
  console.log(await uploadToStorage(local, objectPath, false));
} else if (cmd === "apply") {
  // apply <slug> <sourceUrl-or-localfile> <objectFileName> <creditJson> [--local]
  const [slug, source, objectFileName, creditJson, flag] = rest;
  const isUrl = flag !== "--local";
  const publicUrl = await uploadToStorage(source, `${objectFileName}`, isUrl);
  // Accept either inline JSON or a path to a .json file — inline JSON with
  // apostrophes in a creator's name (common) is a shell-quoting minefield
  // across many parallel callers, so a file is the safer default.
  const credit = JSON.parse(
    creditJson.endsWith(".json") ? readFileSync(creditJson, "utf8") : creditJson,
  );
  await runSql(
    `update public.products set images = array[${sqlLiteral(publicUrl)}], ` +
      `image_credits = ${sqlLiteral(JSON.stringify([credit]))}::jsonb ` +
      `where slug = ${sqlLiteral(slug)} returning slug, images;`,
  );
  console.log(`applied ${slug} -> ${publicUrl}`);
} else {
  console.error("usage: source-images.mjs <search|fetch|upload|apply> ...");
  process.exit(1);
}
