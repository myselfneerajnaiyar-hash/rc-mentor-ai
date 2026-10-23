DO $$
DECLARE
  correction record;
  updated_rows integer;
BEGIN
  FOR correction IN
    SELECT * FROM (VALUES
      (1, 'For a first, non-specific mention of one singular eagle, choose the correct indefinite article: “___ eagle.”', 'Indefinite Articles', 'Overgeneralized Rule',
       'Treating a and an as interchangeable without checking the sound at the start of the noun.',
       'Choosing a based on the first written letter rather than the opening sound.',
       'Students may use a before any singular count noun and overlook the vowel sound in eagle.',
       'Check the sound at the start of the noun, then select an for a vowel sound in a first, non-specific singular reference.',
       'Choose a or an by the following sound, not by the written letter.',
       'A may seem plausible because it is an indefinite article for singular count nouns, but eagle begins with a vowel sound.',
       '["Identify that the prompt asks for an indefinite article in a first, non-specific reference.","Check the opening sound of eagle.","Choose an because eagle begins with a vowel sound."]'::jsonb),
      (2, 'The report has already identified one unique solution. When referring to that same solution again, write “___ solution.”', 'Specific vs General Reference', 'Meaning-Grammar Conflict',
       'Using a to introduce a new item even though the sentence requires the previously identified unique item.',
       'Ignoring the phrase same solution and treating the reference as new.',
       'Students may focus on the singular count noun and miss that the stem refers back to the same unique item.',
       'Use the discourse cue same, choose the definite article the, and check that solution begins with a consonant sound.',
       'Track whether a noun refers to an already identified item before choosing its article.',
       'A may seem plausible because it is grammatical for introducing a new solution, but the stem explicitly refers to the same unique solution.',
       '["Identify the anaphoric cue same solution.","Recognize that the referent is already identified and unique.","Choose the definite article the."]'::jsonb),
      (4, '____ of the two proposals was approved before the committee made its decision.', 'Predeterminers', 'Surface Agreement',
       'Choosing both or all because the group contains two while overlooking the singular verb after the determiner phrase.',
       'Matching the answer to the group size without checking the verb was.',
       'Students may notice the pair but overlook subject-verb agreement and the different construction used by every.',
       'Check the construction after the blank and the verb: each of takes singular was, both/all of take plural were, and every does not take of the two.',
       'Check determiner structure and verb agreement together when choosing among each, both, all, and every.',
       'Both is tempting because it names a pair, but both of the two proposals requires the plural verb were; the stem has was.',
       '["Read the complete subject phrase and its verb.","Eliminate both and all because they take plural agreement here.","Eliminate every because it does not take of the two.","Choose each, which agrees with was."]'::jsonb),
      (5, 'To express some (but not many) participants and some (but not much) adjustment, use “___ few” for the countable noun and “___ little” for the uncountable noun.', 'Quantifiers', 'Contextual Fit Trap',
       'Omitting a from positive small-quantity forms and changing their meaning to negative or insufficient quantity.',
       'Treating a few/few or a little/little as interchangeable.',
       'Students may overlook that the prompt asks for some of each quantity rather than almost none.',
       'Match countable participants with a few and uncountable adjustment with a little to express a positive small quantity.',
       'Use a few with countable nouns and a little with uncountable nouns for a positive small amount.',
       'D may seem concise, but bare few and little express a negative or insufficient quantity, contrary to the stem.',
       '["Identify the requested positive meaning: some, but not many or much.","Use a few with the countable noun participants.","Use a little with the uncountable noun adjustment."]'::jsonb)
    ) AS c(question_number, question_text, skill, trap, misconception, thinking_error, why_students_fail, ideal_thinking_process, future_lesson, why_distractor_is_tempting, reasoning_steps)
  LOOP
    UPDATE public.grammar_questions q
    SET full_payload = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(q.full_payload, '{diagnosis,primary_skill}', to_jsonb(correction.skill)),
                '{diagnosis,trap_type}', to_jsonb(correction.trap)
              ),
              '{diagnosis,misconception}', to_jsonb(correction.misconception)
            ),
            '{diagnosis,thinking_error}', to_jsonb(correction.thinking_error)
          ),
          '{diagnosis,why_students_fail}', to_jsonb(correction.why_students_fail)
        ),
        '{diagnosis,ideal_thinking_process}', to_jsonb(correction.ideal_thinking_process)
      ),
      '{diagnosis,future_lesson}', to_jsonb(correction.future_lesson)
    ) || jsonb_build_object(
      'quality', q.full_payload->'quality' || jsonb_build_object('reasoning_steps', correction.reasoning_steps),
      'explanation', q.full_payload->'explanation' || jsonb_build_object('why_distractor_is_tempting', correction.why_distractor_is_tempting)
    )
    WHERE q.question_number = correction.question_number
      AND q.topic_id = 'articles-determiners'
      AND q.difficulty = 'moderate'
      AND q.bank_status = 'approved'
      AND q.is_active = true
      AND q.question_text = correction.question_text;

    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    IF updated_rows <> 1 THEN
      RAISE EXCEPTION 'Expected exactly one corrected approved Grammar question %; updated % rows', correction.question_number, updated_rows;
    END IF;
  END LOOP;
END $$;
