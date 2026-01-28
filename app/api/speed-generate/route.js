import { NextResponse } from "next/server";

function generatePassage() {
  return `The interplay between individual agency and social structure remains a pivotal concern in both sociology and philosophy. While traditional perspectives often emphasize the primacy of social forces in shaping behavior, recent scholarship underscores the significance of personal choice. It is crucial to recognize that individuals operate within a matrix of cultural expectations and institutional constraints, which both enable and restrict their actions. This duality suggests that agency is not merely a defiance of societal norms but rather a navigation through them.

Socioeconomic status, education, and access to resources can drastically alter one’s ability to exercise choice. Thus, while individual actions can signal resistance to oppressive structures, they cannot wholly transcend the limitations imposed by these very structures. Consequently, a comprehensive understanding of human behavior necessitates a nuanced appreciation of how individual autonomy interacts with collective forces. Ultimately, while individuals are agents of change, they are also products of their environment.`;
}

function generateQuestions() {
  return [
    {
      q: "What is the main idea of the passage?",
      options: [
        "Social structures completely control individuals.",
        "Personal choice is irrelevant in society.",
        "Agency exists within social constraints.",
        "Education alone determines freedom."
      ],
      correct: 2,
    },
    {
      q: "What can be inferred about agency?",
      options: [
        "It is total freedom.",
        "It is meaningless.",
        "It operates within limits.",
        "It opposes all norms."
      ],
      correct: 2,
    },
  ];
}

export async function GET() {
  return NextResponse.json({
    text: generatePassage(),
    questions: generateQuestions(),
  });
}

export async function POST(req) {
  // we ignore body for now – keep it stable first
  return NextResponse.json({
    text: generatePassage(),
    questions: generateQuestions(),
  });
}
