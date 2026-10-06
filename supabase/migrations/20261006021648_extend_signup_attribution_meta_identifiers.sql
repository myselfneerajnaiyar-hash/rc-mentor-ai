-- Allow campaign, ad set, and ad IDs in the existing first/last-touch JSON fields.
CREATE OR REPLACE FUNCTION public.capture_signup_attribution(
  p_first_touch jsonb,
  p_last_touch jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  target_user uuid := auth.uid();
  first_value jsonb;
BEGIN
  IF target_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF jsonb_typeof(p_first_touch) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_last_touch) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Attribution values must be JSON objects';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT key, value FROM jsonb_each(p_first_touch)
      UNION ALL
      SELECT key, value FROM jsonb_each(p_last_touch)
    ) value_pair
    WHERE key NOT IN ('utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','fbc','fbp','campaign_id','adset_id','ad_id')
       OR jsonb_typeof(value) <> 'string'
       OR length(value #>> '{}') > 200
       OR value #>> '{}' ~ '[[:cntrl:]]'
       OR value #>> '{}' ~* '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
       OR (left(key, 4) = 'utm_'
           AND value #>> '{}' ~ '(^|[^[:alnum:]])[+]?[0-9]([[:space:]().-]*[0-9]){9,}([^[:alnum:]]|$)')
       OR (key = 'fbc' AND value #>> '{}' !~ '^fb\.\d{1,3}\.\d{8,16}\.[A-Za-z0-9_-]{1,160}$')
       OR (key = 'fbp' AND value #>> '{}' !~ '^fb\.\d{1,3}\.\d{8,16}\.\d{1,24}$')
       OR (key IN ('fbclid','campaign_id','adset_id','ad_id') AND value #>> '{}' !~ '^[A-Za-z0-9._-]{1,200}$')
  ) THEN
    RAISE EXCEPTION 'Invalid attribution value';
  END IF;

  first_value := COALESCE(NULLIF(p_first_touch, '{}'::jsonb), NULLIF(p_last_touch, '{}'::jsonb), '{}'::jsonb);

  UPDATE public.profiles
  SET signup_attribution_first_touch = CASE
        WHEN COALESCE(signup_attribution_first_touch, '{}'::jsonb) = '{}'::jsonb AND first_value <> '{}'::jsonb THEN first_value
        ELSE signup_attribution_first_touch
      END,
      signup_attribution_first_touch_at = CASE
        WHEN COALESCE(signup_attribution_first_touch, '{}'::jsonb) = '{}'::jsonb AND first_value <> '{}'::jsonb THEN now()
        ELSE signup_attribution_first_touch_at
      END,
      signup_attribution_last_touch = CASE
        WHEN p_last_touch <> '{}'::jsonb THEN p_last_touch
        ELSE signup_attribution_last_touch
      END,
      signup_attribution_last_touch_at = CASE
        WHEN p_last_touch <> '{}'::jsonb THEN now()
        ELSE signup_attribution_last_touch_at
      END
  WHERE user_id = target_user;
END;
$function$;

REVOKE ALL ON FUNCTION public.capture_signup_attribution(jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.capture_signup_attribution(jsonb, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.capture_signup_attribution(jsonb, jsonb) TO authenticated;
