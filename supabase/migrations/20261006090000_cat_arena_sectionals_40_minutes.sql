-- CAT Arena catalog durations are stored in minutes; attempt limits are stored in seconds.
-- The content table can contain non-CAT products, so duration is enforced per CAT row by the trigger below.
UPDATE public.sectional_test_content
SET time_minutes = 40
WHERE upper(coalesce(exam, 'CAT')) = 'CAT'
  AND time_minutes IS DISTINCT FROM 40;

CREATE OR REPLACE FUNCTION public.force_cat_arena_sectional_duration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF upper(coalesce(NEW.exam, 'CAT')) = 'CAT' THEN
    NEW.time_minutes := 40;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.force_cat_arena_sectional_duration() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS force_cat_arena_sectional_duration ON public.sectional_test_content;
CREATE TRIGGER force_cat_arena_sectional_duration
BEFORE INSERT OR UPDATE OF time_minutes, exam ON public.sectional_test_content
FOR EACH ROW EXECUTE FUNCTION public.force_cat_arena_sectional_duration();

-- Backfill only legacy CAT Arena IDs; unrelated rows are left alone.
UPDATE public.sectional_tests
SET time_limit_s = 2400
WHERE time_limit_s IS DISTINCT FROM 2400
  AND sectional_id ~ '^sectional-(0[1-9]|10)$';

CREATE TABLE IF NOT EXISTS public.cat_arena_sectional_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sectional_id text NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 2400 CHECK (duration_seconds = 2400),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '40 minutes'),
  submitted_at timestamptz,
  CHECK (expires_at = started_at + interval '40 minutes')
);

ALTER TABLE public.cat_arena_sectional_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cat_arena_sectional_sessions FROM anon, authenticated;
GRANT SELECT ON public.cat_arena_sectional_sessions TO authenticated;
GRANT UPDATE (submitted_at) ON public.cat_arena_sectional_sessions TO authenticated;
GRANT ALL ON public.cat_arena_sectional_sessions TO service_role;
DROP POLICY IF EXISTS cat_arena_sectional_sessions_read_own ON public.cat_arena_sectional_sessions;
CREATE POLICY cat_arena_sectional_sessions_read_own
  ON public.cat_arena_sectional_sessions
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS cat_arena_sectional_sessions_complete_own ON public.cat_arena_sectional_sessions;
CREATE POLICY cat_arena_sectional_sessions_complete_own
  ON public.cat_arena_sectional_sessions
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

ALTER TABLE public.sectional_tests
  ADD COLUMN IF NOT EXISTS sectional_session_id uuid
  REFERENCES public.cat_arena_sectional_sessions(id);
ALTER TABLE public.mentor_test_attempts
  ADD COLUMN IF NOT EXISTS sectional_session_id uuid
  REFERENCES public.cat_arena_sectional_sessions(id);

CREATE UNIQUE INDEX IF NOT EXISTS sectional_tests_session_once
  ON public.sectional_tests(sectional_session_id)
  WHERE sectional_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS mentor_test_attempts_session_once
  ON public.mentor_test_attempts(sectional_session_id)
  WHERE sectional_session_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.enforce_cat_arena_sectional_deadline()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_session public.cat_arena_sectional_sessions%ROWTYPE;
  v_sectional_id text;
  v_exam text;
BEGIN
  IF TG_TABLE_NAME = 'sectional_tests' THEN
    IF NEW.sectional_id !~ '^sectional-(0[1-9]|10)$' THEN
      RETURN NEW;
    END IF;
    v_sectional_id := NEW.sectional_id;
    NEW.time_limit_s := 2400;
  ELSE
    SELECT exam INTO v_exam
    FROM public.sectional_test_content
    WHERE id = NEW.test_id;
    IF upper(coalesce(v_exam, '')) <> 'CAT' THEN
      RETURN NEW;
    END IF;
    v_sectional_id := NEW.test_id::text;
  END IF;

  IF NEW.sectional_session_id IS NULL THEN
    RAISE EXCEPTION 'A CAT Arena sectional session is required';
  END IF;

  SELECT * INTO v_session
  FROM public.cat_arena_sectional_sessions
  WHERE id = NEW.sectional_session_id
  FOR UPDATE;

  IF NOT FOUND
    OR v_session.user_id IS DISTINCT FROM NEW.user_id
    OR v_session.sectional_id IS DISTINCT FROM v_sectional_id
    OR v_session.duration_seconds <> 2400
    OR v_session.submitted_at IS NOT NULL
    OR (
      v_session.expires_at <= clock_timestamp()
      AND coalesce(NEW.time_taken_s, 0) < 2400
    ) THEN
    RAISE EXCEPTION 'The CAT Arena sectional session has expired or is invalid';
  END IF;

  IF coalesce(NEW.time_taken_s, 0) > v_session.duration_seconds THEN
    RAISE EXCEPTION 'The CAT Arena sectional duration cannot exceed 40 minutes';
  END IF;

  UPDATE public.cat_arena_sectional_sessions
  SET submitted_at = clock_timestamp()
  WHERE id = v_session.id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_cat_arena_sectional_deadline() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_cat_arena_sectional_deadline ON public.sectional_tests;
CREATE TRIGGER enforce_cat_arena_sectional_deadline
BEFORE INSERT ON public.sectional_tests
FOR EACH ROW EXECUTE FUNCTION public.enforce_cat_arena_sectional_deadline();
DROP TRIGGER IF EXISTS enforce_cat_arena_sectional_deadline ON public.mentor_test_attempts;
CREATE TRIGGER enforce_cat_arena_sectional_deadline
BEFORE INSERT ON public.mentor_test_attempts
FOR EACH ROW EXECUTE FUNCTION public.enforce_cat_arena_sectional_deadline();



