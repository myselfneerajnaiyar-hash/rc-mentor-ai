begin;

-- Only server-created orders after the bundle launch receive version 1.
-- NULL preserves the meaning of every historical Boot Camp and quarterly order.
alter table public.razorpay_payment_orders
  add column if not exists entitlement_bundle_version smallint,
  add column if not exists bundle_entitlement_expires_at timestamptz;

alter table public.razorpay_payment_orders
  drop constraint if exists razorpay_payment_orders_bundle_version_check;
alter table public.razorpay_payment_orders
  add constraint razorpay_payment_orders_bundle_version_check
  check (entitlement_bundle_version is null or
    (entitlement_bundle_version = 1 and plan in ('quarterly', 'bootcamp_full_access')));
alter table public.razorpay_payment_orders
  drop constraint if exists razorpay_payment_orders_bundle_expiry_check;
alter table public.razorpay_payment_orders
  add constraint razorpay_payment_orders_bundle_expiry_check
  check (bundle_entitlement_expires_at is null or
    (entitlement_bundle_version = 1 and status = 'provisioned'));

-- A new quarterly order already receives its three-month platform subscription
-- through provision_razorpay_payment. This RPC adds Boot Camp access only for
-- explicitly tagged, verified bundle orders. Replays do not extend the term.
create or replace function public.provision_quarterly_bootcamp_bundle(
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
  v_expiry timestamptz;
begin
  if p_razorpay_order_id is null or p_razorpay_payment_id is null or p_paid_at is null then
    raise exception using errcode = '22023', message = 'Captured payment details are required';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_razorpay_order_id), hashtext('razorpay-payment'));
  select * into v_order from public.razorpay_payment_orders
    where razorpay_order_id = p_razorpay_order_id for update;
  if not found or v_order.status <> 'provisioned' then
    raise exception using errcode = 'P0002', message = 'Provisioned payment order is missing';
  end if;
  if v_order.plan <> 'quarterly' or v_order.entitlement_bundle_version is distinct from 1 then
    raise exception using errcode = '22023', message = 'Order is not a bundled quarterly purchase';
  end if;
  if v_order.razorpay_payment_id is distinct from p_razorpay_payment_id
    or v_order.amount_paid_paise is distinct from p_amount_paid_paise
    or v_order.currency is distinct from p_currency
    or v_order.paid_at is distinct from p_paid_at
    or v_order.entitlement_expires_at is null then
    raise exception using errcode = '22023', message = 'Captured payment does not match the bundled quarterly order';
  end if;
  -- Do not mark a quarterly order as combined unless the normal provisioner
  -- committed its matching platform subscription first.
  if not exists (
    select 1 from public.subscriptions s
    where s.razorpay_payment_id = p_razorpay_payment_id
      and s.user_id = v_order.user_id and s.plan = 'quarterly'
      and s.expires_at = (v_order.entitlement_expires_at at time zone 'UTC')
  ) then
    raise exception using errcode = 'P0002', message = 'Quarterly platform entitlement is not provisioned';
  end if;

  v_expiry := coalesce(v_order.bundle_entitlement_expires_at, v_order.entitlement_expires_at);
  insert into public.bootcamp_access(user_id, program_key, source, claimed_at, expires_at)
    values (v_order.user_id, 'bootcamp', 'purchase', p_paid_at, v_expiry)
    on conflict (user_id, program_key) do update
      set source = 'purchase',
          expires_at = greatest(coalesce(public.bootcamp_access.expires_at, excluded.expires_at), excluded.expires_at),
          updated_at = now();
  update public.razorpay_payment_orders
    set bundle_entitlement_expires_at = v_expiry, updated_at = now()
    where id = v_order.id;
  return jsonb_build_object('status', 'provisioned', 'order_id', p_razorpay_order_id,
    'payment_id', p_razorpay_payment_id, 'plan', v_order.plan, 'expires_at', v_expiry);
end;
$function$;

