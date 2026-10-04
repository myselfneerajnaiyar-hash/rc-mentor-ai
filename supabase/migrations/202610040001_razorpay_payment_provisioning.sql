begin;

create table if not exists public.razorpay_payment_orders (
  id uuid primary key default gen_random_uuid(),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  plan text not null check (plan in ('monthly', 'quarterly', 'half_yearly', 'yearly', 'cat_test_series')),
  original_amount_paise bigint not null check (original_amount_paise > 0),
  discount_amount_paise bigint not null default 0 check (discount_amount_paise >= 0),
  amount_paid_paise bigint not null check (amount_paid_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  discount_type text,
  coupon_code text,
  referral_code text,
  influencer_id text,
  influencer_name text,
  influencer_email text,
  influencer_attribution jsonb,
  status text not null default 'creating' check (status in ('creating', 'created', 'provisioned')),
  paid_at timestamptz,
  entitlement_expires_at timestamptz,
  provisioned_at timestamptz,
  referral_commission_applied boolean not null default false,
  side_effects_completed_at timestamptz,
  reconciliation_attempts integer not null default 0,
  last_reconciled_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_amount_paise = original_amount_paise - amount_paid_paise),
  check ((status <> 'provisioned') or (razorpay_payment_id is not null and entitlement_expires_at is not null and provisioned_at is not null))
);

create index if not exists razorpay_payment_orders_reconcile_idx
  on public.razorpay_payment_orders (last_reconciled_at nulls first, created_at)
  where status in ('created', 'provisioned');

create unique index if not exists subscriptions_razorpay_payment_id_uidx
  on public.subscriptions (razorpay_payment_id)
  where razorpay_payment_id is not null;

create table if not exists public.razorpay_referral_commissions (
  razorpay_payment_id text primary key,
  razorpay_order_id text not null unique,
  referral_code text not null,
  plan text not null,
  commission_amount numeric not null,
  created_at timestamptz not null default now()
);

alter table public.razorpay_payment_orders enable row level security;
alter table public.razorpay_referral_commissions enable row level security;
revoke all on public.razorpay_payment_orders from anon, authenticated;
revoke all on public.razorpay_referral_commissions from anon, authenticated;
grant select, insert, update on public.razorpay_payment_orders to service_role;
grant select, insert, update on public.razorpay_referral_commissions to service_role;

create or replace function public.provision_razorpay_payment(
  p_razorpay_order_id text,
  p_razorpay_payment_id text,
  p_amount_paid_paise bigint,
  p_currency text,
  p_paid_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_order public.razorpay_payment_orders%rowtype;
  v_profile public.profiles%rowtype;
  v_expiry timestamptz;
  v_active_expiry timestamptz;
  v_base timestamptz;
  v_existing_count integer;
begin
  if p_razorpay_order_id is null or p_razorpay_payment_id is null then
    raise exception using errcode = '22023', message = 'Razorpay order and payment IDs are required';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_razorpay_order_id), hashtext('razorpay-payment'));

  select * into v_order
  from public.razorpay_payment_orders
  where razorpay_order_id = p_razorpay_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Payment order is not registered';
  end if;
  if p_amount_paid_paise <> v_order.amount_paid_paise or p_currency <> v_order.currency then
    raise exception using errcode = '22023', message = 'Captured payment does not match the registered order';
  end if;
  if v_order.razorpay_payment_id is not null and v_order.razorpay_payment_id <> p_razorpay_payment_id then
    raise exception using errcode = '23505', message = 'Order is already linked to another payment';
  end if;
  if p_paid_at is null then
    raise exception using errcode = '22023', message = 'Captured payment timestamp is required';
  end if;

  select * into v_profile
  from public.profiles
  where user_id = v_order.user_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Registered payment user profile is missing';
  end if;

  if v_order.status = 'provisioned' then
    if v_order.razorpay_payment_id <> p_razorpay_payment_id then
      raise exception using errcode = '23505', message = 'Provisioned order is linked to a different payment';
    end if;
    v_expiry := v_order.entitlement_expires_at;
    update public.subscriptions
      set user_id = v_order.user_id,
          plan = v_order.plan,
          expires_at = v_expiry
      where razorpay_payment_id = p_razorpay_payment_id;
    get diagnostics v_existing_count = row_count;
    if v_existing_count = 0 then
      insert into public.subscriptions (
        user_id, name, email, phone, exam, attempt_year, plan, expires_at, referral_code, razorpay_payment_id
      ) values (
        v_order.user_id,
        coalesce(v_profile.name, ''),
        coalesce(v_profile.email, ''),
        coalesce(v_profile.phone, ''),
        coalesce(v_profile.exam, ''),
        v_profile.attempt_year,
        v_order.plan,
        v_expiry,
        v_order.referral_code,
        p_razorpay_payment_id
      );
    end if;
    if v_order.plan <> 'cat_test_series' then
      update public.profiles
        set is_premium = true,
            premium_expires_at = greatest(coalesce(premium_expires_at, v_expiry), v_expiry)
        where user_id = v_order.user_id;
    end if;
    update public.razorpay_payment_orders
      set last_error_code = null, updated_at = now()
      where id = v_order.id;
    return jsonb_build_object(
      'status', 'reconciled', 'order_id', p_razorpay_order_id,
      'payment_id', p_razorpay_payment_id, 'user_id', v_order.user_id,
      'plan', v_order.plan, 'amount_paid_paise', v_order.amount_paid_paise,
      'expires_at', v_expiry
    );
  end if;

  update public.razorpay_payment_orders
    set razorpay_payment_id = p_razorpay_payment_id,
        paid_at = p_paid_at,
        updated_at = now()
    where id = v_order.id;

  select max(expires_at) into v_active_expiry
  from public.subscriptions
  where user_id = v_order.user_id and expires_at > now();

  v_base := greatest(
    now(), p_paid_at,
    coalesce(v_profile.premium_expires_at, now()),
    coalesce(v_active_expiry, now())
  );

  v_expiry := v_base + case v_order.plan
    when 'monthly' then interval '1 month'
    when 'quarterly' then interval '3 months'
    when 'half_yearly' then interval '6 months'
    when 'yearly' then interval '1 year'
    when 'cat_test_series' then interval '1 year'
  end;

  insert into public.subscriptions (
    user_id, name, email, phone, exam, attempt_year, plan, expires_at, referral_code, razorpay_payment_id
  ) values (
    v_order.user_id,
    coalesce(v_profile.name, ''),
    coalesce(v_profile.email, ''),
    coalesce(v_profile.phone, ''),
    coalesce(v_profile.exam, ''),
    v_profile.attempt_year,
    v_order.plan,
    v_expiry,
    v_order.referral_code,
    p_razorpay_payment_id
  );

  if v_order.plan <> 'cat_test_series' then
    update public.profiles
      set is_premium = true,
          premium_expires_at = greatest(coalesce(premium_expires_at, v_expiry), v_expiry)
      where user_id = v_order.user_id;
  end if;

  update public.razorpay_payment_orders
    set status = 'provisioned',
        entitlement_expires_at = v_expiry,
        provisioned_at = now(),
        last_error_code = null,
        updated_at = now()
    where id = v_order.id;

  return jsonb_build_object(
    'status', 'provisioned', 'order_id', p_razorpay_order_id,
    'payment_id', p_razorpay_payment_id, 'user_id', v_order.user_id,
    'plan', v_order.plan, 'amount_paid_paise', v_order.amount_paid_paise,
    'expires_at', v_expiry
  );
