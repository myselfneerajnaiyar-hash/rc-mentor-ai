create table if not exists public.whatsapp_message_events (
  id uuid primary key default gen_random_uuid(),
  meta_message_id text not null,
  event_kind text not null check (event_kind in ('message', 'status')),
  phone text,
  whatsapp_user_id text,
  contact_name text,
  message_type text,
  message_text text,
  direction text not null check (direction in ('incoming', 'outgoing')),
  message_status text not null check (message_status in ('received', 'sent', 'delivered', 'read', 'failed', 'deleted', 'unknown')),
  meta_timestamp timestamptz,
  phone_number_id text,
  raw_event jsonb not null default '{}'::jsonb check (jsonb_typeof(raw_event) = 'object'),
  created_at timestamptz not null default now(),
  unique (meta_message_id, event_kind, message_status)
);

create index if not exists whatsapp_message_events_phone_created_idx
  on public.whatsapp_message_events (phone, created_at desc);

create index if not exists whatsapp_message_events_status_created_idx
  on public.whatsapp_message_events (message_status, created_at desc);

alter table public.whatsapp_message_events enable row level security;

comment on table public.whatsapp_message_events is
  'Service-role-only audit stream for idempotent Meta WhatsApp messages and status webhooks.';
