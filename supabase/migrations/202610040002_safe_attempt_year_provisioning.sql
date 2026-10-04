begin;

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
  select * into v_order from public.razorpay_payment_orders where razorpay_order_id = p_razorpay_order_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Payment order is not registered'; end if;
  if p_amount_paid_paise <> v_order.amount_paid_paise or p_currency <> v_order.currency then
    raise exception using errcode = '22023', message = 'Captured payment does not match the registered order';
  end if;
  if v_order.razorpay_payment_id is not null and v_order.razorpay_payment_id <> p_razorpay_payment_id then
    raise exception using errcode = '23505', message = 'Order is already linked to another payment';
  end if;
  if p_paid_at is null then raise exception using errcode = '22023', message = 'Captured payment timestamp is required'; end if;
  select * into v_profile from public.profiles where user_id = v_order.user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Registered payment user profile is missing'; end if;

  if v_order.status = 'provisioned' then
    if v_order.razorpay_payment_id <> p_razorpay_payment_id then
      raise exception using errcode = '23505', message = 'Provisioned order is linked to a different payment';
    end if;
    v_expiry := v_order.entitlement_expires_at;
    update public.subscriptions set user_id = v_order.user_id, plan = v_order.plan, expires_at = v_expiry
      where razorpay_payment_id = p_razorpay_payment_id;
    get diagnostics v_existing_count = row_count;
    if v_existing_count = 0 then
      insert into public.subscriptions (
        user_id, name, email, phone, exam, attempt_year, plan, expires_at, referral_code, razorpay_payment_id
      ) values (
        v_order.user_id, coalesce(v_profile.name, ''), coalesce(v_profile.email, ''),
        coalesce(v_profile.phone, ''), coalesce(v_profile.exam, ''),
        case when trim(coalesce(v_profile.attempt_year, '')) ~ '^[0-9]+$'
          and length(trim(v_profile.attempt_year)) <= 10
          and trim(v_profile.attempt_year)::numeric <= 2147483647
          then trim(v_profile.attempt_year)::integer else null end,
        v_order.plan, v_expiry, v_order.referral_code, p_razorpay_payment_id
      );
    end if;
    if v_order.plan <> 'cat_test_series' then
      update public.profiles set is_premium = true,
        premium_expires_at = greatest(coalesce(premium_expires_at, v_expiry), v_expiry)
        where user_id = v_order.user_id;
    end if;
    update public.razorpay_payment_orders set last_error_code = null, updated_at = now() where id = v_order.id;
    return jsonb_build_object('status', 'reconciled', 'order_id', p_razorpay_order_id,
      'payment_id', p_razorpay_payment_id, 'user_id', v_order.user_id, 'plan', v_order.plan,
      'amount_paid_paise', v_order.amount_paid_paise, 'expires_at', v_expiry);
  end if;

  update public.razorpay_payment_orders set razorpay_payment_id = p_razorpay_payment_id,
    paid_at = p_paid_at, updated_at = now() where id = v_order.id;
  select max(expires_at) into v_active_expiry from public.subscriptions
    where user_id = v_order.user_id and expires_at > now();
  v_base := greatest(now(), p_paid_at, coalesce(v_profile.premium_expires_at, now()), coalesce(v_active_expiry, now()));
  v_expiry := v_base + case v_order.plan
    when 'monthly' then interval '1 month' when 'quarterly' then interval '3 months'
    when 'half_yearly' then interval '6 months' when 'yearly' then interval '1 year'
    when 'cat_test_series' then interval '1 year' end;
  insert into public.subscriptions (
    user_id, name, email, phone, exam, attempt_year, plan, expires_at, referral_code, razorpay_payment_id
  ) values (
    v_order.user_id, coalesce(v_profile.name, ''), coalesce(v_profile.email, ''),
    coalesce(v_profile.phone, ''), coalesce(v_profile.exam, ''),
    case when trim(coalesce(v_profile.attempt_year, '')) ~ '^[0-9]+$'
      and length(trim(v_profile.attempt_year)) <= 10
      and trim(v_profile.attempt_year)::numeric <= 2147483647
      then trim(v_profile.attempt_year)::integer else null end,
    v_order.plan, v_expiry, v_order.referral_code, p_razorpay_payment_id
  );
  if v_order.plan <> 'cat_test_series' then
    update public.profiles set is_premium = true,
      premium_expires_at = greatest(coalesce(premium_expires_at, v_expiry), v_expiry)
      where user_id = v_order.user_id;
  end if;
  update public.razorpay_payment_orders set status = 'provisioned', entitlement_expires_at = v_expiry,
    provisioned_at = now(), last_error_code = null, updated_at = now() where id = v_order.id;
  return jsonb_build_object('status', 'provisioned', 'order_id', p_razorpay_order_id,
    'payment_id', p_razorpay_payment_id, 'user_id', v_order.user_id, 'plan', v_order.plan,
    'amount_paid_paise', v_order.amount_paid_paise, 'expires_at', v_expiry);
end;
$function$;

revoke all on function public.provision_razorpay_payment(text, text, bigint, text, timestamptz) from public, anon, authenticated;
grant execute on function public.provision_razorpay_payment(text, text, bigint, text, timestamptz) to service_role;

commit;
