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