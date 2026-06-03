"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function RCSessionPage() {

  const params = useParams();

  const [attempt, setAttempt] =
    useState(null);

  const [questionAttempts,
    setQuestionAttempts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function loadSession() {

      const { data: attemptData, error } =
        await supabase
          .from("daily_rc_attempts")
          .select(`
            *,
            daily_rc_sets(*)
          `)
          .eq(
            "id",
            params.attemptId
          )
          .single();

      if (error) {

        console.error(error);

        setLoading(false);

        return;
      }

      setAttempt(attemptData);

    const { data: questionData } =
  await supabase
    .from("daily_rc_question_attempts")
    .select(`
      *,
      daily_rc_questions (
        id,
        question_text,
        options,
        correct_answer,
        question_enrichment
      )
    `)
    .eq(
      "attempt_id",
      params.attemptId
    );
      setQuestionAttempts(
        questionData || []
      );

      setLoading(false);
    }

    if (params?.attemptId) {

      loadSession();

    }

  }, [params]);

  if (loading) {

    return (

      <div className="min-h-screen bg-[#071120] text-white flex items-center justify-center">

        Loading Session...

      </div>

    );
  }

  return (

<div className="min-h-screen bg-[#071120] text-white">

  <div className="max-w-7xl mx-auto px-8 py-10">

    <h1 className="text-6xl font-black">
      RC Diagnosis Report
    </h1>

    <div className="mt-10 rounded-3xl border border-cyan-500/20 bg-slate-900 p-8">

      <div className="text-slate-400">
        CAT Score
      </div>

      <div className="text-8xl font-black text-emerald-400 mt-3">
        {attempt.score}
      </div>

    </div>

    <div className="grid md:grid-cols-4 gap-5 mt-8">

      <div className="bg-slate-900 p-6 rounded-2xl">

        <div className="text-slate-400">
          Accuracy
        </div>

        <div className="text-4xl font-black">
          {attempt.accuracy}%
        </div>

      </div>

      <div className="bg-slate-900 p-6 rounded-2xl">

        <div className="text-slate-400">
          Correct
        </div>

        <div className="text-4xl font-black text-emerald-300">
          {attempt.correct_count}
        </div>

      </div>

      <div className="bg-slate-900 p-6 rounded-2xl">

        <div className="text-slate-400">
          Incorrect
        </div>

        <div className="text-4xl font-black text-red-300">
          {attempt.incorrect_count}
        </div>

      </div>

      <div className="bg-slate-900 p-6 rounded-2xl">

        <div className="text-slate-400">
          Composite
        </div>

        <div className="text-4xl font-black text-cyan-300">
          {attempt.composite_score}
        </div>

      </div>

    </div>

    <div className="mt-10 rounded-3xl bg-slate-900 p-8">

      <h2 className="text-3xl font-black mb-6">
        Passage
      </h2>

      <div className="leading-8 text-slate-200 whitespace-pre-wrap">
        {attempt.daily_rc_sets?.passage}
      </div>

    </div>

    <div className="mt-10 rounded-3xl bg-slate-900 p-8">

  <h2 className="text-3xl font-black mb-6">
    Passage DNA
  </h2>

  <div className="space-y-6">

    <div>
      <div className="text-cyan-400 font-bold">
        Core Theme
      </div>
      <div>
        {
          attempt.daily_rc_sets
            ?.passage_enrichment
            ?.coreTheme
        }
      </div>
    </div>

    <div>
      <div className="text-cyan-400 font-bold">
        Author Intent
      </div>
      <div>
        {
          attempt.daily_rc_sets
            ?.passage_enrichment
            ?.authorIntent
        }
      </div>
    </div>

    <div>
      <div className="text-cyan-400 font-bold">
        Central Debate
      </div>
      <div>
        {
          attempt.daily_rc_sets
            ?.passage_enrichment
            ?.centralDebate
        }
      </div>
    </div>

  </div>

</div>

<div className="mt-10 rounded-3xl bg-slate-900 p-8">

  <h2 className="text-3xl font-black mb-6">
    Passage Flow
  </h2>

  <div className="space-y-6">

    {passageEnrichment?.passageFlow?.map(
      (step, index) => (

      <div
        key={index}
        className="border border-slate-700 rounded-2xl p-6"
      >

        <div className="text-cyan-300 font-bold">
          Paragraph {step.paragraph}
        </div>

        <div className="mt-3">
          <span className="font-bold">
            Actual Meaning:
          </span>
          <div>
            {step.actualMeaning}
          </div>
        </div>

        <div className="mt-3">
          <span className="font-bold">
            Simple Explanation:
          </span>
          <div>
            {step.simpleExplanation}
          </div>
        </div>

        <div className="mt-3">
          <span className="font-bold">
            Why This Paragraph Exists:
          </span>
          <div>
            {step.whyThisParagraphExists}
          </div>
        </div>

      </div>

    ))}
  </div>

</div>

   <div className="mt-10">

  <h2 className="text-4xl font-black mb-8">
    Detailed Question Review
  </h2>

  <div className="space-y-8">

    {questionAttempts.map((q, index) => {

      const question =
        q.daily_rc_questions;

      const enrich =
        question?.question_enrichment;

      return (

        <div
          key={q.id}
          className="bg-slate-900 rounded-3xl p-8 border border-slate-700"
        >

          <div className="text-3xl font-black mb-4">
            Question {index + 1}
          </div>

          <div className="text-xl leading-8 mb-8">
            {question?.question_text}
          </div>

          <div className="space-y-3">

            {question?.options?.map(
              (option) => {

                const letter =
                  String.fromCharCode(
                    64 + option.id
                  );

                const isCorrect =
                  letter ===
                  question.correct_answer;

                const isChosen =
                  letter ===
                  q.selected_option;

                return (

                  <div
                    key={option.id}
                    className={`
                      p-4 rounded-xl border
                      ${
                        isCorrect
                          ? "border-emerald-500 bg-emerald-500/10"
                          : isChosen
                          ? "border-red-500 bg-red-500/10"
                          : "border-slate-700"
                      }
                    `}
                  >

                    <span className="font-bold mr-2">
                      {letter}.
                    </span>

                    {option.text}

                  </div>

                );
              }
            )}

          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-8">

            <div>

              <div className="text-slate-400">
                Your Answer
              </div>

              <div className="text-2xl font-bold text-cyan-300">
                {q.selected_option ||
                  "Not Answered"}
              </div>

            </div>

            <div>

              <div className="text-slate-400">
                Correct Answer
              </div>

              <div className="text-2xl font-bold text-emerald-300">
               {"ABCD"[Number(question.correct_answer) - 1]}
              </div>

            </div>

          </div>

          <div className="mt-8 border-t border-slate-700 pt-8">

            <div className="text-sm uppercase tracking-wider text-cyan-400">
              Trap Type
            </div>

            <div className="text-2xl font-bold mt-1">
              {enrich?.trapType}
            </div>

            <div className="mt-6">

              <div className="font-bold text-lg">
                Why Students Fail
              </div>

              <p className="text-slate-300 mt-2">
                {enrich?.whyStudentsFail}
              </p>

            </div>

            <div className="mt-6">

              <div className="font-bold text-lg">
                Topper Shortcut
              </div>

              <p className="text-slate-300 mt-2">
                {enrich?.topperShortcut}
              </p>

            </div>

            <div className="mt-6">

              <div className="font-bold text-lg">
                Evidence Line
              </div>

              <p className="text-yellow-300 mt-2 italic">
                {enrich?.evidenceLine}
              </p>

            </div>

            <div className="mt-6">

              <div className="font-bold text-lg">
                Ideal Thinking Process
              </div>

              <p className="text-slate-300 mt-2">
                {enrich?.idealThinkingProcess}
              </p>

            </div>

            <div className="mt-6">

              <div className="font-bold text-lg">
                Cognitive Error Tested
              </div>

              <p className="text-red-300 mt-2">
                {enrich?.cognitiveErrorTested}
              </p>

            </div>

            <div className="mt-8">

  <div className="font-bold text-xl text-cyan-300">
    Option-by-Option Elimination
  </div>

  <div className="mt-4 space-y-4">

    <div>
      <div className="font-bold text-red-300">
        Option A
      </div>

      <div className="text-slate-300">
        {enrich?.eliminationLogic?.optionA}
      </div>
    </div>

    <div>
      <div className="font-bold text-red-300">
        Option B
      </div>

      <div className="text-slate-300">
        {enrich?.eliminationLogic?.optionB}
      </div>
    </div>

    <div>
      <div className="font-bold text-red-300">
        Option C
      </div>

      <div className="text-slate-300">
        {enrich?.eliminationLogic?.optionC}
      </div>
    </div>

    <div>
      <div className="font-bold text-red-300">
        Option D
      </div>

      <div className="text-slate-300">
        {enrich?.eliminationLogic?.optionD}
      </div>
    </div>

  </div>

</div>
<div className="mt-8">

  <div className="font-bold text-xl">
    Skill Explanation
  </div>

  <p className="text-slate-300 mt-2">
    {enrich?.skillExplanation}
  </p>

</div>

<div className="mt-8">

  <div className="font-bold text-xl">
    Why This Trap Works
  </div>

  <p className="text-slate-300 mt-2">
    {enrich?.whyThisTrapWorks}
  </p>

</div>

<div className="mt-8">

  <div className="font-bold text-xl">
    Time Pressure Danger
  </div>

  <p className="text-slate-300 mt-2">
    {enrich?.timePressureDanger}
  </p>

</div>

<div className="mt-8">

  <div className="font-bold text-xl">
    Author's Trap Mechanism
  </div>

  <p className="text-slate-300 mt-2">
    {enrich?.authorTrapMechanism}
  </p>

</div>

<div className="mt-8">

  <div className="font-bold text-xl">
    Instant Elimination Signal
  </div>

  <p className="text-yellow-300 mt-2">
    {enrich?.instantEliminationSignal}
  </p>

</div>

<div className="mt-8">

  <div className="font-bold text-xl text-emerald-300">
    Why The Correct Option Wins
  </div>

  <p className="text-slate-300 mt-2">
    {enrich?.whatCorrectOptionDoesBetter}
  </p>

</div>

          </div>

        </div>
      );
    })}

  </div>

</div>

  </div>

</div>

)
}