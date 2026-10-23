DO $$
DECLARE
  updated_rows integer;
  legacy_question record;
  legacy_option_count integer;
  distinct_option_ids integer;
  distinct_option_labels integer;
  answer_b_id text;
  revised_question_count integer;
  revised_question text := 'Choose the sentence that uses articles correctly with the river, ocean, and country names.';
  revised_options jsonb;
  revised_analysis jsonb := '{
    "A": {"status":"incorrect","why_it_looks_possible":"The sentence includes the country name without an article, which is correct, but omits the conventional article used with the river name.","why_it_is_correct_or_wrong":"The Amazon is a river name and takes the definite article in this use."},
    "B": {"status":"correct","why_it_looks_possible":"It applies the conventional article use to both the river and ocean while leaving the country name bare.","why_it_is_correct_or_wrong":"The Amazon and the Atlantic take the definite article; Brazil does not."},
    "C": {"status":"incorrect","why_it_looks_possible":"It keeps the definite article with the country, which may look parallel to the river name.","why_it_is_correct_or_wrong":"It omits the conventional article before both Amazon and Atlantic, and incorrectly uses the before Brazil."},
    "D": {"status":"incorrect","why_it_looks_possible":"The river and ocean names are correctly introduced with the definite article.","why_it_is_correct_or_wrong":"Brazil is a country name that does not take the definite article here."}
  }'::jsonb;
  revised_rule text := 'Use the with conventional river and ocean names, such as the Amazon and the Atlantic; most country names, including Brazil, do not take the article.';
  revised_explanation text := 'The Amazon and the Atlantic take the definite article, while Brazil does not.';
BEGIN
  SELECT q.options, q.correct_answer
  INTO legacy_question
  FROM public.grammar_questions q
  WHERE q.topic_id = 'articles-determiners'
    AND q.question_text = 'She plans to sail up the Amazon, then visit the Brazil before flying out of the country.'
    AND q.bank_status = 'approved' AND q.is_active = true;

  IF NOT FOUND THEN
    SELECT count(*) INTO revised_question_count
    FROM public.grammar_questions q
    WHERE q.topic_id = 'articles-determiners'
      AND q.question_text = revised_question
      AND q.bank_status = 'approved' AND q.is_active = true
      AND q.explanation = revised_explanation
      AND q.options @> '[
        {"label":"A","text":"Amazon flows toward the Atlantic before reaching Brazil."},
        {"label":"B","text":"The Amazon flows toward the Atlantic before reaching Brazil."},
        {"label":"C","text":"Amazon flows toward Atlantic before reaching the Brazil."},
        {"label":"D","text":"The Amazon flows toward the Atlantic before reaching the Brazil."}
      ]'::jsonb
      AND q.correct_answer = (
        SELECT option->>'id'
        FROM jsonb_array_elements(q.options) AS entry(option)
        WHERE option->>'label' = 'B'
      );

    IF revised_question_count = 1 THEN
      RETURN;
    END IF;

    RAISE EXCEPTION 'Expected exactly one original or already-refined approved Grammar question; found % refined rows', revised_question_count;
  END IF;

  SELECT count(*), count(DISTINCT option->>'id'), count(DISTINCT option->>'label')
  INTO legacy_option_count, distinct_option_ids, distinct_option_labels
  FROM jsonb_array_elements(legacy_question.options) AS entry(option);

  SELECT option->>'id' INTO answer_b_id
  FROM jsonb_array_elements(legacy_question.options) AS entry(option)
  WHERE option->>'label' = 'B';

  IF legacy_option_count <> 4 OR distinct_option_ids <> 4 OR distinct_option_labels <> 4
    OR answer_b_id IS NULL OR answer_b_id IS DISTINCT FROM legacy_question.correct_answer THEN
    RAISE EXCEPTION 'Original Grammar question must have four unique options with existing option B as the stored correct answer';
  END IF;

  SELECT jsonb_agg(
    jsonb_set(option, '{text}', to_jsonb(CASE option->>'label'
      WHEN 'A' THEN 'Amazon flows toward the Atlantic before reaching Brazil.'
      WHEN 'B' THEN 'The Amazon flows toward the Atlantic before reaching Brazil.'
      WHEN 'C' THEN 'Amazon flows toward Atlantic before reaching the Brazil.'
      WHEN 'D' THEN 'The Amazon flows toward the Atlantic before reaching the Brazil.'
    END)) ORDER BY option->>'label'
  ) INTO revised_options
  FROM jsonb_array_elements(legacy_question.options) AS entry(option);

  UPDATE public.grammar_questions
  SET question_text = revised_question,
      options = revised_options,
      explanation = revised_explanation,
      rule_tested = revised_rule,
      option_analysis = revised_analysis,
      full_payload = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(full_payload, '{question_text}', to_jsonb(revised_question)),
                '{options}', jsonb_build_object(
                  'A', 'Amazon flows toward the Atlantic before reaching Brazil.',
                  'B', 'The Amazon flows toward the Atlantic before reaching Brazil.',
                  'C', 'Amazon flows toward Atlantic before reaching the Brazil.',
                  'D', 'The Amazon flows toward the Atlantic before reaching the Brazil.'
                )
              ),
              '{option_analysis}', revised_analysis
            ),
            '{explanation,core_rule}', to_jsonb(revised_rule)
          ),
          '{explanation,why_correct}', to_jsonb(revised_explanation)
        ),
        '{explanation,strongest_distractor}', to_jsonb('D'::text)
      )
  WHERE topic_id = 'articles-determiners'
    AND question_text = 'She plans to sail up the Amazon, then visit the Brazil before flying out of the country.'
    AND bank_status = 'approved' AND is_active = true
    AND (SELECT count(*) FROM jsonb_array_elements(options)) = 4
    AND correct_answer = legacy_question.correct_answer;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 1 THEN
    RAISE EXCEPTION 'Expected to refine exactly one approved Grammar question; updated % rows', updated_rows;
  END IF;
END $$;
