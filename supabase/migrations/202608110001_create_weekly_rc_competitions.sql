create table if not exists public.weekly_rc_competitions (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  week_end date not null,
  status text not null default 'finalized' check (status in ('finalized')),
  winner_user_id uuid references auth.users(id) on delete set null,
  winner_name text,
  winner_score integer,
  winner_accuracy numeric(6, 2),
  winner_time_seconds integer,
  participant_count integer not null default 0,
  created_at timestamptz not null default now(),
  finalized_at timestamptz not null default now(),
  constraint weekly_rc_valid_dates check (week_end >= week_start)
);

alter table public.weekly_rc_competitions enable row level security;

comment on table public.weekly_rc_competitions is
  'Immutable weekly RC winner snapshots. Current standings are derived from authoritative Daily RC attempt data.';

create or replace function public.enforce_daily_rc_completion_time()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.completed_at = now();
  return new;
end;
$$;

drop trigger if exists enforce_daily_rc_completion_time on public.daily_rc_attempts;
create trigger enforce_daily_rc_completion_time
before insert on public.daily_rc_attempts
for each row execute function public.enforce_daily_rc_completion_time();

comment on function public.enforce_daily_rc_completion_time() is
  'Prevents clients from backdating Daily RC attempts into a different weekly competition.';
