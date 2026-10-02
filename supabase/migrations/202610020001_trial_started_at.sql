-- Canonical server-time start for newly created trials.
-- Existing trials are intentionally not backfilled because their start time
-- cannot be reconstructed reliably from trial_expires_at alone.
begin;

alter table public.profiles
  add column if not exists trial_started_at timestamptz;

comment on column public.profiles.trial_started_at is
  'Server timestamp when the profile first entered its current trial; legacy trials may remain null.';

create or replace function public.set_profile_trial_timestamps()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  started_at timestamptz := statement_timestamp();
begin
  if new.trial_days is not null and new.trial_days > 0 and new.trial_started_at is null then
    if tg_op = 'INSERT' and new.trial_expires_at is not null then
      new.trial_started_at := started_at;
      new.trial_expires_at := started_at + make_interval(days => new.trial_days);
    elsif tg_op = 'UPDATE'
       and old.trial_expires_at is null
       and new.trial_expires_at is not null then
      new.trial_started_at := started_at;
      new.trial_expires_at := started_at + make_interval(days => new.trial_days);
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists profiles_set_trial_timestamps on public.profiles;
create trigger profiles_set_trial_timestamps
before insert or update of trial_days, trial_expires_at, trial_started_at
on public.profiles
for each row
execute function public.set_profile_trial_timestamps();

commit;
