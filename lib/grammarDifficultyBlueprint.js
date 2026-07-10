export const GRAMMAR_DIFFICULTY_BLUEPRINT = {
  easy: {
    objective:
      "Test whether the student understands and can directly apply the core grammar rule.",

    constructionRules: [
      "Use one clearly identifiable grammar rule.",
      "Keep sentence structure relatively simple.",
      "Avoid obscure vocabulary.",
      "Avoid multiple competing grammatical issues.",
      "The correct answer should follow directly from the tested rule.",
    ],

    cognitiveDemand: [
      "Rule recognition",
      "Direct application",
      "Basic grammatical discrimination",
    ],

    distractorRules: [
      "Distractors must represent realistic beginner mistakes.",
      "At least two distractors should be grammatically plausible at first glance.",
      "Do not use absurd or obviously malformed options.",
    ],

    bannedPatterns: [
      "Pure definition recall",
      "Options where three choices are obviously impossible",
      "Vocabulary questions disguised as grammar",
      "Trivia-based grammar questions",
    ],
  },

  moderate: {
    objective:
      "Test whether the student can apply grammar rules when plausible distractors, exceptions, or competing structures create ambiguity.",

    constructionRules: [
      "Use realistic exam-style sentences.",
      "Include at least one strong distractor based on a common misconception.",
      "The student should need to inspect sentence structure, meaning, or context.",
      "May combine two closely related grammar rules.",
      "Use exceptions and less obvious applications where appropriate.",
    ],

    cognitiveDemand: [
      "Rule application under ambiguity",
      "Exception recognition",
      "Structural analysis",
      "Distractor elimination",
    ],

    distractorRules: [
      "At least two options must appear genuinely plausible.",
      "The strongest distractor must correspond to a named trap type.",
      "Wrong answers must fail for a precise grammatical reason.",
      "Do not make the correct option noticeably cleaner or longer than all others.",
    ],

    bannedPatterns: [
      "Simple textbook blanks with one obvious answer",
      "Basic word-form conversion",
      "Questions solvable without reading the complete sentence",
      "Distractors that are nonsense",
    ],
  },

  hard: {
    objective:
      "Test whether the student can resolve subtle grammatical ambiguity involving exceptions, competing rules, structural complexity, or meaning-dependent grammar.",

    constructionRules: [
      "Use subtle, natural, sophisticated sentence structures.",
      "Require analysis of the entire sentence, not one isolated word.",
      "Use exceptions, rule collisions, attachment ambiguity, contextual meaning, or multiple grammatical dependencies.",
      "At least two options should remain plausible after initial inspection.",
      "The decisive distinction should depend on precise grammar, syntax, meaning, or idiomatic usage.",
      "Prefer constructions where superficial rule application leads to the wrong answer.",
    ],

    cognitiveDemand: [
      "Rule collision resolution",
      "Exception handling",
      "Deep structural analysis",
      "Meaning-grammar interaction",
      "High-quality distractor elimination",
    ],

    distractorRules: [
      "Every distractor must be grammatically or semantically tempting.",
      "The strongest distractor must exploit a specific misconception.",
      "At least one distractor should punish mechanical application of a familiar rule.",
      "The explanation must state exactly why a capable student might choose each wrong option.",
    ],

    bannedPatterns: [
      "Simple noun-form or verb-form identification",
      "Direct singular-plural conversion",
      "Obvious subject-verb agreement",
      "Basic article selection",
      "Questions where one option is obviously the only grammatically formed word",
      "Vocabulary testing disguised as grammar",
      "School-level transformation exercises",
      "Questions solvable by inspecting only the blank and options",
    ],
  },
};

export const GRAMMAR_QUALITY_RULES = {
  universal: [
    "Every question must test a genuine grammatical distinction.",
    "Every wrong option must be plausible enough to tempt a real student.",
    "The question must have exactly one defensible correct answer.",
    "The explanation must identify the exact governing rule.",
    "The explanation must explain why the strongest distractor is tempting.",
    "The explanation must diagnose the likely student misconception.",
    "The assigned skill must come only from GRAMMAR_ONTOLOGY.",
    "The assigned trap type must come only from GRAMMAR_TRAP_TYPES.",
  ],

  hardQuestionRejectionRules: [
    "Reject if solvable through vocabulary knowledge alone.",
    "Reject if three options are obviously malformed.",
    "Reject if the sentence tests only basic word formation.",
    "Reject if the answer can be found without understanding the full sentence.",
    "Reject if no genuine trap or misconception is present.",
    "Reject if the explanation would require fewer than two meaningful reasoning steps.",
    "Reject if a competent student could answer instantly from surface recognition alone.",
  ],
};