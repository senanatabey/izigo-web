-- Production fix: the "Regional partners can view listings in their region"
-- policy on public.listings (023_regional_partners.sql) subqueries
-- public.regional_partners. In Postgres, evaluating an RLS policy's
-- subquery still requires the querying role to hold a basic table-level
-- SELECT grant on the referenced table — even though the row-level policy
-- on regional_partners itself (user_id = auth.uid() or is_admin()) already
-- returns zero rows for anon. Without this grant, every anonymous visitor
-- got "permission denied for table regional_partners" in the console on
-- any page that lists listings (homepage, /villas, etc).
grant select on public.regional_partners to anon;
