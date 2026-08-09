-- Regional Partner RPCs + revenue view (Phase 2).
--
-- Listing approve/reject go through SECURITY DEFINER functions rather than a
-- broad UPDATE RLS policy: RLS "using" clauses can't restrict which *columns*
-- a caller may change, so a partner given UPDATE on listings.status could
-- just as easily update price/host_id/images. These functions check region
-- ownership themselves and touch only status/reject_reason.

create or replace function public.regional_partner_approve_listing(p_listing_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_city text;
begin
  select city into v_city from public.listings where id = p_listing_id;
  if v_city is null then
    raise exception 'Listing not found';
  end if;

  if not exists (
    select 1 from public.regional_partners rp
    where rp.user_id = auth.uid() and rp.status = 'active' and rp.region = v_city
  ) then
    raise exception 'Not authorized to approve listings for this region';
  end if;

  update public.listings set status = 'approved', reject_reason = null where id = p_listing_id;
end;
$$;

create or replace function public.regional_partner_reject_listing(p_listing_id uuid, p_reason text default null)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_city text;
begin
  select city into v_city from public.listings where id = p_listing_id;
  if v_city is null then
    raise exception 'Listing not found';
  end if;

  if not exists (
    select 1 from public.regional_partners rp
    where rp.user_id = auth.uid() and rp.status = 'active' and rp.region = v_city
  ) then
    raise exception 'Not authorized to reject listings for this region';
  end if;

  update public.listings set status = 'rejected', reject_reason = p_reason where id = p_listing_id;
end;
$$;

grant execute on function public.regional_partner_approve_listing(uuid) to authenticated;
grant execute on function public.regional_partner_reject_listing(uuid, text) to authenticated;

-- Revenue math lives here, not in the frontend. security_invoker = true is
-- what makes this safe to expose broadly: the view runs with the *caller's*
-- privileges, so RLS on regional_partners/ad_campaigns/regional_partner_payments
-- still applies per-row — a partner querying this view only ever gets rows
-- their own regional_partners RLS policy would already let them see.
create view public.regional_partner_revenue_summary
with (security_invoker = true) as
select
  rp.id as partner_id,
  rp.user_id,
  rp.region,
  rp.revenue_share_percent,
  coalesce(campaign_totals.gross_revenue, 0) as gross_revenue,
  coalesce(campaign_totals.gross_revenue, 0) * (1 - rp.revenue_share_percent / 100) as izigo_share,
  coalesce(campaign_totals.gross_revenue, 0) * (rp.revenue_share_percent / 100) as partner_earnings,
  coalesce(paid_totals.amount, 0) as paid_amount,
  coalesce(pending_totals.amount, 0) as pending_amount
from public.regional_partners rp
left join (
  select region, sum(gross_revenue) as gross_revenue
  from public.ad_campaigns
  group by region
) campaign_totals on campaign_totals.region = rp.region
left join (
  select partner_id, sum(amount) as amount
  from public.regional_partner_payments
  where status = 'paid'
  group by partner_id
) paid_totals on paid_totals.partner_id = rp.id
left join (
  select partner_id, sum(amount) as amount
  from public.regional_partner_payments
  where status = 'pending'
  group by partner_id
) pending_totals on pending_totals.partner_id = rp.id;

grant select on public.regional_partner_revenue_summary to authenticated;
