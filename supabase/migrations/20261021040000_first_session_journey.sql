create table if not exists public.first_session_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  phase text not null default 'PROFILE_COMPLETE'
    check (phase in (
      'PROFILE_COMPLETE',
      'DIAGNOSTIC_NOT_STARTED',
      'DIAGNOSTIC_IN_PROGRESS',
      'DIAGNOSTIC_COMPLETED',
      'DIAGNOSIS_VIEWED',
      'DAILY_RC_MISSION',
      'DAILY_RC_COMPLETED',
      'NORMAL_HOME'
    )),
  diagnostic_set_id uuid references public.daily_rc_sets(id),
  diagnostic_started_at timestamptz,
  diagnostic_deadline_at timestamptz,
  diagnostic_completed_at timestamptz,
  diagnostic_answers jsonb not null default '[]'::jsonb,
  reading_events jsonb not null default '[]'::jsonb,
  diagnostic_score integer,
  diagnostic_time_taken_seconds integer,
  mission_challenge_date date,
  mission_started_at timestamptz,
  mission_daily_set_id uuid,
  mission_daily_attempt_id uuid,
  mission_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists first_session_journeys_phase_idx
  on public.first_session_journeys (phase);

alter table public.first_session_journeys enable row level security;
revoke all on public.first_session_journeys from anon, authenticated;
grant select on public.first_session_journeys to authenticated;
grant all on public.first_session_journeys to service_role;

drop policy if exists "Users can read own first session journey" on public.first_session_journeys;
create policy "Users can read own first session journey"
  on public.first_session_journeys
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.create_first_session_journey_for_completed_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profile_completed is distinct from true then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if coalesce(old.profile_completed, false) then
      return new;
    end if;
  end if;

  insert into public.first_session_journeys (user_id, phase)
  values (new.user_id, 'PROFILE_COMPLETE')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists profiles_create_first_session_journey on public.profiles;
create trigger profiles_create_first_session_journey
  after insert or update of profile_completed on public.profiles
  for each row
  execute function public.create_first_session_journey_for_completed_profile();

revoke all on function public.create_first_session_journey_for_completed_profile() from public, anon, authenticated;
