begin;

create table public.bootcamp_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  program_key text not null default 'bootcamp',
  source text not null check (source = 'first_free'),
  claimed_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, program_key)
);

alter table public.bootcamp_access enable row level security;
revoke all on public.bootcamp_access from public, anon, authenticated;
grant select, insert on public.bootcamp_access to service_role;

comment on table public.bootcamp_access is
  'One-time Boot Camp first-free claims. Active paid and institute access is resolved from its authoritative entitlement source.';

commit;
