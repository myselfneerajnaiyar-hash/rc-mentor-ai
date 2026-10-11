begin;

-- CompleteRegistration uses a separate idempotency key from payment events.
-- Signup CAPI is sent only by the service-role dispatcher.
create table public.signup_conversion_dispatches (
  user_id uuid primary key references auth.users(id) on delete cascade,
  event_id text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'unknown')),
  claim_token uuid,
  attempts integer not null default 0 check (attempts >= 0),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'processing') = (claim_token is not null))
);

alter table public.signup_conversion_dispatches enable row level security;
revoke all on public.signup_conversion_dispatches from public, anon, authenticated;
grant select, insert, update on public.signup_conversion_dispatches to service_role;

create or replace function public.claim_signup_conversion_dispatch(
  p_user_id uuid, p_event_id text, p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_claimed boolean := false;
begin
  if p_user_id is null or p_event_id is distinct from ('signup:' || p_user_id::text)
    or p_claim_token is null then
    raise exception using errcode = '22023', message = 'Valid signup conversion claim details are required';
  end if;
  insert into public.signup_conversion_dispatches(user_id, event_id)
  select u.id, p_event_id from auth.users u
  where u.id = p_user_id and u.created_at >= now() - interval '24 hours'
  on conflict (user_id) do nothing;

  update public.signup_conversion_dispatches
  set status = 'processing', claim_token = p_claim_token,
      attempts = attempts + 1, last_error = null, updated_at = now()
  where user_id = p_user_id and event_id = p_event_id
    and status in ('pending', 'failed')
  returning true into v_claimed;
  return coalesce(v_claimed, false);
end;
$function$;

create or replace function public.complete_signup_conversion_dispatch(
  p_user_id uuid, p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.signup_conversion_dispatches
  set status = 'sent', claim_token = null, sent_at = now(), last_error = null, updated_at = now()
  where user_id = p_user_id and status = 'processing' and claim_token = p_claim_token;
  return found;
end;
$function$;

create or replace function public.fail_signup_conversion_dispatch(
  p_user_id uuid, p_claim_token uuid, p_error text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.signup_conversion_dispatches
  set status = 'failed', claim_token = null,
      last_error = left(coalesce(p_error, 'conversion_delivery_failed'), 500), updated_at = now()
  where user_id = p_user_id and status = 'processing' and claim_token = p_claim_token;
  return found;
end;
$function$;

create or replace function public.mark_signup_conversion_dispatch_unknown(
  p_user_id uuid, p_claim_token uuid, p_error text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.signup_conversion_dispatches
  set status = 'unknown', claim_token = null,
      last_error = left(coalesce(p_error, 'conversion_delivery_outcome_unknown'), 500), updated_at = now()
  where user_id = p_user_id and status = 'processing' and claim_token = p_claim_token;
  return found;
end;
$function$;

revoke all on function public.claim_signup_conversion_dispatch(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.complete_signup_conversion_dispatch(uuid, uuid) from public, anon, authenticated;
revoke all on function public.fail_signup_conversion_dispatch(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.mark_signup_conversion_dispatch_unknown(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_signup_conversion_dispatch(uuid, text, uuid) to service_role;
grant execute on function public.complete_signup_conversion_dispatch(uuid, uuid) to service_role;
grant execute on function public.fail_signup_conversion_dispatch(uuid, uuid, text) to service_role;
grant execute on function public.mark_signup_conversion_dispatch_unknown(uuid, uuid, text) to service_role;

notify pgrst, 'reload schema';
commit;
