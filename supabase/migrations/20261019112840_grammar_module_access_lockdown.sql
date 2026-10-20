-- Grammar data is accessed only through entitlement-checked server routes,
-- which use the service-role client and return sanitized question payloads.
-- Remove direct Data API access so client roles cannot read answer keys or
-- modify server-owned attempts and generation records.

ALTER TABLE public.grammar_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_bank_generation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_grammar_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read active grammar tests" ON public.grammar_tests;
DROP POLICY IF EXISTS "Authenticated users can read grammar questions" ON public.grammar_questions;
DROP POLICY IF EXISTS "Users can create own grammar test attempts" ON public.grammar_test_attempts;
DROP POLICY IF EXISTS "Users can read own grammar test attempts" ON public.grammar_test_attempts;
DROP POLICY IF EXISTS "Users can update own grammar test attempts" ON public.grammar_test_attempts;
DROP POLICY IF EXISTS "grammar attempts select own" ON public.grammar_test_attempts;
DROP POLICY IF EXISTS "Users can create own grammar question attempts" ON public.grammar_question_attempts;
DROP POLICY IF EXISTS "Users can read own grammar question attempts" ON public.grammar_question_attempts;
DROP POLICY IF EXISTS "grammar question attempts select own" ON public.grammar_question_attempts;
DROP POLICY IF EXISTS "grammar session questions select own" ON public.grammar_session_questions;

REVOKE ALL PRIVILEGES ON TABLE
  public.grammar_tests,
  public.grammar_questions,
  public.grammar_test_attempts,
  public.grammar_question_attempts,
  public.grammar_session_questions,
  public.grammar_bank_generation_runs,
  public.master_grammar_questions
FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES ON SEQUENCE public.master_grammar_questions_id_seq
FROM PUBLIC, anon, authenticated;
