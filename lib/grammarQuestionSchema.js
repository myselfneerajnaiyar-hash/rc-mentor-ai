export const GRAMMAR_QUESTION_SCHEMA = {
  topic_id: "",
  difficulty: "",

  question_type: "",
  question_text: "",

  options: {
    A: "",
    B: "",
    C: "",
    D: "",
  },

  correct_answer: "",

  explanation: {
    core_rule: "",
    why_correct: "",
    strongest_distractor: "",
    why_distractor_is_tempting: "",
    why_distractor_fails: "",
  },

  diagnosis: {
    primary_skill: "",
    secondary_skill: "",

    trap_type: "",

    misconception: "",

    why_students_fail: "",

    thinking_error: "",

    ideal_thinking_process: "",

    future_lesson: "",
  },

  option_analysis: {
    A: {
      status: "",
      why_it_looks_possible: "",
      why_it_is_correct_or_wrong: "",
    },

    B: {
      status: "",
      why_it_looks_possible: "",
      why_it_is_correct_or_wrong: "",
    },

    C: {
      status: "",
      why_it_looks_possible: "",
      why_it_is_correct_or_wrong: "",
    },

    D: {
      status: "",
      why_it_looks_possible: "",
      why_it_is_correct_or_wrong: "",
    },
  },

  quality: {
    difficulty_reason: "",
    reasoning_steps: [],
    ambiguity_check: "",
    quality_score: 0,
  },
};

const OPTION_KEYS = ["A", "B", "C", "D"];

export function validateGrammarQuestion(question, context) {
  const errors = [];
  const text = (value) => typeof value === "string" && value.trim().length > 0;
  const options = question?.options;
  const optionValues = OPTION_KEYS.map((key) => options?.[key]);

  if (!text(question?.question_text)) errors.push("question_text is required");
  if (question?.topic_id !== context.topicId) errors.push("topic_id does not match");
  if (question?.difficulty !== context.difficulty) errors.push("difficulty does not match");
  if (!context.questionTypes.includes(question?.question_type)) errors.push("invalid question_type");
  if (!options || Object.keys(options).length !== 4 || optionValues.some((value) => !text(value))) errors.push("exactly four non-empty options are required");
  if (new Set(optionValues.map((value) => String(value).trim().toLowerCase())).size !== 4) errors.push("options must be unique");
  if (!OPTION_KEYS.includes(question?.correct_answer)) errors.push("correct_answer must be A-D");
  if (!context.skills.includes(question?.diagnosis?.primary_skill)) errors.push("invalid primary_skill");
  if (!(question?.diagnosis?.secondary_skill == null || context.skills.includes(question.diagnosis.secondary_skill))) errors.push("invalid secondary_skill");
  if (!context.trapTypes.includes(question?.diagnosis?.trap_type)) errors.push("invalid trap_type");
  for (const field of ["misconception", "why_students_fail", "thinking_error", "ideal_thinking_process", "future_lesson"]) {
    if (!text(question?.diagnosis?.[field])) errors.push(`diagnosis.${field} is required`);
  }
  for (const field of ["core_rule", "why_correct", "strongest_distractor", "why_distractor_is_tempting", "why_distractor_fails"]) {
    if (!text(question?.explanation?.[field])) errors.push(`explanation.${field} is required`);
  }
  for (const key of OPTION_KEYS) {
    const analysis = question?.option_analysis?.[key];
    if (!analysis || !["correct", "incorrect"].includes(String(analysis.status).toLowerCase()) || !text(analysis.why_it_looks_possible) || !text(analysis.why_it_is_correct_or_wrong)) errors.push(`invalid option_analysis.${key}`);
  }
  const correctStatus = String(question?.option_analysis?.[question?.correct_answer]?.status || "").toLowerCase();
  if (correctStatus !== "correct") errors.push("correct option analysis is inconsistent");
  const analysisCorrectKeys = OPTION_KEYS.filter((key) => String(question?.option_analysis?.[key]?.status || "").toLowerCase() === "correct");
  if (analysisCorrectKeys.length !== 1 || analysisCorrectKeys[0] !== question?.correct_answer) errors.push("option_analysis must identify exactly the answer-key option as correct");
  const score = Number(question?.quality?.quality_score);
  if (!Number.isInteger(score) || score < 8 || score > 10) errors.push("quality_score must be 8-10");
  if (!text(question?.quality?.ambiguity_check)) errors.push("ambiguity_check is required");
  if (!Array.isArray(question?.quality?.reasoning_steps) || question.quality.reasoning_steps.length === 0 || question.quality.reasoning_steps.some((step) => !text(step))) errors.push("non-empty reasoning_steps are required");
  if (context.archetypeIds?.length && !context.archetypeIds.includes(question?.archetype_id)) errors.push("invalid archetype_id");

  return { success: errors.length === 0, errors };
}

export function validateGrammarQuestions(questions, context) {
  if (!Array.isArray(questions) || questions.length !== context.count) {
    return { success: false, errors: [`expected ${context.count} questions`] };
  }
  const results = questions.map((question) => validateGrammarQuestion(question, context));
  return {
    success: results.every((result) => result.success),
    errors: results.flatMap((result, index) => result.errors.map((error) => `Question ${index + 1}: ${error}`)),
  };
}
