export const GRAMMAR_ARCHETYPES = {
  "parts-of-speech": {
    hard: [
      {
        id: "same-word-different-function",
        name: "Same Word, Different Function",

        task:
          "Use the same surface word in multiple contexts where it performs different grammatical functions. The student must determine function from sentence structure.",

        required_reasoning: [
          "The same word or expression must appear in multiple contexts.",
          "Its grammatical function must genuinely change across contexts.",
          "The answer must require comparison of syntactic roles.",
          "The question must not be solvable from the appearance of the word alone.",
        ],

        forbidden_patterns: [
          "Four morphological forms of the same root as options.",
          "Simple to + base verb recognition.",
          "Simple article + noun recognition.",
          "Simple adjective + noun recognition.",
        ],

        gold_example: {
          question:
            `Consider the word "before" in the following sentences:

I. I had seen her before.
II. She left before the meeting.
III. Think carefully before you answer.
IV. The day before was unusually quiet.

In which pair does "before" perform the same grammatical function?`,

          options: {
            A: "I and II",
            B: "I and IV",
            C: "II and III",
            D: "III and IV",
          },

          answer: "B",

          why_hard:
            "The same surface word performs different functions depending on its syntactic environment. The student must analyse each occurrence rather than recognise a memorised word class.",
        },
      },

      {
        id: "gerund-participle-verbal-noun",
        name: "Gerund vs Participle vs Verbal Noun",

        task:
          "Test whether an -ing form functions as a gerund, participle, verbal noun, or another grammatically justified category based on its syntactic behaviour.",

        required_reasoning: [
          "The same -ing form should appear in structurally different contexts where possible.",
          "The distinction must depend on syntactic evidence.",
          "At least two interpretations should initially appear plausible.",
          "The student must analyse grammatical behaviour, not merely the -ing ending.",
        ],

        forbidden_patterns: [
          "Asking merely whether a word ending in -ing is a gerund.",
          "Questions answerable through a single memorised definition.",
          "Obviously unrelated nonsense distractors.",
        ],

        gold_example: {
          question:
            `Consider the word "painting":

I. Painting portraits requires patience.
II. The painting hanging in the gallery was stolen.
III. She was painting when I arrived.
IV. His painting of the ceiling took three days.

Which statement most accurately describes the grammatical function of "painting" in the four sentences?`,

          options: {
            A: "It is a gerund in I and IV, a noun in II, and part of a verb phrase in III.",
            B: "It is a noun in I and II, a verb in III, and a participle in IV.",
            C: "It is a gerund in I, a noun in II and IV, and part of a verb phrase in III.",
            D: "It is a participle in I and III and a noun in II and IV.",
          },

          answer: "C",

          why_hard:
            "The student must distinguish an -ing form functioning as the head of a noun phrase, a lexical noun, and part of a progressive verb phrase.",
        },
      },

      {
        id: "participle-vs-adjective",
        name: "Participle vs Adjective",

        task:
          "Require the student to distinguish participial forms functioning adjectivally from forms participating in genuine verbal constructions.",

        required_reasoning: [
          "Surface form alone must be insufficient.",
          "The student should need grammatical tests such as modification, complementation, or verbal structure.",
          "At least one distractor must exploit the assumption that every -ed or -ing form is automatically a verb.",
        ],

        forbidden_patterns: [
          "Obvious tense recognition.",
          "Questions where one nearby auxiliary mechanically gives the answer.",
        ],

        gold_example: {
          question:
            `In which sentence does "concerned" function most clearly as an adjective rather than as part of a passive verbal construction?`,

          options: {
            A: "The committee was concerned by the sudden decline in attendance.",
            B: "The concerned parents demanded an immediate explanation.",
            C: "The report concerned several members of the committee.",
            D: "The issues concerned were discussed at length.",
          },

          answer: "B",

          why_hard:
            "Several options contain identical or related forms, but the student must distinguish attributive adjectival use from verbal and reduced-clause uses.",
        },
      },

      {
        id: "form-vs-function",
        name: "Form vs Function Conflict",

        task:
          "Create a question where the internal form of a word or phrase differs from the grammatical function it performs in the larger sentence.",

        required_reasoning: [
          "The student must distinguish category from function.",
          "The answer must require analysis beyond naming the visible word form.",
          "The sentence should contain a genuine form-function distinction.",
        ],

        forbidden_patterns: [
          "Simple noun/verb/adjective identification.",
          "Questions answerable by looking at one isolated word.",
        ],

        gold_example: {
          question:
            `In the sentence "What he proposed sounded reasonable", which analysis is most accurate?`,

          options: {
            A: `"What" is a pronoun and therefore functions alone as the subject of "sounded".`,
            B: `"What he proposed" is a nominal clause functioning as the subject of "sounded".`,
            C: `"Proposed" is the subject because it is the main lexical verb of the first clause.`,
            D: `"Reasonable" is a noun functioning as the subject complement.`,
          },

          answer: "B",

          why_hard:
            "The student must distinguish the internal grammatical categories of individual words from the function performed by the entire clause.",
        },
      },

      {
        id: "structural-ambiguity",
        name: "Structural Ambiguity",

        task:
          "Create a question in which two grammatical analyses initially appear possible but syntactic evidence resolves the correct analysis.",

        required_reasoning: [
          "The ambiguity must be grammatical, not merely semantic vagueness.",
          "The student must use sentence structure to resolve it.",
          "The final answer must still be unambiguous.",
        ],

        forbidden_patterns: [
          "Subjective stylistic preference.",
          "Questions where multiple answers remain defensible.",
          "Ambiguity created only by obscure vocabulary.",
        ],

        gold_example: {
          question:
            `Consider: "Visiting relatives can be exhausting."

Which statement best explains the grammatical ambiguity?`,

          options: {
            A: `"Visiting" can function either as part of a noun phrase meaning the activity of visiting relatives or as a participle modifying "relatives".`,
            B: `"Relatives" can function either as a verb or as an adjective.`,
            C: `"Exhausting" can only be a noun, making the sentence structurally incomplete.`,
            D: `"Can" may function as either a noun or a modal verb in this sentence.`,
          },

          answer: "A",

          why_hard:
            "The student must recognise two different syntactic structures represented by the same sequence of words.",
        },
      },

      {
        id: "cross-sentence-functional-comparison",
        name: "Cross-Sentence Functional Comparison",

        task:
          "Present the same word or construction across several sentences and ask the student to identify a specified grammatical function through comparative analysis.",

        required_reasoning: [
          "The same surface form must occur across multiple sentences.",
          "At least three genuinely different grammatical uses should be represented.",
          "The answer must depend on comparative syntactic analysis.",
        ],

        forbidden_patterns: [
          "One obviously different option.",
          "Pure vocabulary or meaning tests.",
          "Mechanical suffix recognition.",
        ],

        gold_example: {
          question:
            `In which sentence does "that" function as a relative pronoun?`,

          options: {
            A: "I know that she disagrees.",
            B: "That was completely unexpected.",
            C: "The proposal that we discussed was rejected.",
            D: "I had never seen a storm that severe.",
          },

          answer: "C",

          why_hard:
            "The same surface word performs different grammatical roles, requiring analysis of clause structure rather than lexical recognition.",
        },
      },
    ],
  },
};

export function getGrammarArchetypes(topicId, difficulty) {
  return GRAMMAR_ARCHETYPES[topicId]?.[difficulty] || [];
}