"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TestResultView from "../../../../cat-arena/components/TestResultView";
import TestDiagnosisTabs
from "../../../../cat-arena/components/test-diagnosis/TestDiagnosisTabs";

export default function ResultPage({
  params,
}) {
    const router = useRouter();

  const [attempt, setAttempt] =
    useState(null);
    const [showDiagnosis, setShowDiagnosis] =
  useState(false);

  useEffect(() => {

    async function loadAttempt() {

      const { data } =
        await supabase
          .from("mentor_test_attempts")
          .select("*")
          .eq(
            "id",
            params.attemptId
          )
          .single();

      if (!data) return;

      console.log("FULL DATA", data);
console.log("TEST ID FROM DB", data.test_id);

   setAttempt({
  id: data.id,               // <-- ADD THIS

  ...data.payload,

  test_id: data.test_id,

  score: data.score,
  correct: data.correct,
  wrong: data.wrong,
  attempted: data.attempted,

  accuracy: data.accuracy_percent,

  analysis: data.analysis || {},
});
    }

    loadAttempt();

  }, [params.attemptId]);

  if (!attempt) {
    return (
      <div className="p-10 text-white">
        Loading Result...
      </div>
    );
  }

 if (showDiagnosis) {
  return (
    <TestDiagnosisTabs
      attempt={attempt}
      onBack={() => setShowDiagnosis(false)}
    />
  );
}

 return (
  <TestResultView
  attempt={attempt}
  onViewDiagnosis={() =>
    setShowDiagnosis(true)
  }
  onExit={() => router.push("/?view=cat")}
/>
);
}