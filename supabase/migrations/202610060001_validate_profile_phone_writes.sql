begin;

create or replace function public.validate_profile_phone_e164()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Authenticated clients submit the exact ten digits the student entered.
  -- Store those digits in the existing canonical E.164 format.
  if current_user = 'authenticated' then
    if new.phone is null or new.phone = '' then
      if new.profile_completed then
        raise exception 'A phone number is required to complete a profile'
          using errcode = '23514';
      end if;
      return new;
    end if;

    if new.phone !~ '^[0-9]{10}$' then
      raise exception 'Phone number must contain exactly 10 digits'
        using errcode = '23514';
    end if;

    new.phone := '+91' || new.phone;
    return new;
  end if;

  -- Older, incomplete profiles can still have no phone. Completed onboarding
  -- always requires the canonical E.164 value written by the welcome flow.
  if new.phone is null or new.phone = '' then
    if new.profile_completed then
      raise exception 'A phone number is required to complete a profile'
        using errcode = '23514';
    end if;
    return new;
  end if;

  if new.phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Phone number must be stored in E.164 format'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_validate_phone_before_write on public.profiles;
create trigger profiles_validate_phone_before_write
before insert or update of phone, profile_completed on public.profiles
for each row execute function public.validate_profile_phone_e164();

commit;
