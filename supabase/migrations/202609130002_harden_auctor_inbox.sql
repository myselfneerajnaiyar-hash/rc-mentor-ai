-- Additive hardening: the original table already exists in production.
-- Review migration history and existing policies before applying. No rows are deleted.
begin;
alter table public.inbox_notifications add column if not exists proactive_date date;
alter table public.inbox_notifications add column if not exists rule_key text;
create unique index if not exists inbox_notifications_daily_cap_idx
  on public.inbox_notifications (user_id, proactive_date) where proactive_date is not null;
create unique index if not exists inbox_notifications_rule_key_idx
  on public.inbox_notifications (user_id, rule_key) where rule_key is not null;
create index if not exists inbox_notifications_cursor_idx
  on public.inbox_notifications (user_id, priority desc, created_at desc, id desc);
create index if not exists inbox_notifications_history_idx
  on public.inbox_notifications (user_id, created_at desc);
-- All mutations go through authenticated, ownership-scoped server APIs. Users retain SELECT only.
revoke all on public.inbox_notifications from authenticated, anon, public;
grant select on public.inbox_notifications to authenticated;
revoke update (id,user_id,type,source,title,preview,body,metadata,action_url,priority,idempotency_key,read_at,archived_at,deleted_at,created_at,updated_at,search_document,proactive_date,rule_key)
  on public.inbox_notifications from authenticated, anon, public;
drop policy if exists "Users can update their own inbox" on public.inbox_notifications;
drop policy if exists "Inbox ownership boundary" on public.inbox_notifications;
create policy "Inbox ownership boundary" on public.inbox_notifications as restrictive
  for select to authenticated using (auth.uid() = user_id);

create table if not exists public.inbox_generation_runs (
  id uuid primary key default gen_random_uuid(),
  date_key date not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running','complete','partial','failed')),
  considered integer not null default 0,
  created integer not null default 0,
  skipped integer not null default 0,
  failed integer not null default 0,
  last_user_id uuid,
  error text
);
alter table public.inbox_generation_runs enable row level security;
revoke all on public.inbox_generation_runs from anon, authenticated, public;
grant all on public.inbox_generation_runs to service_role;
create index if not exists inbox_generation_runs_started_idx on public.inbox_generation_runs (started_at desc);
-- Assign a proactive day even for future server producers that omit it.
create or replace function public.inbox_assign_proactive_day() returns trigger
language plpgsql set search_path = public as $inbox$
begin
  if new.proactive_date is not null or new.type in ('STUDY_REMINDER','DAILY_RECOMMENDATION','PERFORMANCE_UPDATE','PROGRESS','STREAK','INACTIVITY','EXAM_PREP') then
    new.proactive_date := (new.created_at at time zone 'Asia/Kolkata')::date;
  end if;
  return new;
end;
$inbox$;
revoke all on function public.inbox_assign_proactive_day() from public, anon, authenticated;
drop trigger if exists inbox_assign_proactive_day on public.inbox_notifications;
create trigger inbox_assign_proactive_day before insert on public.inbox_notifications
  for each row execute function public.inbox_assign_proactive_day();
commit;
