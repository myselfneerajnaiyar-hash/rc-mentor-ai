"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CATInstructions from "../CATInstructions";
import CATArenaTestView from "../CATArenaTestViewV2";
import DiagnosisView from "../components/DiagnosisView";
import { supabase } from "../../lib/supabase";
import TestResultView
from "../components/TestResultView";
import TestDiagnosisTabs
from "../components/test-diagnosis/TestDiagnosisTabs";

export default function RCSectionalContainer({
      
  testData,
  onExit,
  forceDiagnosis,
}) {
    console.log("🔥 V2 LOADED");
    const router = useRouter();
 const sectionalId = testData?.id;

  const [phase, setPhase] = useState(
    forceDiagnosis ? "diagnosis" : "instructions"
  );

  const [lastAttempt, setLastAttempt] = useState(null);
  const [loadedTestData, setLoadedTestData] = useState(null);
  

/* ================= LOAD TEST FROM SUPABASE ================= */
useEffect(() => {
  if (!sectionalId) return;

  async function loadTest() {

    const { data: passages } =
      await supabase
        .from("sectional_passage_content")
        .select("*")
        .eq("test_id", sectionalId)
        .order("passage_number");

    const { data: questions } =
      await supabase
        .from("sectional_question_content")
        .select("*")
        .eq("test_id", sectionalId)
        .order("question_number");

        const { data: vaQuestions } =
  await supabase
    .from("sectional_va_content")
    .select("*")
    .eq("test_id", sectionalId)
    .order("question_number");

   

    if (!passages?.length) return;

    const transformedPassages =
      passages.map((passage) => {

        const passageQuestions =
          questions
            .filter(
              q => q.passage_id === passage.id
            )
          .map(q => ({

  stem:
    q.question_text,

  options:
    (q.options || []).map(
      opt => opt.text
    ),

  correctIndex:
    Number(q.correct_answer) - 1,

  explanation:
    JSON.stringify(
      q.diagnosis || {}
    ),

  type:
    q.question_type,

  id:
    q.id,

}));
        return {

          id:
            passage.id,

          text:
            passage.passage_text,

          passage:
            passage.passage_text,

          enrichment:
            passage.passage_enrichment,

          questions:
            passageQuestions,

        };
      });

  const transformedVA = {
  id: "va-block",
  text: "",
  passage: "",
  isVA: true,

  questions: vaQuestions.map(q => {
    console.log(
  "VA ANSWER",
  q.question_type,
  q.correct_answer
);


    const payload = q.payload || {};

    return {
      id: q.id,
      type: q.question_type,

      stem:
        payload.questionText ||
        payload.paragraph ||
        payload.sentences?.join("\n\n") ||
        "",

      options:
        payload.options || [],

      correctAnswer:
  String(q.correct_answer),

      payload,

      explanation:
        JSON.stringify(q.diagnosis || {}),
    };
  }),
};
 setLoadedTestData({
  id: sectionalId,
  passages: [
    ...transformedPassages,
    transformedVA,
  ],
});
  }

  loadTest();
}, [sectionalId]);
  /* ================= LOAD LAST ATTEMPT ================= */
  useEffect(() => {
    if (!sectionalId) return;

    async function checkAttempt() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data } = await supabase
        .from("mentor_test_attempts")
        .select("*")
        .eq("user_id", authData.user.id)
        .eq("test_id", sectionalId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (data) {

  setLastAttempt({
    ...data.payload,

    score: data.score,
    correct: data.correct,
    wrong: data.wrong,
    attempted: data.attempted,

    accuracy:
      data.accuracy_percent,

    analysis:
      data.analysis || {},
  });
}
    }

    checkAttempt();
  }, [sectionalId]);

  /* ================= FORCE DIAGNOSIS SYNC ================= */
  useEffect(() => {
    if (forceDiagnosis) {
      setPhase("diagnosis");
    }
  }, [forceDiagnosis]);

  /* ================= INSTRUCTIONS ================= */
  if (phase === "instructions") {
    return <CATInstructions onStart={() => setPhase("test")} />;
  }

  /* ================= TEST ================= */
  if (phase === "test") {
    if (!loadedTestData) {
      return <div style={{ padding: 40 }}>Loading test...</div>;
    }

    return (
      <CATArenaTestView
        testData={loadedTestData}
        mode="test"
       onSubmit={async (payload) => {
  // 🔍 CHECK SESSION
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  console.log("SESSION:", session);
  console.log("SESSION ERROR:", sessionError);

  const { data: authData, error: userError } = await supabase.auth.getUser();
  console.log("USER:", authData);
  console.log("USER ERROR:", userError);

 if (!authData?.user) {
  console.log("⚠️ No authenticated user — skipping DB save");

  // STILL MOVE TO DIAGNOSIS
  setLastAttempt(payload);
setPhase("result");
  return;
}

 let score = 0;
let correct = 0;
let wrong = 0;
let attempted = 0;

let globalIndexForScore = 0;

for (const passage of payload.passages) {

  // RC QUESTIONS
  if (!passage.isVA) {

    for (const q of passage.questions) {

      const selected =
        payload.answers[globalIndexForScore];

      const isAttempted =
        selected !== null &&
        selected !== undefined;

      if (isAttempted) {

        attempted++;

        const isCorrect =
          selected === q.correctIndex;

        if (isCorrect) {
          correct++;
          score += 3;
        } else {
          wrong++;
          score -= 1;
        }
      }

      globalIndexForScore++;
    }

    continue;
  }

  // VA QUESTIONS
  for (const q of passage.questions) {

    const selected =
      payload.answers[globalIndexForScore];

    const isAttempted =
      selected !== null &&
      selected !== undefined &&
      selected !== "";

    if (isAttempted) {

      attempted++;

      let isCorrect = false;

      const correctAnswer =
        String(q.correctAnswer).trim();

      if (q.type === "Para Jumble") {

        isCorrect =
          String(selected).trim() ===
          correctAnswer;

      } else if (
        q.type === "Odd Sentence Out"
      ) {

        isCorrect =
          String(selected) ===
          correctAnswer;

      } else if (
        q.type === "Sentence Placement"
      ) {

        isCorrect =
          `Option ${Number(selected) + 1}` ===
          correctAnswer;

      } else if (
        q.type === "Para Summary"
      ) {

        const selectedText =
          q.options?.[selected];

        isCorrect =
          selectedText?.trim() ===
          correctAnswer;
      }

      if (isCorrect) {

        correct++;
        score += 3;

      } else {

        wrong++;

        // CAT TITA RULE
        if (
          q.type !== "Para Jumble" &&
          q.type !== "Odd Sentence Out"
        ) {
          score -= 1;
        }
      }
    }

    globalIndexForScore++;
  }
}

const accuracy =
  attempted > 0
    ? Math.round(
        (correct / attempted) * 100
      )
    : 0;

const questionReview = [];

    const analysis = {
  passages: [],
  questionTypes: [],
  strongestArea: null,
  weakestArea: null,
  rcStats: {},
  vaStats: {},
  timeStats: {},
  birbalVerdict: "",
};

 const typeStats = {};
 let fastestCorrect = Infinity;
let timeOnWrongs = 0;

    console.log("FINAL SCORE", {
  score,
  correct,
  wrong,
  attempted,
  accuracy,
});

// 1️⃣ Insert into sectional_tests

  const { data: attemptRow, error: attemptError } =
  await supabase
    .from("mentor_test_attempts")
    .insert({
      user_id: authData.user.id,

      test_id: sectionalId,

      score,
      correct,
      wrong,
      attempted,

      accuracy_percent: accuracy,

      total_questions: payload.total,

      time_taken_s: payload.timeTaken,

      payload,
      analysis: {},
    })
    .select()
    .single();

if (attemptError) {
  console.log(attemptError);
  return;
}

const attemptId = attemptRow.id;



// 2️⃣ Insert into sectional_test_attempts


// 3️⃣ Insert into sectional_passages

let rcGlobalIndex = 0;
const rcPassages =
  payload.passages.filter(
    p => !p.isVA
  );

for (
  let pIndex = 0;
  pIndex < rcPassages.length;
  pIndex++
) {
  const passage = rcPassages[pIndex];
  const questions = passage.questions;

  let correctCount = 0;
  let timeSpent = 0;

  questions.forEach((q) => {

  if (
    payload.answers[rcGlobalIndex] ===
    q.correctIndex
  ) {
    correctCount++;
  }

  timeSpent +=
    payload.questionTime[
      rcGlobalIndex
    ] || 0;

  rcGlobalIndex++;
});

analysis.passages.push({
  passageNumber: pIndex + 1,
  title:
    passage.enrichment?.title ||
    `Passage ${pIndex + 1}`,
  correct: correctCount,
  total: questions.length,
  accuracy:
    Math.round(
      (correctCount / questions.length) *
      100
    ),
  timeSpent,
});
  await supabase
  .from("mentor_rc_passage_attempts")
  .insert({
    attempt_id: attemptId,

    user_id: authData.user.id,

    passage_id: passage.id,

    passage_number: pIndex + 1,

    total_questions: questions.length,

    correct: correctCount,

    wrong:
      questions.length - correctCount,

    accuracy_percent:
      questions.length
        ? Math.round(
            (correctCount /
              questions.length) *
              100
          )
        : 0,

    time_spent_s: timeSpent,
  });
}


// 4️⃣ Insert into sectional_question_attempts
let globalIndex = 0;

for (const passage of payload.passages) {

  if (passage.isVA) continue;

  for (const q of passage.questions) {

    const isCorrect =
  payload.answers[globalIndex] ===
  q.correctIndex;

 questionReview.push({
  section: "RC",

  questionId: q.id,

  questionType: q.type,

  passageTitle:
    passage.enrichment?.title,

  selectedAnswer:
    payload.answers[globalIndex],

  correctAnswer:
    q.correctIndex,

  isCorrect,

  timeSpent:
    payload.questionTime[
      globalIndex
    ] || 0,

  diagnosis:
    JSON.parse(
      q.explanation || "{}"
    ),
});

if (isCorrect) {

  fastestCorrect = Math.min(
    fastestCorrect,
    payload.questionTime[
      globalIndex
    ] || Infinity
  );

} else {

  timeOnWrongs +=
    payload.questionTime[
      globalIndex
    ] || 0;
}

   
    await supabase
      .from("mentor_rc_question_attempts")
      .insert({
        attempt_id: attemptId,

        user_id:
          authData.user.id,

        passage_id:
          passage.id,

        question_id:
          q.id,

        question_number:
          globalIndex + 1,

        selected_answer:
          payload.answers[
            globalIndex
          ] == null
            ? null
            : String(
                payload.answers[
                  globalIndex
                ]
              ),

        correct_answer:
          String(
            q.correctIndex
          ),

       is_correct: isCorrect,

        time_taken_s:
          payload.questionTime[
            globalIndex
          ] || 0,
      });

    globalIndex++;
  }
}

const vaPassage =
  payload.passages.find(
    p => p.isVA
  );

if (vaPassage) {

  let vaStartIndex = 0;

  for (const p of payload.passages) {

    if (p.isVA) break;

    vaStartIndex +=
      p.questions.length;
  }

  let currentIndex =
    vaStartIndex;

   

 for (const q of vaPassage.questions) {

  console.log(
    "VA CHECK",
    q.type,
    payload.answers[currentIndex],
    q.correctAnswer,
    q
  );

 let isCorrect = false;

const selected =
  payload.answers[currentIndex];

const correctAnswer =
  String(q.correctAnswer).trim();

if (q.type === "Para Jumble") {

  isCorrect =
    String(selected).trim() ===
    correctAnswer;

}

else if (
  q.type === "Odd Sentence Out"
) {

  isCorrect =
    String(selected) ===
    correctAnswer;

}

else if (
  q.type === "Sentence Placement"
) {

  isCorrect =
    `Option ${Number(selected) + 1}` ===
    correctAnswer;

}

else if (
  q.type === "Para Summary"
) {

  const selectedText =
    q.options?.[selected];

  isCorrect =
    selectedText?.trim() ===
    correctAnswer;

}

questionReview.push({
  section:"VA",

  questionId:q.id,

  questionType:q.type,

  questionText:q.stem,

  selectedAnswer:selected,

  correctAnswer:correctAnswer,

  isCorrect,

  timeSpent:
    payload.questionTime[
      currentIndex
    ] || 0,

  diagnosis:
    JSON.parse(
      q.explanation || "{}"
    ),
});

if (isCorrect) {

  fastestCorrect = Math.min(
    fastestCorrect,
    payload.questionTime[
      currentIndex
    ] || Infinity
  );

} else {

  timeOnWrongs +=
    payload.questionTime[
      currentIndex
    ] || 0;
}

if (!typeStats[q.type]) {
  typeStats[q.type] = {
    correct: 0,
    total: 0,
  };
}

typeStats[q.type].total++;

if (isCorrect) {
  typeStats[q.type].correct++;
}



console.log(
  "SP CHECK",
  selected,
  q.options?.[Number(selected)],
  correctAnswer,
  isCorrect
);
  

  await supabase
    .from("mentor_va_attempts")
    .insert({
      attempt_id: attemptId,

      user_id: authData.user.id,

      va_question_id: q.id,

      question_number:
        currentIndex -
        vaStartIndex +
        1,

      question_type: q.type,

      selected_answer:
        selected,

      correct_answer:
        correctAnswer,

     is_correct: isCorrect,
      time_taken_s:
        payload.questionTime[
          currentIndex
        ] || 0,
    });

  currentIndex++;
}
}
const rcPassageStats =
  analysis.passages.reduce(
    (acc, p) => {
      acc.correct += p.correct;
      acc.total += p.total;
      return acc;
    },
    {
      correct: 0,
      total: 0,
    }
  );

analysis.rcStats = {
  correct: rcPassageStats.correct,
  total: rcPassageStats.total,
  accuracy:
    rcPassageStats.total
      ? Math.round(
          (rcPassageStats.correct /
            rcPassageStats.total) *
            100
        )
      : 0,
};

const vaCorrect =
  Object.values(typeStats)
    .reduce(
      (sum, t) =>
        sum + t.correct,
      0
    );

const vaTotal =
  Object.values(typeStats)
    .reduce(
      (sum, t) =>
        sum + t.total,
      0
    );

analysis.vaStats = {
  correct: vaCorrect,
  total: vaTotal,
  accuracy:
    vaTotal
      ? Math.round(
          (vaCorrect /
            vaTotal) *
            100
        )
      : 0,
};

analysis.questionTypes =
  Object.entries(typeStats).map(
    ([type, value]) => ({
      type,
      correct: value.correct,
      total: value.total,
      accuracy:
        Math.round(
          (value.correct /
            value.total) *
            100
        ),
    })
  );

 const sortedTypes =
  [...analysis.questionTypes];

const hasVariation =
  new Set(
    sortedTypes.map(
      x => x.accuracy
    )
  ).size > 1;

if (hasVariation) {

  analysis.strongestArea =
    [...sortedTypes]
      .sort(
        (a, b) =>
          b.accuracy - a.accuracy
      )[0];

  analysis.weakestArea =
    [...sortedTypes]
      .sort(
        (a, b) =>
          a.accuracy - b.accuracy
      )[0];

} else {

  analysis.strongestArea = null;
  analysis.weakestArea = null;

}
const totalTime =
  payload.questionTime.reduce(
    (a, b) => a + b,
    0
  );

const times =
  payload.questionTime.filter(
    t => t > 0
  );

analysis.timeStats = {
  average:
    times.length
      ? Math.round(
          totalTime /
          times.length
        )
      : 0,

  totalTime,

  slowestQuestion:
    times.length
      ? Math.max(...times)
      : 0,

  fastestCorrect:
    fastestCorrect === Infinity
      ? 0
      : fastestCorrect,

  timeOnWrongs,
};


    console.log(
  "QUESTION REVIEW",
  questionReview
);

   const verdictResponse =
  await fetch(
    "/api/mentor-verdict",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
   body: JSON.stringify({
  score,
  accuracy,

  attempted,
  correct,
  wrong,

  passages: analysis.passages,

  questionTypes:
    analysis.questionTypes,

  strongestArea:
    analysis.strongestArea,

  weakestArea:
    analysis.weakestArea,

  rcStats:
    analysis.rcStats,

  vaStats:
    analysis.vaStats,

  timeStats:
    analysis.timeStats,

  questionReview,
})
    }
  );


const mentorVerdict =
  await verdictResponse.json();
  console.log(
  "MENTOR VERDICT",
  mentorVerdict
);

const cognitiveResponse =
  await fetch(
    "/api/cognitive-diagnosis",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        questionReview,
      }),
    }
  );

