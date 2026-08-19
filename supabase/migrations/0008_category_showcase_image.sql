-- One representative real product photo per category, for the homepage
-- category grid — replaces the emoji glyph tile with an actual photo of
-- something the shop sells. Chosen by hand (or by a reviewer) from the
-- products already photographed in that category, not auto-picked, since
-- "best looking" is a visual judgment call the data alone can't make.
alter table public.categories
  add column if not exists showcase_image_url text;

comment on column public.categories.showcase_image_url is
  'Public URL of a real product photo (from products.images) chosen to represent this category on the homepage grid. Null falls back to the glyph/gradient tile.';
