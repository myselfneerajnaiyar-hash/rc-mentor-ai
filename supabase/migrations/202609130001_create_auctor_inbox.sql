create table if not exists public.inbox_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'STUDY_REMINDER', 'DAILY_RECOMMENDATION', 'PERFORMANCE_UPDATE',
    'PROGRESS', 'STREAK', 'ACHIEVEMENT', 'MILESTONE', 'INACTIVITY',
    'EXAM_PREP', 'FEATURE_UPDATE', 'ACCOUNT', 'OFFER', 'TRIAL', 'SYSTEM'
  )),
  source text not null default 'Auctor' check (char_length(source) between 1 and 80),
  title text not null check (char_length(title) between 1 and 180),
  preview text not null default '' check (char_length(preview) <= 320),
  body text not null check (char_length(body) between 1 and 10000),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  action_url text,
  priority smallint not null default 0 check (priority between 0 and 10),
  idempotency_key text,
  read_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_document tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(preview, '') || ' ' || coalesce(body, '') || ' ' || coalesce(source, ''))
  ) stored,
  unique (user_id, idempotency_key)
);

create index if not exists inbox_notifications_user_created_idx
  on public.inbox_notifications (user_id, created_at desc)
  where deleted_at is null;
create index if not exists inbox_notifications_user_unread_idx
  on public.inbox_notifications (user_id, created_at desc)
  where read_at is null and archived_at is null and deleted_at is null;
create index if not exists inbox_notifications_user_type_idx
  on public.inbox_notifications (user_id, type, created_at desc)
  where archived_at is null and deleted_at is null;
create index if not exists inbox_notifications_search_idx
  on public.inbox_notifications using gin (search_document);
alter table public.inbox_notifications enable row level security;

create policy "Users can read their own inbox"
  on public.inbox_notifications for select
  using (auth.uid() = user_id);
create policy "Users can update their own inbox"
  on public.inbox_notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.inbox_notifications from anon;
grant select, update on public.inbox_notifications to authenticated;
grant all on public.inbox_notifications to service_role;

comment on table public.inbox_notifications is
  'Permanent in-product Auctor inbox. Independent from WhatsApp automation.';
