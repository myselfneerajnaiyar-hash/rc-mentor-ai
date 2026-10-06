-- First-touch Meta signup cohort revenue. Import ad spend separately from Meta Ads to calculate ROAS.
-- Date is the attributed signup date; revenue includes verified purchases made by those users.
with profile_attribution as (
  select
    p.user_id,
    p.signup_attribution_first_touch_at::date as date,
    p.signup_attribution_first_touch as attribution,
    lower(coalesce(
      nullif(p.signup_attribution_first_touch ->> 'utm_source', ''),
      case when p.signup_attribution_first_touch ?| array['fbclid', 'fbc', 'fbp'] then 'meta' end
    )) as source,
    coalesce(
      nullif(p.signup_attribution_first_touch ->> 'utm_campaign', ''),
      nullif(p.signup_attribution_first_touch ->> 'campaign_id', '')
    ) as campaign
  from public.profiles p
  where coalesce(p.signup_attribution_first_touch, '{}'::jsonb) <> '{}'::jsonb
)
select
  a.date,
  a.source,
  a.campaign,
  a.attribution ->> 'adset_id' as adset,
  a.attribution ->> 'ad_id' as ad,
  count(distinct a.user_id) as signups,
  count(distinct o.user_id) as purchasers,
  count(distinct o.razorpay_payment_id) as purchases,
  coalesce(sum(o.amount_paid_paise), 0)::numeric / 100 as revenue,
  'INR' as currency
from profile_attribution a
left join public.razorpay_payment_orders o
  on o.user_id = a.user_id
  and o.status = 'provisioned'
  and o.razorpay_payment_id is not null
where a.source is not null
  and (a.source in ('facebook', 'instagram', 'meta') or a.attribution ?| array['campaign_id', 'adset_id', 'ad_id', 'fbclid', 'fbc', 'fbp'])
group by a.date, a.source, a.campaign, adset, ad
order by a.date desc, a.source, a.campaign, adset, ad;
