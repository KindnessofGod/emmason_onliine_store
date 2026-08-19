-- Product photography.
--
-- `images` (already on the table) holds public URLs in display order — the
-- first is the primary shot. `image_credits` carries the licence trail for
-- each one, in the same order.
--
-- Attribution is not optional bookkeeping: the interim photographs are
-- Creative Commons works, and CC BY requires visible credit. Storing the
-- licence next to the image means the storefront can render that credit
-- automatically, and means anyone auditing later can tell at a glance which
-- images are Emmason's own (no credit row) and which are borrowed.
alter table public.products
  add column if not exists image_credits jsonb not null default '[]'::jsonb;

comment on column public.products.images is
  'Public image URLs in display order. First entry is the primary shot.';
comment on column public.products.image_credits is
  'Per-image licence trail, index-aligned with images: [{title, creator, license, license_url, source}]. Empty object for Emmason''s own photography.';

-- Anyone may read the catalogue's photographs; only the service role writes.
-- The bucket itself is public, so this governs the metadata rows only.
create index if not exists products_has_image_idx
  on public.products ((cardinality(images) > 0));
