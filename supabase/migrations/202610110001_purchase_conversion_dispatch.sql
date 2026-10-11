begin;

-- One provider delivery record per captured Razorpay payment. Historical
-- provisioned payments are marked sent so rollout cannot replay old events.
create table public.razorpay_purchase_conversion_dispatches (
  payment_id text not null references public.razorpay_payment_orders(razorpay_payment_id) on delete restrict,
  provider text not null check (provider in ('posthog', 'meta')),
  event_id text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'unknown')),
  claim_token uuid,
  attempts integer not null default 0 check (attempts >= 0),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (payment_id, provider),
  check ((status = 'processing') = (claim_token is not null))
);

alter table public.razorpay_purchase_conversion_dispatches enable row level security;
revoke all on public.razorpay_purchase_conversion_dispatches from public, anon, authenticated;
grant select, insert, update on public.razorpay_purchase_conversion_dispatches to service_role;

insert into public.razorpay_purchase_conversion_dispatches
  (payment_id, provider, status, sent_at, last_error)
select p.razorpay_payment_id, providers.provider, 'sent',
       coalesce(p.side_effects_completed_at, p.provisioned_at, now()), null
from public.razorpay_payment_orders p
cross join (values ('posthog'::text), ('meta'::text)) providers(provider)
where p.status = 'provisioned' and p.razorpay_payment_id is not null
on conflict (payment_id, provider) do nothing;

create or replace function public.claim_purchase_conversion_dispatch(
  p_payment_id text,
  p_provider text,
  p_event_id text,
  p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_claimed boolean := false;
begin
  if p_payment_id is null or p_provider is null or p_provider not in ('posthog', 'meta')
    or p_event_id is null or p_claim_token is null then
    raise exception using errcode = '22023', message = 'Valid purchase conversion claim details are required';
  end if;
  insert into public.razorpay_purchase_conversion_dispatches(payment_id, provider)
  select o.razorpay_payment_id, p_provider
  from public.razorpay_payment_orders o
  where o.razorpay_payment_id = p_payment_id and o.status = 'provisioned'
  on conflict (payment_id, provider) do nothing;

  update public.razorpay_purchase_conversion_dispatches
  set status = 'processing', claim_token = p_claim_token, event_id = p_event_id,
      attempts = attempts + 1, last_error = null, updated_at = now()
  where payment_id = p_payment_id and provider = p_provider
    and status in ('pending', 'failed')
  returning true into v_claimed;
  return coalesce(v_claimed, false);
end;
$function$;

create or replace function public.complete_purchase_conversion_dispatch(
  p_payment_id text, p_provider text, p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.razorpay_purchase_conversion_dispatches
  set status = 'sent', claim_token = null, sent_at = now(), last_error = null, updated_at = now()
  where payment_id = p_payment_id and provider = p_provider
    and status = 'processing' and claim_token = p_claim_token;
  return found;
end;
$function$;

create or replace function public.fail_purchase_conversion_dispatch(
  p_payment_id text, p_provider text, p_claim_token uuid, p_error text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.razorpay_purchase_conversion_dispatches
  set status = 'failed', claim_token = null,
      last_error = left(coalesce(p_error, 'conversion_delivery_failed'), 500), updated_at = now()
  where payment_id = p_payment_id and provider = p_provider
    and status = 'processing' and claim_token = p_claim_token;
  return found;
end;
$function$;

create or replace function public.mark_purchase_conversion_dispatch_unknown(
  p_payment_id text, p_provider text, p_claim_token uuid, p_error text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.razorpay_purchase_conversion_dispatches
  set status = 'unknown', claim_token = null,
      last_error = left(coalesce(p_error, 'conversion_delivery_outcome_unknown'), 500), updated_at = now()
  where payment_id = p_payment_id and provider = p_provider
    and status = 'processing' and claim_token = p_claim_token;
  return found;
end;
$function$;

-- Preserve the existing reconciliation rules, and also revisit verified orders
-- when either provider has an explicitly retryable failed or pending delivery.
create or replace function public.claim_razorpay_reconciliation_batch(p_limit integer default 20)
returns setof public.razorpay_payment_orders
language plpgsql
security definer
set search_path = ''
as $function$
begin
  return query
  with candidates as (
    select p.id
    from public.razorpay_payment_orders p
    where p.status in ('created', 'provisioned')
      and (p.last_reconciled_at is null or p.last_reconciled_at < now() - interval '15 minutes')
      and (
        p.status = 'created'
        or p.side_effects_completed_at is null
        or not p.referral_commission_applied
        or not exists (
          select 1 from public.subscriptions s
          where s.razorpay_payment_id = p.razorpay_payment_id
            and s.user_id = p.user_id
            and s.plan = p.plan
            and s.expires_at = p.entitlement_expires_at
        )
        or (p.plan <> 'cat_test_series' and not exists (
          select 1 from public.profiles pr
          where pr.user_id = p.user_id and pr.is_premium
            and pr.premium_expires_at >= p.entitlement_expires_at
        ))
        or exists (
          select 1 from public.razorpay_purchase_conversion_dispatches d
          where d.payment_id = p.razorpay_payment_id and d.status in ('pending', 'failed')
        )
      )
    order by p.last_reconciled_at nulls first, p.created_at
    for update of p skip locked
    limit greatest(1, least(coalesce(p_limit, 20), 50))
  ), claimed as (
    update public.razorpay_payment_orders p
    set last_reconciled_at = now(),
        reconciliation_attempts = reconciliation_attempts + 1,
        updated_at = now()
    from candidates c
    where p.id = c.id
    returning p.*
  )
  select * from claimed;
end;
$function$;

revoke all on function public.claim_purchase_conversion_dispatch(text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.complete_purchase_conversion_dispatch(text, text, uuid) from public, anon, authenticated;
revoke all on function public.fail_purchase_conversion_dispatch(text, text, uuid, text) from public, anon, authenticated;
revoke all on function public.mark_purchase_conversion_dispatch_unknown(text, text, uuid, text) from public, anon, authenticated;
revoke all on function public.claim_razorpay_reconciliation_batch(integer) from public, anon, authenticated;
grant execute on function public.claim_purchase_conversion_dispatch(text, text, text, uuid) to service_role;
grant execute on function public.complete_purchase_conversion_dispatch(text, text, uuid) to service_role;
grant execute on function public.fail_purchase_conversion_dispatch(text, text, uuid, text) to service_role;
grant execute on function public.mark_purchase_conversion_dispatch_unknown(text, text, uuid, text) to service_role;
grant execute on function public.claim_razorpay_reconciliation_batch(integer) to service_role;

notify pgrst, 'reload schema';
commit;
