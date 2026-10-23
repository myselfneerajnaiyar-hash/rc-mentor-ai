DO $$
DECLARE
  target record;
  option_d_id text;
  revised_options jsonb;
  revised_analysis jsonb;
  answer_a_id text;
  revised_stem text := 'The report has already identified one unique solution. To refer to that same item, complete the phrase with the correct article: “___ solution.”';
BEGIN
  SELECT q.* INTO target
  FROM public.grammar_questions q
  JOIN public.grammar_tests t ON t.id=q.test_id
  WHERE t.topic_id='articles-determiners' AND t.difficulty='moderate' AND t.test_number=1
    AND q.question_number=2 AND q.topic_id='articles-determiners'
    AND q.bank_status='approved' AND q.is_active=true;

  IF NOT FOUND THEN RAISE EXCEPTION 'Expected Q2 in Articles & Determiners moderate set 1'; END IF;

  SELECT option->>'id' INTO answer_a_id FROM jsonb_array_elements(target.options) AS entry(option) WHERE option->>'label'='A';
  IF target.question_text = revised_stem THEN
    IF target.options @> '[{"label":"D","text":"both"}]'::jsonb
      AND target.full_payload->'options'->>'D' = 'both'
      AND target.correct_answer = answer_a_id THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'Q2 is partially corrected; refusing unexpected option state';
  END IF;

  IF target.question_text <> 'The report has already identified one unique solution. When referring to that same solution again, write “___ solution.”'
     OR NOT (target.options @> '[{"label":"D","text":"—"}]'::jsonb) THEN
    RAISE EXCEPTION 'Q2 differs from the expected reviewed version; refusing targeted option correction';
  END IF;

  SELECT option->>'id' INTO option_d_id
  FROM jsonb_array_elements(target.options) AS entry(option)
  WHERE option->>'label'='D';
  IF option_d_id IS NULL OR answer_a_id IS NULL OR target.correct_answer IS DISTINCT FROM answer_a_id THEN
    RAISE EXCEPTION 'Q2 option IDs or answer key do not match the reviewed A answer';
  END IF;

  revised_analysis := jsonb_set(
    target.option_analysis,
    '{D}',
    '{"status":"incorrect","why_it_looks_possible":"Both can be a determiner before a plural noun.","why_it_is_correct_or_wrong":"Both cannot modify the singular count noun solution; the stem requires an article referring to the already identified item."}'::jsonb
  );
  SELECT jsonb_agg(jsonb_set(option,'{text}',to_jsonb(CASE option->>'label'
      WHEN 'A' THEN 'the' WHEN 'B' THEN 'a' WHEN 'C' THEN 'an' WHEN 'D' THEN 'both' END)) ORDER BY option->>'label')
  INTO revised_options
  FROM jsonb_array_elements(target.options) AS entry(option);

  UPDATE public.grammar_questions
  SET question_text = revised_stem,
      options = revised_options,
      option_analysis = revised_analysis,
      full_payload = jsonb_set(
        jsonb_set(
          jsonb_set(full_payload,'{question_text}',to_jsonb(revised_stem)),
          '{options,D}',to_jsonb('both'::text)
        ),
        '{option_analysis,D}',revised_analysis->'D'
      ) || jsonb_build_object(
        'quality',full_payload->'quality' || jsonb_build_object('reasoning_steps',jsonb_build_array(
          'Use the stem instruction to select an article, not any possible determiner.',
          'The same unique solution has already been identified, so the reference is definite.',
          'Choose the; both cannot modify the singular count noun solution.'
        )),
        'diagnosis',full_payload->'diagnosis' || jsonb_build_object(
          'thinking_error','Ignoring the explicit article instruction or the cue that the same unique solution was already identified.',
          'why_students_fail','Students may treat articles and other determiners as interchangeable, or overlook the anaphoric cue same item.',
          'ideal_thinking_process','Use the explicit article instruction, identify the previously named unique referent, and select the definite article the.',
          'future_lesson','Distinguish articles from other determiners and track whether a referent is already identified.'
        )
      ),
      question_version=COALESCE(question_version,1)+1,
      updated_at=now()
  WHERE id=target.id AND question_text=target.question_text AND correct_answer=target.correct_answer;

  IF NOT FOUND THEN RAISE EXCEPTION 'Q2 changed during targeted option correction'; END IF;
END $$;
