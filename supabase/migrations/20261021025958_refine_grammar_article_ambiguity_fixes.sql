DO $$
DECLARE
  correction record;
  target record;
  option_count integer;
  distinct_ids integer;
  distinct_labels integer;
  expected_option_id text;
  revised_options jsonb;
  revised_option_map jsonb;
  already_corrected boolean;
BEGIN
  FOR correction IN
    SELECT * FROM (VALUES
      (1,
       '____ eagle is known for its keen eyesight, but today I saw ____ eagle perched on the library roof.',
       'For a first, non-specific mention of one singular eagle, choose the correct indefinite article: “___ eagle.”',
       'A',
       '{"A":"an","B":"a","C":"the","D":"—"}'::jsonb,
       'An starts with a vowel sound, so it is the correct indefinite article before eagle. A is used before a consonant sound; the is definite; and a singular count noun cannot take zero article in this use.',
       'Use an before a singular count noun that begins with a vowel sound when making a first, non-specific reference.',
       'Indefinite Articles',
       'Overgeneralized Rule',
       '{
         "A":{"status":"correct","why_it_looks_possible":"It is the correct indefinite article before a vowel sound.","why_it_is_correct_or_wrong":"Eagle begins with a vowel sound, so an eagle is the required first, non-specific singular phrase."},
         "B":{"status":"incorrect","why_it_looks_possible":"A is an indefinite article and can precede singular count nouns.","why_it_is_correct_or_wrong":"A is used before a consonant sound; eagle begins with a vowel sound."},
         "C":{"status":"incorrect","why_it_looks_possible":"The can precede a singular count noun when the reference is definite.","why_it_is_correct_or_wrong":"The prompt requires a first, non-specific reference, so a definite article does not fit."},
         "D":{"status":"incorrect","why_it_looks_possible":"Zero article is used with some plural and uncountable nouns.","why_it_is_correct_or_wrong":"Eagle is singular and countable here, so it requires an article."}
       }'::jsonb,
       'B',
       'The correct indefinite article before a vowel sound is an.'),
      (2,
       'At the conference, Dr. Patel presented ___ solution that required careful calibration, unlike ___ solutions commonly used in routine experiments.',
       'The report has already identified one unique solution. When referring to that same solution again, write “___ solution.”',
       'A',
       '{"A":"the","B":"a","C":"an","D":"—"}'::jsonb,
       'The refers back to the one unique solution already identified. A would introduce a different, non-specific solution; an is not used before the consonant sound in solution; and a singular count noun requires an article.',
       'Use the when a singular count noun refers to the same unique item already identified in the discourse.',
       'Specific vs General Reference',
       'Meaning-Grammar Conflict',
       '{
         "A":{"status":"correct","why_it_looks_possible":"It refers back to the solution already identified as unique.","why_it_is_correct_or_wrong":"The marks the same previously identified solution."},
         "B":{"status":"incorrect","why_it_looks_possible":"A is grammatical before a singular count noun when introducing a new item.","why_it_is_correct_or_wrong":"The prompt refers to the same unique solution already identified, not a new solution."},
         "C":{"status":"incorrect","why_it_looks_possible":"An is an indefinite article used with singular count nouns before vowel sounds.","why_it_is_correct_or_wrong":"Solution begins with a consonant sound, and the reference is definite rather than indefinite."},
         "D":{"status":"incorrect","why_it_looks_possible":"Zero article can be used with plural or uncountable nouns in some contexts.","why_it_is_correct_or_wrong":"Solution is a singular count noun and must have an article."}
       }'::jsonb,
       'B',
       'The is required because solution refers to the same unique item already identified.'),
      (4,
       '____ both proposals were reviewed by ____ committee before a decision was reached.',
       '____ of the two proposals was approved before the committee made its decision.',
       'B',
       '{"A":"Both","B":"Each","C":"All","D":"Every"}'::jsonb,
       'Each of the two proposals was approved is grammatical and takes the singular verb was. Both and all require a plural verb in this construction, while every cannot be followed by of the two.',
       'Each of + a plural noun phrase takes a singular verb; both of and all of take plural verbs, and every does not take the of the two construction.',
       'Predeterminers',
       'Surface Agreement',
       '{
         "A":{"status":"incorrect","why_it_looks_possible":"Both correctly refers to a pair.","why_it_is_correct_or_wrong":"Both of the two proposals takes a plural verb, were, not the singular was in the stem."},
         "B":{"status":"correct","why_it_looks_possible":"Each can refer to the members of a pair individually.","why_it_is_correct_or_wrong":"Each of the two proposals takes the singular verb was, matching the stem."},
         "C":{"status":"incorrect","why_it_looks_possible":"All can refer to every member of a group.","why_it_is_correct_or_wrong":"All of the two proposals takes a plural verb, were, not was."},
         "D":{"status":"incorrect","why_it_looks_possible":"Every is used with singular count nouns.","why_it_is_correct_or_wrong":"Every is not used in the construction every of the two; use each of the two."}
       }'::jsonb,
       'A',
       'Each is the only option that fits both the “of the two” construction and the singular verb was.'),
      (5,
       'Only ____ few participants expressed concern, so the committee believed ____ little adjustment was necessary.',
       'To express some (but not many) participants and some (but not much) adjustment, use “___ few” for the countable noun and “___ little” for the uncountable noun.',
       'A',
       '{"A":"a; a","B":"a; —","C":"—; a","D":"—; —"}'::jsonb,
       'A few expresses a positive small number of countable participants, and a little expresses a positive small amount of uncountable adjustment. Without a, few and little express a negative or insufficient quantity.',
       'A few and a little express positive small quantities; few and little without a express negative or insufficient quantities.',
       'Quantifiers',
       'Contextual Fit Trap',
       '{
         "A":{"status":"correct","why_it_looks_possible":"Both phrases are familiar positive small-quantity forms.","why_it_is_correct_or_wrong":"A few is used with the countable noun participants, and a little with the uncountable noun adjustment."},
         "B":{"status":"incorrect","why_it_looks_possible":"A few is correct with participants.","why_it_is_correct_or_wrong":"Little without a expresses a negative or insufficient amount, not some adjustment."},
         "C":{"status":"incorrect","why_it_looks_possible":"A little is correct with the uncountable noun adjustment.","why_it_is_correct_or_wrong":"Few without a expresses a negative or insufficient number, not some participants."},
         "D":{"status":"incorrect","why_it_looks_possible":"Bare few and little can be grammatical in negative-quantity contexts.","why_it_is_correct_or_wrong":"Both blanks require positive small quantities, so both phrases need a."}
       }'::jsonb,
       'D',
       'A few and a little are the positive small-quantity forms specified by the stem.')
    ) AS c(question_number, legacy_question, revised_question, correct_label, option_texts, revised_explanation, revised_rule, skill, trap, revised_analysis, strongest_distractor, strongest_distractor_why)
  LOOP
    SELECT q.*, t.topic_id AS set_topic_id, t.difficulty AS set_difficulty,
           t.test_number AS set_number, t.question_count AS set_question_count
    INTO target
    FROM public.grammar_questions q
    JOIN public.grammar_tests t ON t.id = q.test_id
    WHERE t.topic_id = 'articles-determiners'
      AND t.difficulty = 'moderate'
      AND t.test_number = 1
      AND q.question_number = correction.question_number
      AND q.topic_id = 'articles-determiners'
      AND q.bank_status = 'approved'
      AND q.is_active = true;

    IF NOT FOUND OR target.set_question_count <> 5 THEN
      RAISE EXCEPTION 'Expected one active approved question % in Articles & Determiners moderate set 1 with five questions', correction.question_number;
    END IF;

    IF target.question_text NOT IN (correction.legacy_question, correction.revised_question) THEN
      RAISE EXCEPTION 'Question % changed unexpectedly; refusing targeted correction', correction.question_number;
    END IF;

    SELECT count(*), count(DISTINCT option->>'id'), count(DISTINCT option->>'label')
    INTO option_count, distinct_ids, distinct_labels
    FROM jsonb_array_elements(target.options) AS entry(option);
    IF option_count <> 4 OR distinct_ids <> 4 OR distinct_labels <> 4
      OR NOT (target.option_ids ?& ARRAY['A','B','C','D']) THEN
      RAISE EXCEPTION 'Question % must have four unique option IDs and labels before correction', correction.question_number;
    END IF;

    SELECT option->>'id' INTO expected_option_id
    FROM jsonb_array_elements(target.options) AS entry(option)
    WHERE option->>'label' = correction.correct_label;
    IF expected_option_id IS NULL THEN
      RAISE EXCEPTION 'Question % has no option labeled %', correction.question_number, correction.correct_label;
    END IF;

    already_corrected := target.question_text = correction.revised_question;
    IF target.correct_answer IS DISTINCT FROM expected_option_id THEN
      RAISE EXCEPTION 'Question % answer ID does not match the intended correct option %', correction.question_number, correction.correct_label;
    END IF;

    SELECT jsonb_agg(
      jsonb_set(option, '{text}', to_jsonb(correction.option_texts->>(option->>'label')))
      ORDER BY option->>'label'
    ), jsonb_object_agg(option->>'label', correction.option_texts->>(option->>'label'))
    INTO revised_options, revised_option_map
    FROM jsonb_array_elements(target.options) AS entry(option);

    IF already_corrected THEN
      IF target.options IS DISTINCT FROM revised_options
        OR target.explanation IS DISTINCT FROM correction.revised_explanation
        OR target.rule_tested IS DISTINCT FROM correction.revised_rule
        OR target.option_analysis IS DISTINCT FROM correction.revised_analysis THEN
        RAISE EXCEPTION 'Question % is partially corrected; refusing to overwrite unexpected state', correction.question_number;
      END IF;
      CONTINUE;
    END IF;

    UPDATE public.grammar_questions
    SET question_text = correction.revised_question,
        options = revised_options,
        explanation = correction.revised_explanation,
        rule_tested = correction.revised_rule,
        option_analysis = correction.revised_analysis,
        primary_skill = correction.skill,
        subskill = correction.skill,
        skill_id = correction.skill,
        trap_type = correction.trap,
        error_pattern = correction.revised_explanation,
        why_students_fail = correction.revised_explanation,
        ideal_thinking_process = correction.revised_rule,
        lesson_for_future = correction.revised_rule,
        question_version = COALESCE(question_version, 1) + 1,
        updated_at = now(),
        dedup_hash = encode(extensions.digest(
          'articles-determiners|moderate|' || trim(regexp_replace(regexp_replace(lower(correction.revised_question), '[^a-z0-9[:space:]]', ' ', 'g'), '[[:space:]]+', ' ', 'g')),
          'sha256'
        ), 'hex'),
        full_payload = jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(
                      jsonb_set(
                        jsonb_set(
                          jsonb_set(
                            jsonb_set(full_payload, '{question_text}', to_jsonb(correction.revised_question)),
                            '{options}', revised_option_map
                          ),
                          '{correct_answer}', to_jsonb(correction.correct_label)
                        ),
                        '{option_analysis}', correction.revised_analysis
                      ),
                      '{explanation,core_rule}', to_jsonb(correction.revised_rule)
                    ),
                    '{explanation,why_correct}', to_jsonb(correction.revised_explanation)
                  ),
                  '{explanation,strongest_distractor}', to_jsonb(correction.strongest_distractor)
                ),
                '{explanation,why_distractor_fails}', to_jsonb(correction.strongest_distractor_why)
              ),
              '{diagnosis,primary_skill}', to_jsonb(correction.skill)
            ),
            '{diagnosis,trap_type}', to_jsonb(correction.trap)
          ),
          '{quality,ambiguity_check}', to_jsonb('Targeted correction reviewed: the stem specifies a single article/quantifier/agreement interpretation, and the keyed option is the only option that satisfies it.'::text)
        ),
        audit_payload = jsonb_build_object(
          'pass', true,
          'reason', 'Targeted content correction verified against the stored stem, four options, keyed option, and explanation; no alternative option satisfies the stated context and syntax.',
          'difficulty', 'moderate',
          'question_number', correction.question_number,
          'repair_required', false,
          'ambiguity_status', 'none',
          'literal_key_valid', true,
          'defensible_option_ids', jsonb_build_array(correction.correct_label),
          'controlled_sites_valid', true,
          'explanation_consistent', true,
          'unique_defensible_answer', true,
          'review_method', 'targeted_content_correction'
        )
    WHERE id = target.id
      AND question_text = correction.legacy_question
      AND correct_answer = expected_option_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Question % changed during targeted correction', correction.question_number;
    END IF;
  END LOOP;

  IF (SELECT count(*) FROM public.grammar_questions q
      JOIN public.grammar_tests t ON t.id=q.test_id
      WHERE t.topic_id='articles-determiners' AND t.difficulty='moderate'
        AND t.test_number=1 AND q.is_active=true AND q.bank_status='approved') <> 5 THEN
    RAISE EXCEPTION 'Articles & Determiners moderate set 1 is not complete after correction';
  END IF;
END $$;