-- Bundled Boot Camp orders use this atomic RPC instead of the legacy
-- provision_bootcamp_payment path. That legacy RPC resets Boot Camp expiry to
-- its fixed program date on every replay; this path preserves any later paid
-- Boot Camp expiry while granting both parts of the bundle together.
create or replace function public.provision_bootcamp_platform_bundle(
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
  v_base timestamptz;
  v_active_expiry timestamptz;
  v_expiry timestamptz;
  v_bootcamp_expiry timestamptz;
  v_access_expiry timestamptz;
  v_subscription_expiry timestamp without time zone;
  v_existing_user uuid;
  v_existing_plan text;
  v_was_provisioned boolean;
begin
  if p_razorpay_order_id is null or p_razorpay_payment_id is null or p_paid_at is null then
    raise exception using errcode = '22023', message = 'Captured payment details are required';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_razorpay_order_id), hashtext('razorpay-payment'));
  select * into v_order from public.razorpay_payment_orders
    where razorpay_order_id = p_razorpay_order_id for update;
  if not found or v_order.status not in ('created', 'provisioned') then
    raise exception using errcode = 'P0002', message = 'Registered payment order is not ready for provisioning';
  end if;
  if v_order.plan <> 'bootcamp_full_access' or v_order.entitlement_bundle_version is distinct from 1 then
    raise exception using errcode = '22023', message = 'Order is not a bundled Boot Camp purchase';
  end if;
  if v_order.amount_paid_paise is distinct from p_amount_paid_paise
    or v_order.currency is distinct from p_currency then
    raise exception using errcode = '22023', message = 'Captured payment does not match the bundled Boot Camp order';
  end if;
  v_was_provisioned := v_order.status = 'provisioned';
  if v_was_provisioned then
    if v_order.razorpay_payment_id is distinct from p_razorpay_payment_id
      or v_order.paid_at is distinct from p_paid_at then
      raise exception using errcode = '22023', message = 'Captured payment timestamp does not match the bundled Boot Camp order';
    end if;
  elsif v_order.razorpay_payment_id is not null then
    raise exception using errcode = '23505', message = 'Order is already linked to another payment';
  end if;
  select * into v_profile from public.profiles where user_id = v_order.user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Registered payment user profile is missing'; end if;

  v_bootcamp_expiry := coalesce(v_order.entitlement_expires_at, '2027-02-05 00:00:00+05:30'::timestamptz);
  insert into public.bootcamp_access(user_id, program_key, source, claimed_at, expires_at)
    values (v_order.user_id, 'bootcamp', 'purchase', p_paid_at, v_bootcamp_expiry)
    on conflict (user_id, program_key) do update
      set source = 'purchase',
          expires_at = greatest(coalesce(public.bootcamp_access.expires_at, excluded.expires_at), excluded.expires_at),
          updated_at = now()
    returning expires_at into v_access_expiry;
  v_bootcamp_expiry := v_access_expiry;

  v_expiry := v_order.bundle_entitlement_expires_at;
  if v_expiry is null then
    select max(expires_at at time zone 'UTC') into v_active_expiry from public.subscriptions
      where user_id = v_order.user_id
        and razorpay_payment_id is distinct from p_razorpay_payment_id;
    v_base := greatest(now(), p_paid_at,
      coalesce(v_profile.premium_expires_at, now()), coalesce(v_active_expiry, now()));
    v_expiry := v_base + interval '3 months';
  end if;

  select s.user_id, s.plan, s.expires_at into v_existing_user, v_existing_plan, v_subscription_expiry
    from public.subscriptions s where s.razorpay_payment_id = p_razorpay_payment_id for update;
  if found and (v_existing_user is distinct from v_order.user_id or v_existing_plan is distinct from 'quarterly') then
    raise exception using errcode = '23505', message = 'Payment is already linked to a different subscription';
  end if;
  if v_subscription_expiry is not null then
    v_expiry := greatest(v_expiry, v_subscription_expiry at time zone 'UTC');
  end if;

  -- quarterly is the existing full-platform subscription plan. The purchase
  -- order itself remains bootcamp_full_access for historical/reporting meaning.
  insert into public.subscriptions (
    user_id, name, email, phone, exam, attempt_year, plan, expires_at, referral_code, razorpay_payment_id
  ) values (
    v_order.user_id, coalesce(v_profile.name, ''), coalesce(v_profile.email, ''),
    coalesce(v_profile.phone, ''), coalesce(v_profile.exam, ''),
    case when trim(coalesce(v_profile.attempt_year, '')) ~ '^[0-9]+$'
      and length(trim(v_profile.attempt_year)) <= 10
      and trim(v_profile.attempt_year)::numeric <= 2147483647
      then trim(v_profile.attempt_year)::integer else null end,
    'quarterly', v_expiry at time zone 'UTC', v_order.referral_code, p_razorpay_payment_id
  ) on conflict (razorpay_payment_id) do update
    set expires_at = greatest(coalesce(public.subscriptions.expires_at, excluded.expires_at), excluded.expires_at)
    returning expires_at into v_subscription_expiry;
  v_expiry := v_subscription_expiry at time zone 'UTC';

  update public.profiles set is_premium = true,
    premium_expires_at = greatest(coalesce(premium_expires_at, v_expiry), v_expiry)
    where user_id = v_order.user_id;
  update public.razorpay_payment_orders set razorpay_payment_id = p_razorpay_payment_id,
    paid_at = p_paid_at, status = 'provisioned',
    entitlement_expires_at = v_bootcamp_expiry, bundle_entitlement_expires_at = v_expiry,
    provisioned_at = coalesce(provisioned_at, now()), last_error_code = null, updated_at = now()
    where id = v_order.id;

  return jsonb_build_object('status', case when v_was_provisioned then 'reconciled' else 'provisioned' end,
    'order_id', p_razorpay_order_id,
    'payment_id', p_razorpay_payment_id, 'plan', v_order.plan, 'expires_at', v_expiry);
end;
$function$;

revoke all on function public.provision_quarterly_bootcamp_bundle(text, text, bigint, text, timestamptz) from public, anon, authenticated;
revoke all on function public.provision_bootcamp_platform_bundle(text, text, bigint, text, timestamptz) from public, anon, authenticated;
grant execute on function public.provision_quarterly_bootcamp_bundle(text, text, bigint, text, timestamptz) to service_role;
grant execute on function public.provision_bootcamp_platform_bundle(text, text, bigint, text, timestamptz) to service_role;

notify pgrst, 'reload schema';
commit;
