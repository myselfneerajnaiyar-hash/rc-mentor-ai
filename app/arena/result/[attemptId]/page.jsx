"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Recovery from "@/components/mobile/Recovery";
import NextActivity from "@/components/mobile/NextActivity";
import { withTimeout } from "@/lib/mobile/request";
import TestResultView from "../../../../cat-arena/components/TestResultView";
import TestDiagnosisTabs
from "../../../../cat-arena/components/test-diagnosis/TestDiagnosisTabs";

export default function ResultPage({
  params,
}) {
    const router = useRouter();

  const [error,setError]=useState(null);
  const [retry,setRetry]=useState(0);
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

      if (!data) throw new Error("This result could not be loaded. Your saved attempt has not been changed.");

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

    setError(null);withTimeout(loadAttempt()).catch(e=>setError(e.message));

  }, [params.attemptId,retry]);

  if(error)return <main className="p-5"><Recovery area="sectional_result" message={error} onRetry={()=>setRetry(n=>n+1)}/></main>;
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
  <><TestResultView
  attempt={attempt}
  onViewDiagnosis={() =>
    setShowDiagnosis(true)
  }
  onExit={() => router.push("/?view=cat")}
/><NextActivity current="cat"/></>
);
}