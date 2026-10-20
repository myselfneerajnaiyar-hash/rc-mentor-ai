-- Extend the existing first/last-touch allowlist and the existing lead snapshot
-- consumed by the external student-lead sync worker. No new sync path is added.

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
    WHERE key NOT IN ('utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid','fbc','fbp','campaign_id','adset_id','ad_id','referrer')
       OR jsonb_typeof(value) <> 'string'
       OR length(value #>> '{}') > 200
       OR value #>> '{}' ~ '[[:cntrl:]]'
       OR value #>> '{}' ~* '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
       OR (left(key, 4) = 'utm_'
           AND (value #>> '{}') !~ '^[[:alnum:]_.:/+ -]+$')
       OR (left(key, 4) = 'utm_'
           AND value #>> '{}' ~ '(^|[^[:alnum:]])[+]?[0-9]([[:space:]().-]*[0-9]){9,}([^[:alnum:]]|$)')
       OR (key = 'referrer' AND value #>> '{}' !~* '^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$')
       OR (key = 'fbc' AND value #>> '{}' !~ '^fb\.\d{1,3}\.\d{8,16}\.[A-Za-z0-9_-]{1,160}$')
       OR (key = 'fbp' AND value #>> '{}' !~ '^fb\.\d{1,3}\.\d{8,16}\.\d{1,24}$')
       OR (key IN ('gclid','fbclid','campaign_id','adset_id','ad_id') AND value #>> '{}' !~ '^[A-Za-z0-9._-]{1,200}$')
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

CREATE OR REPLACE FUNCTION public.student_lead_snapshot_v2(target uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  WITH lead_context AS (
    SELECT u.id, u.created_at, u.email, u.raw_user_meta_data,
      p.name, p.phone, p.email AS profile_email, p.city, p.role,
      p.is_premium, p.premium_expires_at, p.trial_expires_at,
      p.signup_attribution_first_touch,
      l.name_cleared, l.phone_cleared,
      COALESCE(
        NULLIF(p.signup_attribution_first_touch, '{}'::jsonb),
        NULLIF(u.raw_user_meta_data->'signup_attribution'->'firstTouch', '{}'::jsonb),
        NULLIF(u.raw_user_meta_data->'signup_attribution'->'first_touch', '{}'::jsonb),
        jsonb_strip_nulls(jsonb_build_object(
          'utm_source', u.raw_user_meta_data->>'utm_source',
          'utm_medium', u.raw_user_meta_data->>'utm_medium',
          'utm_campaign', u.raw_user_meta_data->>'utm_campaign',
          'utm_content', u.raw_user_meta_data->>'utm_content',
          'utm_term', u.raw_user_meta_data->>'utm_term',
          'gclid', u.raw_user_meta_data->>'gclid',
          'fbclid', u.raw_user_meta_data->>'fbclid',
          'referrer', u.raw_user_meta_data->>'referrer'
        )), '{}'::jsonb
      ) AS attribution
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    LEFT JOIN public.student_leads l ON l.user_id = u.id
    WHERE u.id = target
      AND COALESCE(p.role, 'individual') IN ('individual', 'student')
      AND COALESCE(u.raw_app_meta_data->>'auctor_admin', 'false') <> 'true'
  ),
  lead_source_context AS (
    SELECT c.*,
      ref.referral_code AS ambassador_referral_code,
      inf.coupon_code AS influencer_coupon_code,
      COALESCE(NULLIF(lower(c.attribution->>'utm_source'), ''), '') AS source,
      COALESCE(NULLIF(lower(c.attribution->>'utm_medium'), ''), '') AS normalized_medium,
      COALESCE(NULLIF(lower(c.attribution->>'referrer'), ''), '') AS referrer
    FROM lead_context c
    LEFT JOIN LATERAL (
      SELECT a.referral_code
      FROM public.subscriptions s
      JOIN public.campus_ambassadors a ON a.referral_code = s.referral_code
      WHERE s.user_id = c.id AND NULLIF(s.referral_code, '') IS NOT NULL
      ORDER BY s.created_at DESC NULLS LAST
      LIMIT 1
    ) ref ON true
    LEFT JOIN LATERAL (
      SELECT i.coupon_code
      FROM public.razorpay_payment_orders o
      JOIN public.instagram_influencers i ON i.id::text = o.influencer_id
      WHERE o.user_id = c.id AND o.status = 'provisioned'
      ORDER BY o.created_at DESC NULLS LAST
      LIMIT 1
    ) inf ON true
  ),
  lead_classification AS (
    SELECT x.*,
      CASE
        WHEN NULLIF(x.attribution->>'gclid', '') IS NOT NULL
          OR (x.source IN ('google', 'adwords', 'googleads') AND x.normalized_medium IN ('cpc', 'ppc', 'paid', 'paid_search', 'paid_media')) THEN 'Google Ads'
        WHEN NULLIF(x.attribution->>'fbclid', '') IS NOT NULL
          OR (x.source IN ('facebook', 'instagram', 'meta', 'fb', 'ig') AND x.normalized_medium IN ('cpc', 'ppc', 'paid', 'paid_social', 'display', 'paid_media')) THEN 'Meta Ads'
        WHEN x.influencer_coupon_code IS NOT NULL THEN 'Influencer'
        WHEN x.ambassador_referral_code IS NOT NULL THEN 'Campus Ambassador'
        WHEN NULLIF((SELECT s.referral_code FROM public.subscriptions s WHERE s.user_id = x.id AND NULLIF(s.referral_code, '') IS NOT NULL ORDER BY s.created_at DESC NULLS LAST LIMIT 1), '') IS NOT NULL THEN 'Referral'
        WHEN x.source IN ('telegram', 't.me', 'telegram.me') OR x.referrer LIKE '%t.me%' OR x.referrer LIKE '%telegram.me%' THEN 'Telegram'
        WHEN x.source IN ('whatsapp', 'wa', 'wa.me') OR x.referrer LIKE '%wa.me%' OR x.referrer LIKE '%whatsapp.com%' THEN 'WhatsApp'
        WHEN x.source IN ('youtube', 'youtu.be') OR x.referrer LIKE '%youtube.com%' OR x.referrer LIKE '%youtu.be%' THEN 'YouTube'
        WHEN x.source = 'instagram' OR x.referrer LIKE '%instagram.com%' THEN 'Instagram Organic'
        WHEN x.source IN ('organic', 'google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'brave', 'ecosia') OR x.referrer ~ '(google\.|bing\.com|yahoo\.|duckduckgo\.com|baidu\.com|search\.brave\.com|ecosia\.org)' THEN 'Organic'
        WHEN x.source = 'direct' OR (x.source = '' AND x.referrer = '') THEN 'Direct'
        WHEN x.source = 'facebook' OR x.referrer LIKE '%facebook.com%' THEN 'Referral'
        ELSE 'Other'
      END AS lead_source,
      CASE
        WHEN x.influencer_coupon_code IS NOT NULL THEN 'Influencer coupon: ' || x.influencer_coupon_code
        WHEN x.ambassador_referral_code IS NOT NULL THEN 'Campus ambassador referral: ' || x.ambassador_referral_code
        WHEN NULLIF((SELECT s.referral_code FROM public.subscriptions s WHERE s.user_id = x.id AND NULLIF(s.referral_code, '') IS NOT NULL ORDER BY s.created_at DESC NULLS LAST LIMIT 1), '') IS NOT NULL THEN 'Referral code: ' || (SELECT s.referral_code FROM public.subscriptions s WHERE s.user_id = x.id AND NULLIF(s.referral_code, '') IS NOT NULL ORDER BY s.created_at DESC NULLS LAST LIMIT 1)
        ELSE concat_ws('; ', NULLIF(x.attribution->>'utm_source', ''), CASE WHEN x.referrer <> '' THEN 'referrer=' || x.referrer END)
      END AS source_detail
    FROM lead_source_context x
  )
  SELECT jsonb_build_object(
    'user_id', u.id, 'signup_date', u.created_at,
    'name', CASE WHEN COALESCE(u.name_cleared, false) THEN '' ELSE
      COALESCE(NULLIF(btrim(u.name), ''), NULLIF(btrim(u.raw_user_meta_data->>'full_name'), ''),
        NULLIF(btrim(u.raw_user_meta_data->>'name'), ''), '') END,
    'phone', CASE WHEN COALESCE(u.phone_cleared, false) THEN '' ELSE
      COALESCE(NULLIF(btrim(u.phone), ''), NULLIF(btrim(u.raw_user_meta_data->>'phone'), ''),
        NULLIF(btrim(u.raw_user_meta_data->>'phone_number'), ''), '') END,
    'email', COALESCE(u.email, u.profile_email, ''),
    'city', COALESCE(NULLIF(btrim(u.city), ''), ''),
    'acquisition_source', COALESCE(NULLIF(btrim(u.raw_user_meta_data->>'acquisition_source'), ''), NULLIF(btrim(u.raw_user_meta_data->>'utm_source'), ''), ''),
    'lead_source', u.lead_source,
    'source_detail', u.source_detail,
    'campaign', COALESCE(NULLIF(u.attribution->>'utm_campaign', ''), ''),
    'medium', COALESCE(NULLIF(u.attribution->>'utm_medium', ''), ''),
    'last_active', a.last_active, 'daily_rc_attempts', a.daily, 'daily_workout_attempts', a.workouts,
    'rc_generator_uses', null, 'speed_practice_attempts', a.speed, 'vocabulary_attempts', a.vocab,
    'sectional_test_attempts', a.sectional, 'total_practice_sessions', a.total,
    'subscription_status', CASE
      WHEN EXISTS(SELECT 1 FROM public.subscriptions s WHERE s.user_id = target AND s.expires_at > now() AT TIME ZONE 'UTC')
        OR (u.is_premium AND (u.premium_expires_at IS NULL OR u.premium_expires_at > now())) THEN 'Premium'
      WHEN u.trial_expires_at > now() AT TIME ZONE 'UTC' THEN 'Trial' ELSE 'Free / expired' END
  )
  FROM lead_classification u
  CROSS JOIN LATERAL (
    SELECT sum(n) AS total, max(at) AS last_active,
      sum(n) FILTER (WHERE kind = 'daily') AS daily,
      sum(n) FILTER (WHERE kind = 'workout') AS workouts,
      sum(n) FILTER (WHERE kind = 'speed') AS speed,
      sum(n) FILTER (WHERE kind = 'vocab') AS vocab,
      sum(n) FILTER (WHERE kind = 'sectional') AS sectional
    FROM (
      SELECT 'daily' AS kind, count(*) AS n, max(coalesce(completed_at, started_at)) AS at
        FROM public.daily_rc_attempts WHERE user_id = target
      UNION ALL SELECT 'workout', count(*), max(completed_at) FROM public.workout_attempts WHERE user_id = target AND mode = 'daily'
      UNION ALL SELECT 'speed', count(*), max(created_at) FROM public.speed_sessions WHERE user_id = target
      UNION ALL SELECT 'vocab', count(*), max(created_at) FROM public.vocab_sessions WHERE user_id = target
      UNION ALL SELECT 'sectional', count(*), max(created_at) FROM public.sectional_tests WHERE user_id = target
      UNION ALL SELECT 'sectional', count(*), max(created_at) FROM public.mentor_test_attempts WHERE user_id = target
    ) counts
  ) a;
$function$;
