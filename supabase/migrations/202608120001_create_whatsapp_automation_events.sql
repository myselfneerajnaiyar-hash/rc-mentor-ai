create table if not exists public.whatsapp_automation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'trial_welcome',
    'trial_no_session',
    'trial_day1',
    'trial_day2',
    'trial_day3',
    'trial_day4_discount',
    'trial_day7_discount_expiry'
  )),
  lifecycle_key text not null check (length(trim(lifecycle_key)) > 0),
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in (
    'pending', 'processing', 'sent', 'failed', 'cancelled'
  )),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  phone_snapshot text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  next_attempt_at timestamptz,
  locked_at timestamptz,
  locked_by text,
  claim_token uuid,
  sent_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  meta_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (attempt_count <= max_attempts),
  check (
    (status = 'processing' and locked_at is not null and locked_by is not null and claim_token is not null)
    or
    (status <> 'processing' and locked_at is null and locked_by is null and claim_token is null)
  ),
  check (status <> 'sent' or sent_at is not null),
  check (status <> 'cancelled' or cancelled_at is not null),
  unique (user_id, event_type, lifecycle_key)
);

comment on table public.whatsapp_automation_events is
  'Server-managed lifecycle automation queue. No browser access policies are defined.';

create unique index if not exists whatsapp_events_meta_message_id_unique
  on public.whatsapp_automation_events (meta_message_id)
  where meta_message_id is not null;

create index if not exists whatsapp_events_pending_due_idx
  on public.whatsapp_automation_events (scheduled_for, next_attempt_at)
  where status = 'pending';

create index if not exists whatsapp_events_user_status_idx
  on public.whatsapp_automation_events (user_id, status);

create index if not exists whatsapp_events_stale_processing_idx
  on public.whatsapp_automation_events (locked_at)
  where status = 'processing';

create index if not exists whatsapp_events_retryable_failed_idx
  on public.whatsapp_automation_events (next_attempt_at)
  where status = 'failed';

alter table public.whatsapp_automation_events enable row level security;

create or replace function public.set_whatsapp_automation_event_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_whatsapp_automation_event_updated_at
  on public.whatsapp_automation_events;
create trigger set_whatsapp_automation_event_updated_at
before update on public.whatsapp_automation_events
for each row execute function public.set_whatsapp_automation_event_updated_at();

create or replace function public.claim_due_whatsapp_automation_events(
  p_locked_by text,
  p_batch_size integer default 20
)
returns setof public.whatsapp_automation_events
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_locked_by is null or length(trim(p_locked_by)) = 0 then
    raise exception 'locked_by is required';
  end if;

  return query
  with due as (
    select id
    from public.whatsapp_automation_events
    where status = 'pending'
      and scheduled_for <= now()
      and (next_attempt_at is null or next_attempt_at <= now())
      and attempt_count < max_attempts
    order by scheduled_for, created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_batch_size, 20), 100))
  )
  update public.whatsapp_automation_events event
  set status = 'processing',
      locked_at = now(),
      locked_by = p_locked_by,
      claim_token = gen_random_uuid(),
      attempt_count = event.attempt_count + 1,
      last_error = null
  from due
  where event.id = due.id
  returning event.*;
end;
$$;

create or replace function public.recover_stale_whatsapp_automation_events(
  p_stale_before timestamptz
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  recovered_count integer;
begin
  if p_stale_before is null then
    raise exception 'stale_before is required';
  end if;

  update public.whatsapp_automation_events
  set status = case when attempt_count < max_attempts then 'pending' else 'failed' end,
      next_attempt_at = case when attempt_count < max_attempts then now() else next_attempt_at end,
      locked_at = null,
      locked_by = null,
      claim_token = null,
      last_error = coalesce(last_error, 'Recovered stale processing lock')
  where status = 'processing'
    and locked_at is not null
    and locked_at < p_stale_before;

  get diagnostics recovered_count = row_count;
  return recovered_count;
end;
$$;

create or replace function public.mark_whatsapp_automation_event_sent(
  p_event_id uuid,
  p_claim_token uuid,
  p_meta_message_id text default null
)
returns setof public.whatsapp_automation_events
language sql
security definer
set search_path = public
as $$
  update public.whatsapp_automation_events
  set status = 'sent',
      sent_at = now(),
      meta_message_id = p_meta_message_id,
      next_attempt_at = null,
      locked_at = null,
      locked_by = null,
      claim_token = null
  where id = p_event_id
    and status = 'processing'
    and claim_token = p_claim_token
  returning *;
$$;

create or replace function public.mark_whatsapp_automation_event_failed(
  p_event_id uuid,
  p_claim_token uuid,
  p_error_message text
)
returns setof public.whatsapp_automation_events
language sql
security definer
set search_path = public
as $$
  update public.whatsapp_automation_events
  set status = case when attempt_count < max_attempts then 'pending' else 'failed' end,
      next_attempt_at = case
        when attempt_count >= max_attempts then null
        when attempt_count = 1 then now() + interval '5 minutes'
        when attempt_count = 2 then now() + interval '15 minutes'
        when attempt_count = 3 then now() + interval '30 minutes'
        else now() + interval '60 minutes'
      end,
      last_error = coalesce(nullif(p_error_message, ''), 'Unknown error'),
      locked_at = null,
      locked_by = null,
      claim_token = null
  where id = p_event_id
    and status = 'processing'
    and claim_token = p_claim_token
  returning *;
$$;

create or replace function public.mark_whatsapp_automation_event_cancelled(
  p_event_id uuid,
  p_claim_token uuid,
  p_reason text default 'cancelled'
)
returns setof public.whatsapp_automation_events
language sql
security definer
set search_path = public
as $$
  update public.whatsapp_automation_events
  set status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = coalesce(nullif(p_reason, ''), 'cancelled'),
      next_attempt_at = null,
      locked_at = null,
      locked_by = null,
      claim_token = null
  where id = p_event_id
    and status = 'processing'
    and claim_token = p_claim_token
  returning *;
$$;

revoke all on function public.claim_due_whatsapp_automation_events(text, integer) from public;
revoke all on function public.recover_stale_whatsapp_automation_events(timestamptz) from public;
revoke all on function public.mark_whatsapp_automation_event_sent(uuid, uuid, text) from public;
revoke all on function public.mark_whatsapp_automation_event_failed(uuid, uuid, text) from public;
revoke all on function public.mark_whatsapp_automation_event_cancelled(uuid, uuid, text) from public;
grant execute on function public.claim_due_whatsapp_automation_events(text, integer) to service_role;
grant execute on function public.recover_stale_whatsapp_automation_events(timestamptz) to service_role;
grant execute on function public.mark_whatsapp_automation_event_sent(uuid, uuid, text) to service_role;
grant execute on function public.mark_whatsapp_automation_event_failed(uuid, uuid, text) to service_role;
grant execute on function public.mark_whatsapp_automation_event_cancelled(uuid, uuid, text) to service_role;
