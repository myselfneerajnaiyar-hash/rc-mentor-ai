export const todayWords = [
  {
    word: "Obscure",
    meaning: "Hard to understand due to complexity",
    pos: "Adjective",
    usage: "The theory is obscure to non-specialists.",
    root: "Latin: obscurus (hidden)",
    synonyms: ["arcane", "abstruse"],
    antonyms: ["clear", "obvious"],
  },
  {
    word: "Ambiguous",
    meaning: "Open to more than one interpretation",
    pos: "Adjective",
    usage: "The statement was deliberately ambiguous.",
    root: "Latin: ambiguus (uncertain)",
    synonyms: ["equivocal", "unclear"],
    antonyms: ["definite"],
  },
  {
    word: "Equivocal",
    meaning: "Deliberately unclear to avoid commitment",
    pos: "Adjective",
    usage: "The minister gave an equivocal reply.",
    root: "Latin: aequivocus (double-voiced)",
    synonyms: ["evasive"],
    antonyms: ["direct"],
  },
  {
    word: "Opaque",
    meaning: "Difficult to understand; intentionally hidden",
    pos: "Adjective",
    usage: "The policy’s logic remains opaque.",
    root: "Latin: opacus (darkened)",
    synonyms: ["impenetrable"],
    antonyms: ["transparent"],
  },
  {
    word: "Vague",
    meaning: "Lacking clear detail",
    pos: "Adjective",
    usage: "The plan was vague and poorly defined.",
    root: "Latin: vagus (wandering)",
    synonyms: ["hazy"],
    antonyms: ["precise"],
  },
];

export const vocabLessons = [
  {
    id: "uncertainty",
    title: "Shades of Uncertainty",
    goal:
      "Learn how CAT passages hide meaning using subtle forms of vagueness.",
    words: todayWords,
    concept: `CAT often hides meaning inside imprecision.
These words don’t just mean “unclear”—each signals a different kind of doubt.

When you see them in RC:
* The author is withholding certainty  
* The claim is softened  
* The argument is not fully committed  

Understanding this cluster directly improves inference accuracy.`,
  },

  // Later you will add:
  // { id: "evaluation", title: "...", words: [...], concept: "..." }
];
