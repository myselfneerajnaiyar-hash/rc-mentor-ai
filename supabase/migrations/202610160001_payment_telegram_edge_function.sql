create schema if not exists private;

create table if not exists private.payment_telegram_notification_dispatches (
  razorpay_payment_id text primary key,
  razorpay_order_id text not null,
  status text not null default 'claimed' check (status in ('claimed', 'sent', 'failed')),
  error_code text,
  claimed_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table private.payment_telegram_notification_dispatches enable row level security;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;
revoke all on private.payment_telegram_notification_dispatches from public, anon, authenticated;
grant select, insert, update on private.payment_telegram_notification_dispatches to service_role;

create or replace function public.claim_payment_telegram_notification(
  p_razorpay_payment_id text,
  p_razorpay_order_id text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_inserted integer;
begin
  if nullif(p_razorpay_payment_id, '') is null or nullif(p_razorpay_order_id, '') is null then
    return false;
  end if;

  insert into private.payment_telegram_notification_dispatches (
    razorpay_payment_id,
    razorpay_order_id
  ) values (
    p_razorpay_payment_id,
    p_razorpay_order_id
  ) on conflict (razorpay_payment_id) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted = 1;
end;
$function$;

create or replace function public.finish_payment_telegram_notification(
  p_razorpay_payment_id text,
  p_status text,
  p_error_code text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_status not in ('sent', 'failed') then
    raise exception 'Invalid notification status';
  end if;

  update private.payment_telegram_notification_dispatches
  set status = p_status,
      error_code = case when p_status = 'failed' then left(p_error_code, 64) else null end,
      completed_at = now()
  where razorpay_payment_id = p_razorpay_payment_id;
end;
$function$;

revoke all on function public.claim_payment_telegram_notification(text, text) from public, anon, authenticated;
revoke all on function public.finish_payment_telegram_notification(text, text, text) from public, anon, authenticated;
grant execute on function public.claim_payment_telegram_notification(text, text) to service_role;
grant execute on function public.finish_payment_telegram_notification(text, text, text) to service_role;

create or replace function private.request_payment_telegram_notification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, net, private
as $function$
declare
  v_signup_trigger text;
  v_headers jsonb;
  v_authorization text;
begin
  select pg_catalog.pg_get_triggerdef(t.oid)
    into v_signup_trigger
  from pg_catalog.pg_trigger t
  where t.tgrelid = 'public.profiles'::regclass
    and t.tgname = 'notify-new-signup'
    and not t.tgisinternal;

  if v_signup_trigger is null then
    raise exception 'Existing signup Edge Function trigger is unavailable';
  end if;

  v_headers := (pg_catalog.regexp_match(
    v_signup_trigger,
    $$http_request\('[^']+', 'POST', '([^']+)'$$
  ))[1]::jsonb;
  v_authorization := v_headers ->> 'Authorization';
  if v_authorization is null or v_authorization not like 'Bearer %' then
    raise exception 'Existing signup Edge Function authorization is unavailable';
  end if;

  perform net.http_post(
    url := 'https://vdsorsyvpgpsquyljnei.supabase.co/functions/v1/notify-payment',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', v_authorization
    ),
    body := jsonb_build_object(
      'type', tg_op,
      'table', tg_table_name,
      'schema', tg_table_schema,
      'record', to_jsonb(new)
    ),
    timeout_milliseconds := 10000
  );
  return new;
end;
$function$;

revoke all on function private.request_payment_telegram_notification() from public, anon, authenticated;

drop trigger if exists purchase_alerts on public.subscriptions;
drop trigger if exists "purchase_ alerts_new" on public.subscriptions;

create trigger purchase_alerts
after insert on public.subscriptions
for each row execute function private.request_payment_telegram_notification();

create trigger "purchase_ alerts_new"
after insert on public.subscriptions
for each row execute function private.request_payment_telegram_notification();
