-- Reproducible additive profile attribution patch. Its Meta identifier allowlist is also tracked by migration 20261006021648.
-- Additive first/last-touch storage for the Auctor preview-ad signup flow.
-- The RPC derives identity from auth.uid(); clients cannot write another profile.
begin;

alter table public.profiles
  add column if not exists signup_attribution_first_touch jsonb,
  add column if not exists signup_attribution_first_touch_at timestamptz,
  add column if not exists signup_attribution_last_touch jsonb,
  add column if not exists signup_attribution_last_touch_at timestamptz;

comment on column public.profiles.signup_attribution_first_touch is
  'Allowlisted first-touch campaign and Meta click identifiers; contains no account contact fields.';
comment on column public.profiles.signup_attribution_last_touch is
  'Most recent non-empty allowlisted campaign and Meta click identifiers.';

create or replace function public.capture_signup_attribution(
  p_first_touch jsonb,
  p_last_touch jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  target_user uuid := auth.uid();
  first_value jsonb;
begin
  if target_user is null then
    raise exception 'Authentication required';
  end if;
  if jsonb_typeof(p_first_touch) is distinct from 'object'
     or jsonb_typeof(p_last_touch) is distinct from 'object' then
    raise exception 'Attribution values must be JSON objects';
  end if;

  if exists (
    select 1
    from (
      select key, value from jsonb_each(p_first_touch)
      union all
      select key, value from jsonb_each(p_last_touch)
    ) value_pair
    where key not in ('utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','fbc','fbp','campaign_id','adset_id','ad_id')
       or jsonb_typeof(value) <> 'string'
       or length(value #>> '{}') > 200
       or value #>> '{}' ~ '[[:cntrl:]]'
       or value #>> '{}' ~* '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
       or (left(key, 4) = 'utm_'
           and value #>> '{}' ~ '(^|[^[:alnum:]])[+]?[0-9]([[:space:]().-]*[0-9]){9,}([^[:alnum:]]|$)')
       or (key = 'fbc' and value #>> '{}' !~ '^fb\.\d{1,3}\.\d{8,16}\.[A-Za-z0-9_-]{1,160}$')
       or (key = 'fbp' and value #>> '{}' !~ '^fb\.\d{1,3}\.\d{8,16}\.\d{1,24}$')
        or (key in ('fbclid','campaign_id','adset_id','ad_id') and value #>> '{}' !~ '^[A-Za-z0-9._-]{1,200}$')
  ) then
    raise exception 'Invalid attribution value';
  end if;

  first_value := coalesce(nullif(p_first_touch, '{}'::jsonb), nullif(p_last_touch, '{}'::jsonb), '{}'::jsonb);

  update public.profiles
  set signup_attribution_first_touch = case
        when coalesce(signup_attribution_first_touch, '{}'::jsonb) = '{}'::jsonb and first_value <> '{}'::jsonb then first_value
        else signup_attribution_first_touch
      end,
      signup_attribution_first_touch_at = case
        when coalesce(signup_attribution_first_touch, '{}'::jsonb) = '{}'::jsonb and first_value <> '{}'::jsonb then now()
        else signup_attribution_first_touch_at
      end,
      signup_attribution_last_touch = case
        when p_last_touch <> '{}'::jsonb then p_last_touch
        else signup_attribution_last_touch
      end,
      signup_attribution_last_touch_at = case
        when p_last_touch <> '{}'::jsonb then now()
        else signup_attribution_last_touch_at
      end
  where user_id = target_user;
end;
$function$;

revoke all on function public.capture_signup_attribution(jsonb, jsonb) from public;
revoke all on function public.capture_signup_attribution(jsonb, jsonb) from anon;
grant execute on function public.capture_signup_attribution(jsonb, jsonb) to authenticated;

commit;