end;
$function$;

create or replace function public.apply_razorpay_referral_commission(p_razorpay_order_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_order public.razorpay_payment_orders%rowtype;
  v_commission numeric;
  v_inserted text;
begin
  perform pg_advisory_xact_lock(hashtext(p_razorpay_order_id), hashtext('razorpay-referral'));
  select * into v_order from public.razorpay_payment_orders
    where razorpay_order_id = p_razorpay_order_id for update;
  if not found or v_order.status <> 'provisioned' then
    raise exception using errcode = 'P0002', message = 'Provisioned payment order is missing';
  end if;
  if v_order.referral_commission_applied then return true; end if;
  if v_order.referral_code is null then
    update public.razorpay_payment_orders set referral_commission_applied = true, updated_at = now() where id = v_order.id;
    return true;
  end if;

  v_commission := case v_order.plan
    when 'monthly' then 75
    when 'quarterly' then 125
    when 'half_yearly' then 150
    when 'yearly' then 200
    when 'cat_test_series' then 100
  end;

  perform 1 from public.campus_ambassadors where referral_code = v_order.referral_code for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Referral ambassador is missing';
  end if;

  insert into public.razorpay_referral_commissions (
    razorpay_payment_id, razorpay_order_id, referral_code, plan, commission_amount
  ) values (
    v_order.razorpay_payment_id, v_order.razorpay_order_id, v_order.referral_code, v_order.plan, v_commission
  ) on conflict (razorpay_payment_id) do nothing
  returning razorpay_payment_id into v_inserted;

  if v_inserted is not null then
    update public.campus_ambassadors
      set total_referrals = coalesce(total_referrals, 0) + 1,
          total_commission = coalesce(total_commission, 0) + v_commission
      where referral_code = v_order.referral_code;
  end if;

  update public.razorpay_payment_orders set referral_commission_applied = true, updated_at = now() where id = v_order.id;
  return true;
end;
$function$;

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

revoke all on function public.provision_razorpay_payment(text, text, bigint, text, timestamptz) from public, anon, authenticated;
revoke all on function public.apply_razorpay_referral_commission(text) from public, anon, authenticated;
revoke all on function public.claim_razorpay_reconciliation_batch(integer) from public, anon, authenticated;
grant execute on function public.provision_razorpay_payment(text, text, bigint, text, timestamptz) to service_role;
grant execute on function public.apply_razorpay_referral_commission(text) to service_role;
grant execute on function public.claim_razorpay_reconciliation_batch(integer) to service_role;

comment on table public.razorpay_payment_orders is
  'Server-created purchase intents and idempotent Razorpay entitlement provisioning ledger.';

commit;