const cognitiveDiagnosis =
  await cognitiveResponse.json();

analysis.mentorVerdict =
  mentorVerdict;

analysis.cognitiveDiagnosis =
  cognitiveDiagnosis;

    console.log(
  "FINAL ANALYSIS",
  analysis
);

analysis.questionReview =
  questionReview;

const finalAnalysis = JSON.parse(
  JSON.stringify(analysis)
);

console.log(
  "FINAL ANALYSIS JSON",
  JSON.stringify(analysis, null, 2)
);


console.log(
  "SAVING",
  finalAnalysis.mentorVerdict
);
const result = await supabase
  .from("mentor_test_attempts")
  .update({
    analysis: finalAnalysis,
  })
  .eq("id", attemptId)
  .select("*");

console.log("UPDATE RESULT", result);


// Finally move to diagnosis
router.push(
  `/arena/result/${attemptId}`
);
}}
      />
    );
  }

  if (phase === "review" && lastAttempt && loadedTestData) {
  return (
    <CATArenaTestView
      testData={loadedTestData}
      mode="review"
      initialState={lastAttempt}
      onBackToDiagnosis={() => setPhase("diagnosis")}
      onExit={onExit}
    />
  
  );
}

if (phase === "result" && lastAttempt) {
  return (
    <TestResultView
      attempt={lastAttempt}
      onViewDiagnosis={() =>
        setPhase("diagnosis")
      }
      onExit={onExit}
    />
  );
}

  /* ================= DIAGNOSIS ================= */
  if (phase === "diagnosis" && lastAttempt) {
  return (
    <TestDiagnosisTabs
      attempt={lastAttempt}
      onBack={onExit}
    />
  );
}

  return null;
}