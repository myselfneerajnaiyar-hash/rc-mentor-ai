/* 🔁 Dynamic daily picker */
export function getTodayWords(vocabLessons) {
  const allWords = vocabLessons
    .flatMap(l => l.words)
    .filter(w => w && typeof w.word === "string" && w.word.length > 0);

  const seed = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return [...allWords]
    .sort((a, b) => {
      const aCode = a.word.charCodeAt(0);
      const bCode = b.word.charCodeAt(0);
      return (hash + aCode) % 7 - (hash + bCode) % 7;
    })
    .slice(0, 5);
}

/* 📚 ALL LESSONS LIVE BELOW */
export const vocabLessons = [
  {
    id: "uncertainty",
    title: "Shades of Uncertainty",
    goal: "Learn how CAT passages hide meaning using subtle forms of vagueness.",
    words: [
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
    ],
    concept: `CAT often hides meaning inside imprecision.
These words don’t just mean “unclear”—each signals a different kind of doubt.`,
  },
  {
    id: "evaluation",
    title: "Language of Evaluation",
    goal: "Recognize when the author is judging, approving, or criticizing.",
    words: [
      {
        word: "Flawed",
        meaning: "Having serious weaknesses or errors",
        pos: "Adjective",
        usage: "The study’s methodology is fundamentally flawed.",
        root: "Old English: flaw (defect)",
        synonyms: ["defective", "imperfect"],
        antonyms: ["sound", "robust"],
      },
      {
        word: "Compelling",
        meaning: "Evoking interest or admiration in a powerful way",
        pos: "Adjective",
        usage: "The author presents a compelling argument.",
        root: "Latin: compellere (drive together)",
        synonyms: ["persuasive", "convincing"],
        antonyms: ["weak", "unconvincing"],
      },
      {
        word: "Dubious",
        meaning: "Not to be relied upon; suspect",
        pos: "Adjective",
        usage: "The evidence cited is dubious at best.",
        root: "Latin: dubius (doubtful)",
        synonyms: ["questionable", "uncertain"],
        antonyms: ["reliable", "credible"],
      },
      {
        word: "Robust",
        meaning: "Strong and effective",
        pos: "Adjective",
        usage: "The model provides a robust framework.",
        root: "Latin: robustus (oak-like)",
        synonyms: ["strong", "solid"],
        antonyms: ["fragile", "weak"],
      },
      {
        word: "Superficial",
        meaning: "Lacking depth or seriousness",
        pos: "Adjective",
        usage: "The analysis remains superficial.",
        root: "Latin: superficies (surface)",
        synonyms: ["shallow", "surface-level"],
        antonyms: ["deep", "thorough"],
      },
    ],
    concept: `RC passages often embed judgment in subtle adjectives.
These words reveal the author’s stance and bias.`,
  },

  {
    id: "contrast",
    title: "Contrast & Reversal Signals",
    goal: "Spot turning points where arguments shift direction.",
    words: [
      {
        word: "However",
        meaning: "Used to introduce a contrast",
        pos: "Adverb",
        usage: "However, this view ignores key evidence.",
        root: "Latin: habere (hold)",
        synonyms: ["nevertheless"],
        antonyms: ["therefore"],
      },
      {
        word: "Yet",
        meaning: "Despite that",
        pos: "Conjunction",
        usage: "The theory is popular, yet flawed.",
        root: "Old English: giet",
        synonyms: ["still"],
        antonyms: ["accordingly"],
      },
      {
        word: "Conversely",
        meaning: "In an opposite way",
        pos: "Adverb",
        usage: "Conversely, rural areas show decline.",
        root: "Latin: convertere (turn around)",
        synonyms: ["oppositely"],
        antonyms: ["similarly"],
      },
      {
        word: "Nonetheless",
        meaning: "In spite of that",
        pos: "Adverb",
        usage: "Nonetheless, the trend persists.",
        root: "None + the + less",
        synonyms: ["nevertheless"],
        antonyms: ["therefore"],
      },
      {
        word: "Whereas",
        meaning: "In contrast with",
        pos: "Conjunction",
        usage: "Urban growth surged, whereas rural regions stagnated.",
        root: "Old English: hwær (where)",
        synonyms: ["while"],
        antonyms: ["and"],
      },
    ],
    concept: `Most RC traps occur after contrast words.
CAT often places the main idea after these.`,
  },

  {
    id: "causation",
    title: "Causation vs Correlation",
    goal: "Differentiate causes from mere associations.",
    words: [
      {
        word: "Catalyst",
        meaning: "Something that provokes change",
        pos: "Noun",
        usage: "The policy acted as a catalyst for reform.",
        root: "Greek: katalýō (loosen)",
        synonyms: ["trigger"],
        antonyms: ["hindrance"],
      },
      {
        word: "Consequence",
        meaning: "A result or effect",
        pos: "Noun",
        usage: "Unemployment is a consequence of automation.",
        root: "Latin: consequentia (following)",
        synonyms: ["outcome"],
        antonyms: ["cause"],
      },
      {
        word: "Precipitate",
        meaning: "To cause something suddenly",
        pos: "Verb",
        usage: "The crisis precipitated mass migration.",
        root: "Latin: praecipitare (throw headlong)",
        synonyms: ["trigger"],
        antonyms: ["prevent"],
      },
      {
        word: "Attributed",
        meaning: "Regarded as caused by",
        pos: "Verb",
        usage: "The decline is attributed to climate change.",
        root: "Latin: attribuere (assign)",
        synonyms: ["ascribed"],
        antonyms: ["denied"],
      },
      {
        word: "Correlate",
        meaning: "To have a mutual relationship",
        pos: "Verb",
        usage: "Income levels correlate with education.",
        root: "Latin: correlare (bind together)",
        synonyms: ["associate"],
        antonyms: ["disconnect"],
      },
    ],
    concept: `CAT frequently tests whether a passage claims cause or mere association.`,
  },

  {
    id: "scope",
    title: "Scope & Limitation",
    goal: "Understand when claims are narrow, broad, or conditional.",
    words: [
      {
        word: "Predominantly",
        meaning: "Mainly; for the most part",
        pos: "Adverb",
        usage: "The sample was predominantly urban.",
        root: "Latin: prae + dominari",
        synonyms: ["mainly"],
        antonyms: ["rarely"],
      },
      {
        word: "Marginal",
        meaning: "Of minor importance",
        pos: "Adjective",
        usage: "The effect was marginal.",
        root: "Latin: margo (edge)",
        synonyms: ["minor"],
        antonyms: ["significant"],
      },
      {
        word: "Limited",
        meaning: "Restricted in size or scope",
        pos: "Adjective",
        usage: "The findings are limited in application.",
        root: "Latin: limitare (bound)",
        synonyms: ["restricted"],
        antonyms: ["extensive"],
      },
      {
        word: "Universal",
        meaning: "Applicable to all cases",
        pos: "Adjective",
        usage: "There is no universal solution.",
        root: "Latin: universus (whole)",
        synonyms: ["general"],
        antonyms: ["specific"],
      },
      {
        word: "Conditional",
        meaning: "Dependent on certain circumstances",
        pos: "Adjective",
        usage: "The benefit is conditional on compliance.",
        root: "Latin: condicio (agreement)",
        synonyms: ["dependent"],
        antonyms: ["absolute"],
      },
    ],
    concept: `Scope errors are the most common CAT traps.`,
  },

  // 👇 PASTE EVERY NEW LESSON HERE, ONE AFTER ANOTHER
];
