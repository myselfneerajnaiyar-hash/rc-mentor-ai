begin;

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
      new.trial_expires_at := started_at + make_interval(days => new.trial_days::integer);
    elsif tg_op = 'UPDATE'
       and old.trial_expires_at is null
       and new.trial_expires_at is not null then
      new.trial_started_at := started_at;
      new.trial_expires_at := started_at + make_interval(days => new.trial_days::integer);
    end if;
  end if;

  return new;
end;
$function$;

commit;
