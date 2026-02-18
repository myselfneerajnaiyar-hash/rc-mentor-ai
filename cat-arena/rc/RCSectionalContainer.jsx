"use client";

import { useEffect, useState } from "react";
import CATInstructions from "../CATInstructions";
import CATArenaTestView from "../CATArenaTestView";
import DiagnosisView from "../components/DiagnosisView";
import { supabase } from "../../lib/supabase";

export default function RCSectionalContainer({
  testData,
  onExit,
  forceDiagnosis,
}) {
 const sectionalId = testData?.id;

  const [phase, setPhase] = useState(
    forceDiagnosis ? "diagnosis" : "instructions"
  );

  const [lastAttempt, setLastAttempt] = useState(null);
  const [loadedTestData, setLoadedTestData] = useState(null);

  /* ================= LOAD TEST JSON ================= */
  useEffect(() => {
    if (!sectionalId) return;

    async function loadTest() {
      const res = await fetch(`/api/cat-sectionals/${sectionalId}`);
      if (!res.ok) return;
      const json = await res.json();
      setLoadedTestData(json);
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
        .from("sectional_tests")
        .select("payload")
        .eq("user_id", authData.user.id)
        .eq("sectional_id", sectionalId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.payload) {
        setLastAttempt(data.payload);
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
  setPhase("diagnosis");
  return;
}

 const attempted = payload.attempted;
const correct = payload.correct;

const wrong = attempted - correct;

const score = correct * 3 - wrong;
const accuracy = payload.attempted
  ? Math.round((payload.correct / payload.attempted) * 100)
  : 0;

// 1️⃣ Insert into sectional_tests
const { data: testRow, error: testError } = await supabase
  .from("sectional_tests")
  .insert({
    user_id: authData.user.id,
    sectional_id: sectionalId,

    total_passages: payload.passages.length,
    total_questions: payload.total,
    correct_answers: correct,
    wrong_answers: wrong,
    score: score,
    accuracy_percent: accuracy,
    time_taken_s: payload.timeTaken,
    time_limit_s: 1800,

    payload: payload,
  })
  .select()
  .single();
if (testError) {
  console.log("TEST INSERT ERROR:", testError);

  return;
}

const testId = testRow.id;



// 2️⃣ Insert into sectional_test_attempts
await supabase.from("sectional_test_attempts").insert({
  user_id: authData.user.id,
  test_id: testId,
  
  total_correct: payload.correct,
  total_wrong: wrong,
total_score: score,
  total_time_s: payload.timeTaken,
});


// 3️⃣ Insert into sectional_passages
for (let pIndex = 0; pIndex < payload.passages.length; pIndex++) {
  const passage = payload.passages[pIndex];
  const questions = passage.questions;

  let correctCount = 0;
  let timeSpent = 0;

  questions.forEach((q, qIndex) => {
    const globalIndex = pIndex * 4 + qIndex;

    if (payload.answers[globalIndex] === q.correctIndex) {
      correctCount++;
    }

    timeSpent += payload.questionTime[globalIndex] || 0;
  });

  await supabase.from("sectional_passages").insert({
    user_id: authData.user.id,
    test_id: testId,
    passage_number: pIndex + 1,
    total_questions: questions.length,
    correct_answers: correctCount,
    time_spent_s: timeSpent,
  });
}


// 4️⃣ Insert into sectional_question_attempts
for (let pIndex = 0; pIndex < payload.passages.length; pIndex++) {
  const passage = payload.passages[pIndex];
  const questions = passage.questions;

  for (let qIndex = 0; qIndex < questions.length; qIndex++) {
    const globalIndex = pIndex * 4 + qIndex;
    const q = questions[qIndex];

   await supabase.from("sectional_question_attempts").insert({
  user_id: authData.user.id,
  test_id: testId,
  passage_id: null,
  question_number: globalIndex + 1,
  question_type: q.type || "RC",
  is_correct: payload.answers[globalIndex] === q.correctIndex,
  time_taken_s: payload.questionTime[globalIndex] || 0,
});
  }
}


// Finally move to diagnosis
setLastAttempt(payload);
setPhase("diagnosis");
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

  /* ================= DIAGNOSIS ================= */
  if (phase === "diagnosis" && lastAttempt) {
    return (
      <DiagnosisView
        passages={lastAttempt.passages}
        questions={lastAttempt.questions}
        answers={lastAttempt.answers}
        questionTime={lastAttempt.questionTime}
        onReview={() => setPhase("review")}
        onBack={onExit}
      />
    );
  }

  return null;
}