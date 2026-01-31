// cat-arena/data/sampleRCTest.js

export const sampleRCTest = {
  id: "CAT-RC-01",
  title: "CAT RC Sectional Test 1",
  timeLimit: 30 * 60, // seconds

  passages: [
    {
      id: "P1",
      title: "Passage 1",
      text: `
The history of scientific progress is not linear. Periods of intense discovery
are often followed by long phases of consolidation, skepticism, and even
regression. This cyclical pattern challenges the popular notion that knowledge
advances steadily and inevitably over time.
      `,
      questions: [
        {
          id: "Q1",
          prompt:
            "The primary purpose of the passage is to:",
          options: [
            "criticize the scientific community for stagnation",
            "challenge a common assumption about progress",
            "describe major scientific discoveries",
            "compare science with other disciplines",
          ],
          correctIndex: 1,
          type: "main-idea",
        },
        {
          id: "Q2",
          prompt:
            "The author would most likely agree that periods of regression:",
          options: [
            "are unnecessary",
            "halt all intellectual growth",
            "are part of a broader cycle",
            "occur only in science",
          ],
          correctIndex: 2,
          type: "inference",
        },
        {
          id: "Q3",
          prompt:
            "Which of the following best describes the tone of the passage?",
          options: [
            "Optimistic",
            "Critical",
            "Analytical",
            "Dismissive",
          ],
          correctIndex: 2,
          type: "tone",
        },
        {
          id: "Q4",
          prompt:
            "The passage implies that the idea of steady progress is:",
          options: [
            "universally accepted",
            "historically accurate",
            "overly simplistic",
            "scientifically proven",
          ],
          correctIndex: 2,
          type: "inference",
        },
      ],
    },

    {
      id: "P2",
      title: "Passage 2",
      text: `
Urban planning often reflects the political and economic priorities of its time.
Cities designed primarily for efficiency may sacrifice community spaces, while
those emphasizing aesthetics may overlook accessibility and equity.
      `,
      questions: [
        {
          id: "Q5",
          prompt:
            "The passage mainly discusses:",
          options: [
            "urban decay",
            "transport systems",
            "trade-offs in city design",
            "architectural history",
          ],
          correctIndex: 2,
          type: "main-idea",
        },
        {
          id: "Q6",
          prompt:
            "Which concern is associated with efficiency-focused cities?",
          options: [
            "Lack of beauty",
            "Loss of community spaces",
            "High population density",
            "Poor governance",
          ],
          correctIndex: 1,
          type: "detail",
        },
        {
          id: "Q7",
          prompt:
            "The author’s attitude toward urban planning can best be described as:",
          options: [
            "Uncritical",
            "Balanced",
            "Dismissive",
            "Enthusiastic",
          ],
          correctIndex: 1,
          type: "tone",
        },
        {
          id: "Q8",
          prompt:
            "The passage suggests that ideal urban planning should:",
          options: [
            "prioritize efficiency",
            "focus on aesthetics",
            "balance multiple concerns",
            "ignore political factors",
          ],
          correctIndex: 2,
          type: "inference",
        },
      ],
    },

    {
      id: "P3",
      title: "Passage 3",
      text: `
Language evolution is shaped by both internal linguistic mechanisms and external
social influences. While grammar may change slowly, vocabulary often adapts rapidly
to cultural and technological shifts.
      `,
      questions: [
        {
          id: "Q9",
          prompt:
            "The passage distinguishes vocabulary from grammar by noting that:",
          options: [
            "grammar is irrelevant",
            "vocabulary changes faster",
            "vocabulary is more complex",
            "grammar adapts to culture",
          ],
          correctIndex: 1,
          type: "detail",
        },
        {
          id: "Q10",
          prompt:
            "Which factor most influences vocabulary change?",
          options: [
            "Linguistic rules",
            "Historical texts",
            "Social and technological shifts",
            "Formal education",
          ],
          correctIndex: 2,
          type: "inference",
        },
        {
          id: "Q11",
          prompt:
            "The author’s purpose is to:",
          options: [
            "argue against language change",
            "highlight mechanisms of language evolution",
            "compare languages",
            "criticize modern communication",
          ],
          correctIndex: 1,
          type: "main-idea",
        },
        {
          id: "Q12",
          prompt:
            "The passage implies that grammar:",
          options: [
            "never changes",
            "changes rapidly",
            "is resistant to change",
            "is socially constructed",
          ],
          correctIndex: 2,
          type: "inference",
        },
      ],
    },

    {
      id: "P4",
      title: "Passage 4",
      text: `
Economic indicators are often treated as objective measures of national well-being.
However, such metrics may fail to capture inequality, environmental degradation,
and overall quality of life.
      `,
      questions: [
        {
          id: "Q13",
          prompt:
            "The passage questions the reliability of:",
          options: [
            "economic growth",
            "policy makers",
            "economic indicators",
            "statistical models",
          ],
          correctIndex: 2,
          type: "main-idea",
        },
        {
          id: "Q14",
          prompt:
            "Which of the following is NOT mentioned as a limitation?",
          options: [
            "Inequality",
            "Environmental damage",
            "Quality of life",
            "Political instability",
          ],
          correctIndex: 3,
          type: "detail",
        },
        {
          id: "Q15",
          prompt:
            "The author’s stance toward economic indicators is best described as:",
          options: [
            "Unquestioning",
            "Skeptical",
            "Supportive",
            "Indifferent",
          ],
          correctIndex: 1,
          type: "tone",
        },
        {
          id: "Q16",
          prompt:
            "The passage suggests that national well-being should be assessed using:",
          options: [
            "only economic data",
            "broader measures",
            "historical comparisons",
            "market trends",
          ],
          correctIndex: 1,
          type: "inference",
        },
      ],
    },
  ],
};
