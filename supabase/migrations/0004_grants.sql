-- Table-level privileges.
--
-- RLS decides which *rows* a role may see; GRANT decides whether it may touch
-- the table at all. Both are required. Supabase's hosted bootstrap grants
-- broadly on the public schema by default, but relying on that makes the
-- schema non-portable — a fresh database (local stack, CI, self-hosted) ends
-- up with policies that can never be reached. So state the grants explicitly.

grant usage on schema public to anon, authenticated, service_role;

-- Public catalogue: read-only for logged-out shoppers.
grant select on public.categories     to anon, authenticated;
grant select on public.products       to anon, authenticated;
grant select on public.delivery_zones to anon, authenticated;

-- Signed-in staff. The admin policies in 0002 are what actually restrict
-- these to users on the admins roster; without the grant those policies
-- would never be evaluated.
grant insert, update, delete on public.categories     to authenticated;
grant insert, update, delete on public.products       to authenticated;
grant insert, update, delete on public.delivery_zones to authenticated;

grant select, update on public.orders      to authenticated;
grant select         on public.order_items to authenticated;
grant select         on public.admins      to authenticated;

-- Server-side code holding the service role key. It bypasses RLS but still
-- needs the grant.
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Anything added by a later migration should inherit the same shape.
alter default privileges in schema public
  grant select on tables to anon, authenticated;

alter default privileges in schema public
  grant all on tables to service_role;
