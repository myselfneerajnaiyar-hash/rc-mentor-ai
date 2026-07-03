"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import ReadingHero from "./analytics/ReadingHero";
import KPIGrid from "./analytics/KPIGrid";
import RCIQTrend from "./analytics/RCIQTrend";
import AccuracySpeedChart from "./analytics/AccuracySpeedChart";
import SkillRadar from "./analytics/SkillRadar";

import PassageTreemap from "./analytics/PassageTreemap";
import PerformanceTrends from "./analytics/PerformanceTrends";
import BirbalInsights from "./analytics/BirbalInsights";
import { calculateReadingIQ } from "../../lib/readingIQ";
import ReadingDNA from "./analytics/ReadingDNA";

export default function CATAnalytics() {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [rcAttempts, setRcAttempts] = useState([]);
const [vaAttempts, setVaAttempts] = useState([]);
const [birbalInsights, setBirbalInsights] = useState(null);
const [loadingBirbal, setLoadingBirbal] = useState(false);

  useEffect(() => {
    async function load() {
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) {
    setLoading(false);
    return;
  }

  const userId = auth.user.id;

  const [
    testRes,
    rcRes,
    vaRes,
  ] = await Promise.all([

    supabase
      .from("mentor_test_attempts")
      .select(`
        *,
        sectional_test_content (
          title,
          exam_year,
          exam_slot,
          source
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),

   (async () => {
  const rcRes = await supabase
    .from("mentor_rc_question_attempts")
    .select(`
      *,
      sectional_question_content!question_id(
        diagnosis,
        passage_id,
        sectional_passage_content!passage_id(
          passage_enrichment
        )
      )
    `)
    .eq("user_id", userId);

  if (rcRes.error) console.error(rcRes.error);

  return rcRes;
})(),
    supabase
      .from("mentor_va_attempts")
      .select(`
        *,
        sectional_va_content(
          diagnosis
        )
      `)
      .eq("user_id", userId),

  ]);

  setAttempts(testRes.data || []);
  setRcAttempts(rcRes.data || []);
  setVaAttempts(vaRes.data || []);
  

  setLoading(false);
}

    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-white text-2xl py-20">
        Loading Analytics...
      </div>
    );
  }

  if (attempts.length === 0) {
  return (
    <div className="max-w-4xl mx-auto py-16">
      <div className="rounded-3xl border border-slate-700 bg-slate-900 p-10 text-center">

        <div className="text-6xl mb-6">📊</div>

        <h2 className="text-3xl font-bold text-white mb-4">
          CAT Analytics
        </h2>

        <p className="text-slate-400 text-lg">
          You haven't attempted any CAT VARC tests yet.
        </p>

        <p className="text-slate-500 mt-3">
          Attempt your first CAT VARC test to unlock Reading IQ,
          accuracy trends, Reading DNA, performance analysis and
          Birbal's AI insights.
        </p>

      </div>
    </div>
  );
}

  const totalTests = attempts.length;
  const totalQuestions = attempts.reduce(
    (a, b) => a + (b.total_questions || 0),
    0
  );
  const totalCorrect = attempts.reduce(
    (a, b) => a + (b.correct || 0),
    0
  );
  const totalWrong = attempts.reduce(
    (a, b) => a + (b.wrong || 0),
    0
  );
  const avgAccuracy =
    totalQuestions === 0
      ? 0
      : Math.round((totalCorrect / totalQuestions) * 100);

      const totalScore = attempts.reduce(
  (sum, t) => sum + (t.score || 0),
  0
);

const avgTime =
  totalTests === 0
    ? 0
    : Math.round(
        attempts.reduce((sum, t) => sum + (t.time_taken_s || 0), 0) /
        totalTests
      );

const averageIQ =
  totalTests === 0
    ? 0
    : Math.round(
        attempts.reduce(
          (sum, test) => sum + calculateReadingIQ(test),
          0
        ) / totalTests
      );

const heroStats = {
  tests: totalTests,
  accuracy: avgAccuracy,
  score: totalScore,
  rciq: averageIQ,
};

async function generateBirbalInsights(
  attempts,
  rcAttempts,
  vaAttempts
) {
  try {
    const res = await fetch("/api/birbal-insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attempts,
        rcAttempts,
        vaAttempts,
      }),
    });

    const data = await res.json();

    console.log("Birbal Insights", data);

    setBirbalInsights(data);
  } catch (err) {
    console.error(err);
  }
}

async function handleGenerateInsights() {
  setLoadingBirbal(true);

  await generateBirbalInsights(
    attempts,
    rcAttempts,
    vaAttempts
  );

  setLoadingBirbal(false);
}

 return (
  <div className="max-w-7xl mx-auto px-8 py-10">

    <ReadingHero stats={heroStats} />

     <KPIGrid
      attempts={attempts}
      totalQuestions={totalQuestions}
      totalCorrect={totalCorrect}
      totalWrong={totalWrong}
      avgTime={avgTime}
    />

     <RCIQTrend attempts={attempts} />

     <AccuracySpeedChart attempts={attempts} />
     <ReadingDNA
  rcAttempts={rcAttempts}
  vaAttempts={vaAttempts}
  avgTime={avgTime}
/>

     <SkillRadar
  rcAttempts={rcAttempts}
  vaAttempts={vaAttempts}

/>

 <PassageTreemap
  rcAttempts={rcAttempts}
/>
    
    

 

    <PerformanceTrends attempts={attempts} />
  

   {!birbalInsights ? (

<div className="mt-12 rounded-3xl border border-cyan-500/20 bg-slate-900/60 p-10 text-center">

<div className="text-6xl mb-4">
🧠
</div>

<h2 className="text-3xl font-bold text-white">
Birbal Intelligence Report
</h2>

<p className="text-slate-400 max-w-2xl mx-auto mt-3">
Go beyond scores. Let Birbal analyze your reading behaviour,
thinking patterns, recurring mistakes and create a personalized
improvement roadmap.
</p>

<button
  onClick={handleGenerateInsights}
  disabled={loadingBirbal}
  className="mt-8 px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-white font-semibold transition flex items-center justify-center gap-3 mx-auto"
>
  {loadingBirbal ? (
    <>
      <div className="h-5 w-5 rounded-full border-[3px] border-cyan-200 border-t-cyan-500 animate-spin" />
      <span>Birbal is analyzing...</span>
    </>
  ) : (
    <>
      🧠 Generate AI Report
    </>
  )}
</button>

</div>

) : (

<BirbalInsights insights={birbalInsights} />

)}

  </div>
);

      
}