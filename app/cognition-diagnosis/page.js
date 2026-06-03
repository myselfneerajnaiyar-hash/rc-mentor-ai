"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Brain,
  Target,
  Skull,
  TrendingUp,
  ShieldAlert,
  Sparkles
} from "lucide-react";

export default function CognitionDiagnosisPage() {

  const [rcSet, setRcSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function loadData() {

    const user =
  await supabase.auth.getUser();

const { data: latestAttempt } =
  await supabase
    .from("daily_rc_attempts")
    .select("*")
    .eq(
      "user_id",
      user.data.user.id
    )
    .order("completed_at", {
      ascending: false,
    })
    .limit(1)
    .single();

if (!latestAttempt) {
  setLoading(false);
  return;
}

const { data } =
  await supabase
    .from("daily_rc_sets")
    .select("*")
    .eq(
      "id",
      latestAttempt.daily_rc_set_id
    )
    .single();

setRcSet(data);

      const { data: questionData } =
        await supabase
          .from("daily_rc_questions")
          .select("*")
          .eq(
            "daily_rc_set_id",
            data.id
          )
          .order("order_no");

      setQuestions(questionData || []);

     

     

      if (latestAttempt) {

        const { data: attemptRows } =
          await supabase
            .from(
              "daily_rc_question_attempts"
            )
            .select("*")
            .eq(
              "attempt_id",
              latestAttempt.id
            );

        setAttempts(
          attemptRows || []
        );
      }

      setLoading(false);
    }

    loadData();

  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071120] text-white flex items-center justify-center">
        Loading Diagnosis...
      </div>
    );
  }

  const wrongQuestions =
    questions.filter((question) => {

      const attempt =
        attempts.find(
          a =>
            a.question_id === question.id
        );

      return (
        attempt &&
        !attempt.is_correct
      );

    });

  const firstWrong =
    wrongQuestions[0];

  const diagnosis =
    firstWrong?.question_enrichment
      ?.cognitiveErrorTested ||
    "No major cognitive error detected";

  const trap =
    firstWrong?.question_enrichment
      ?.trapType ||
    "No major trap";

  const whyFail =
    firstWrong?.question_enrichment
      ?.whyStudentsFail ||
    "No major issue detected.";

  const topperThinking =
    firstWrong?.question_enrichment
      ?.idealThinkingProcess ||
    "Think about the author's purpose before selecting an option.";

  const mission =
    firstWrong?.question_enrichment
      ?.primarySkill ||
    "RC Accuracy";

  return (

    <div className="min-h-screen bg-[#071120] text-white">

      <div className="max-w-6xl mx-auto px-8 py-10">

       <div className="flex items-center justify-between mb-8">

  <Link href="/">
    <div className="flex items-center gap-3 cursor-pointer">

      <img
        src="/logo.png"
        className="w-8 h-8"
      />

      <div>

        <div className="font-bold text-white">
          Auctor RC
        </div>

        <div className="text-xs text-slate-400">
          Daily Arena
        </div>

      </div>

    </div>
  </Link>

  <div className="flex items-center gap-4">

    <Link
      href="/daily-challenge/result"
      className="
      inline-flex
      items-center
      gap-2
      text-slate-400
      hover:text-white
      "
    >
      <ArrowLeft size={18} />
      Back to Results
    </Link>

    <Link href="/">
      <button
        className="
        px-4 py-2
        rounded-xl
        bg-slate-800
        text-white
        hover:bg-slate-700
        "
      >
        Dashboard
      </button>
    </Link>

  </div>

</div>

       <div>

  <h1 className="text-6xl font-black">
    Cognitive Diagnosis
  </h1>

  <p className="text-slate-400 mt-4 max-w-2xl">
    Birbal watched every decision you made.
    Here's what really happened inside your head.
  </p>

</div>

       <Card className="mt-10 bg-gradient-to-br from-cyan-500/15 to-blue-500/5 border-cyan-500/20 overflow-hidden">

  <CardContent className="p-8">

    <div className="relative">

      <div>

        <div className="flex items-center gap-3">

          <Brain
            size={32}
            className="text-cyan-300"
          />

          <div className="text-cyan-300 text-sm uppercase tracking-widest font-black">
            Birbal's Verdict
          </div>

        </div>

        <div className="text-5xl font-black text-white mt-6">
          {diagnosis}
        </div>

        <p className="mt-6 text-slate-300 leading-8 text-lg">
          {whyFail}
        </p>

<div className="flex justify-end mt-4">
  <img
    src="/birbal.png"
    alt="Birbal"
    className="w-12 opacity-70"
  />
</div>
      </div>

     

    </div>


  </CardContent>

</Card>

        <Card className="mt-6 bg-red-500/10 border-red-500/20">
          <CardContent className="p-8">

           <div className="flex gap-5 items-center">

  <Skull
    className="
      h-12
      w-12
      text-red-400
    "
  />

  <div>

    <div className="text-red-300 font-black">
      Today's Villain
    </div>

    <div className="text-4xl font-black text-white mt-2">
      {trap}
    </div>

  </div>

</div>

          </CardContent>
        </Card>

        <Card className="mt-6 bg-orange-500/10 border-orange-500/20">
  <CardContent className="p-8">

    <div className="text-orange-300 font-black text-xl">
      Why Your Brain Fell For It
    </div>

    <p className="mt-4 text-slate-300 leading-8">
      {whyFail}
    </p>

  </CardContent>
</Card>

<Card className="mt-6 bg-red-500/5 border-red-500/20">
  <CardContent className="p-8">

    <div className="text-red-300 font-black text-xl">
      Villain Dossier
    </div>

    <div className="mt-6 space-y-5">

      <div>
        <div className="text-red-300 font-bold">
          Villain
        </div>

        <div className="text-white mt-1">
          {trap}
        </div>
      </div>

      <div>
        <div className="text-red-300 font-bold">
          How It Attacks
        </div>

        <div className="text-slate-300 mt-1">
          {firstWrong?.question_enrichment?.whyThisTrapWorks}
        </div>
      </div>

      <div>
        <div className="text-red-300 font-bold">
          Under Time Pressure
        </div>

        <div className="text-slate-300 mt-1">
          {firstWrong?.question_enrichment?.timePressureDanger}
        </div>
      </div>

    </div>

  </CardContent>
</Card>

        <Card className="mt-6 bg-purple-500/10 border-purple-500/20">
          <CardContent className="p-8">

            <div className="flex gap-5">

  <Sparkles
    className="
      h-12
      w-12
      text-purple-400
      shrink-0
    "
  />

  <div>

    <div className="text-purple-300 font-black">
      What A Topper Would Think
    </div>

    <p className="mt-4 text-slate-300 text-lg leading-8">
      {topperThinking}
    </p>

  </div>

</div>

          </CardContent>
        </Card>

        <Card className="mt-6 bg-cyan-500/10 border-cyan-500/20">
  <CardContent className="p-8">

    <div className="text-cyan-300 font-black text-xl">
      Birbal's Lesson
    </div>

    <p className="mt-6 text-slate-300 leading-8">
      {firstWrong?.question_enrichment?.skillExplanation}
    </p>

  </CardContent>
</Card>

        <Card className="mt-6 bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-8">

            <div className="flex gap-5 items-center">

  <Target
    className="
      h-12
      w-12
      text-emerald-400
    "
  />

  <div>

    <div className="text-emerald-300 font-black">
      Tomorrow's Mission
    </div>

    <div className="text-5xl font-black text-white mt-2">
      {mission}
    </div>

  </div>

</div>

          </CardContent>
        </Card>

        <div className="mt-10">

         <div className="flex items-center gap-3">

  <ShieldAlert
    className="
      h-8
      w-8
      text-amber-400
    "
  />

  <h2 className="text-4xl font-black">
    Wrong Question Replay
  </h2>

</div>

          <div className="space-y-6 mt-6">

            {wrongQuestions.map((question) => {

              const enrich =
                question.question_enrichment || {};

              return (

                <Card
                  key={question.id}
                  className="bg-slate-900/60 border-cyan-500/20"
                >

                  <CardContent className="p-6">

                    <div className="text-cyan-300 font-black">
                      Question {enrich.questionNumber}
                    </div>

                    <div className="mt-4 text-white text-xl font-bold">
                      {enrich.trapType}
                    </div>

                    <p className="mt-4 text-slate-300">
                      {enrich.whyStudentsFail}
                    </p>

                    <div className="mt-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">

                      <div className="text-emerald-300 font-bold">
                        Topper Shortcut
                      </div>

                      <p className="mt-2 text-slate-300">
                        {enrich.topperShortcut}
                      </p>

                    </div>

                  </CardContent>

                </Card>

              );

            })}

          </div>

        </div>

      </div>

    </div>

  );
}