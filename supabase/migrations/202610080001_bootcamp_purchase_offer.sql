begin;

alter table public.bootcamp_access drop constraint if exists bootcamp_access_source_check;
alter table public.bootcamp_access add constraint bootcamp_access_source_check
  check (source in ('first_free', 'purchase'));
grant update on public.bootcamp_access to service_role;

alter table public.razorpay_payment_orders
  drop constraint if exists razorpay_payment_orders_plan_check;
alter table public.razorpay_payment_orders
  add constraint razorpay_payment_orders_plan_check
  check (plan in ('monthly', 'quarterly', 'half_yearly', 'yearly', 'cat_test_series', 'bootcamp_full_access'));

create or replace function public.provision_bootcamp_payment(
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
  v_expiry timestamptz := '2027-02-05 00:00:00+05:30';
begin
  if p_razorpay_order_id is null or p_razorpay_payment_id is null or p_paid_at is null then
    raise exception using errcode = '22023', message = 'Captured payment details are required';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_razorpay_order_id), hashtext('razorpay-payment'));
  select * into v_order from public.razorpay_payment_orders
    where razorpay_order_id = p_razorpay_order_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Payment order is not registered'; end if;
  if v_order.plan <> 'bootcamp_full_access' or p_amount_paid_paise <> v_order.amount_paid_paise or p_currency <> v_order.currency then
    raise exception using errcode = '22023', message = 'Captured payment does not match the Bootcamp order';
  end if;
  if v_order.razorpay_payment_id is not null and v_order.razorpay_payment_id <> p_razorpay_payment_id then
    raise exception using errcode = '23505', message = 'Order is already linked to another payment';
  end if;
  if v_order.status = 'provisioned' and v_order.razorpay_payment_id = p_razorpay_payment_id then
    update public.bootcamp_access set source = 'purchase', expires_at = v_expiry, updated_at = now()
      where user_id = v_order.user_id and program_key = 'bootcamp';
    if not found then
      insert into public.bootcamp_access(user_id, program_key, source, claimed_at, expires_at)
        values(v_order.user_id, 'bootcamp', 'purchase', p_paid_at, v_expiry);
    end if;
    return jsonb_build_object('status', 'reconciled', 'order_id', p_razorpay_order_id,
      'payment_id', p_razorpay_payment_id, 'user_id', v_order.user_id,
      'plan', v_order.plan, 'amount_paid_paise', v_order.amount_paid_paise, 'expires_at', v_expiry);
  end if;

  insert into public.bootcamp_access(user_id, program_key, source, claimed_at, expires_at)
    values(v_order.user_id, 'bootcamp', 'purchase', p_paid_at, v_expiry)
    on conflict (user_id, program_key) do update
      set source = 'purchase', expires_at = excluded.expires_at, updated_at = now();
  update public.razorpay_payment_orders set razorpay_payment_id = p_razorpay_payment_id,
    paid_at = p_paid_at, status = 'provisioned', entitlement_expires_at = v_expiry,
    provisioned_at = now(), last_error_code = null, updated_at = now()
    where id = v_order.id;
  return jsonb_build_object('status', 'provisioned', 'order_id', p_razorpay_order_id,
    'payment_id', p_razorpay_payment_id, 'user_id', v_order.user_id,
    'plan', v_order.plan, 'amount_paid_paise', v_order.amount_paid_paise, 'expires_at', v_expiry);
end;
$function$;

revoke all on function public.provision_bootcamp_payment(text, text, bigint, text, timestamptz) from public, anon, authenticated;
grant execute on function public.provision_bootcamp_payment(text, text, bigint, text, timestamptz) to service_role;

commit;
