"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import CATArenaHeader from "../components/cat/CATArenaHeader";

export default function CATDailyChallengeView({
  testData,
}) {
  const currentPassage =
    testData?.passages?.[0];

  const questions =
    currentPassage?.questions || [];

  const totalQuestions =
    questions.length;

  const [currentQ, setCurrentQ] =
    useState(0);

  const [answers, setAnswers] =
    useState({});

  const currentQuestion =
    questions[currentQ];

  const progress = useMemo(() => {
    return (
      (Object.keys(answers).length /
        totalQuestions) *
      100
    );
  }, [answers, totalQuestions]);

  function selectAnswer(index) {
    setAnswers((prev) => ({
      ...prev,
      [currentQ]: index,
    }));
  }

  function nextQuestion() {
    if (currentQ < totalQuestions - 1) {
      setCurrentQ((prev) => prev + 1);
    }
  }

  function prevQuestion() {
    if (currentQ > 0) {
      setCurrentQ((prev) => prev - 1);
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-[#07111F]">

      {/* HEADER */}
      <CATArenaHeader
        title="Daily RC Challenge"
        timeLeft="30:00"
        onExit={() => {
          if (
            confirm("Exit challenge?")
          ) {
            window.location.reload();
          }
        }}
      />

      {/* MAIN */}
      <div
        className="grid h-[calc(100vh-64px)]"
        style={{
          gridTemplateColumns:
            "55% 45%",
        }}
      >

        {/* ========================= */}
        {/* LEFT PANEL */}
        {/* ========================= */}

        <div className="relative overflow-hidden border-r border-white/5 bg-[#08101E]">

          {/* ATMOSPHERIC GLOW */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-120px] top-[-120px] h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="absolute bottom-[-120px] right-[-120px] h-[280px] w-[280px] rounded-full bg-indigo-500/10 blur-3xl" />
          </div>

          <div className="relative h-full overflow-y-auto">

            <div className="mx-auto max-w-4xl px-12 pb-32 pt-14">

              {/* TOP META */}
              <div className="mb-10 flex items-center gap-4">

                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300">
                  {
                    currentPassage?.genre
                  }
                </div>

                <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-400/20 to-transparent" />

              </div>

              {/* TITLE */}
              <div className="max-w-3xl">

                <h1 className="text-5xl font-bold leading-tight tracking-[-0.04em] text-white">
                  Reading
                  <span className="text-slate-400">
                    {" "}
                    Comprehension
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-[15px] leading-8 text-slate-400">
                  Read carefully. Focus on
                  author intent, logical
                  flow, tone shifts and
                  inferential structure.
                </p>

              </div>

              {/* PASSAGE */}
              <div className="mt-16 max-w-3xl">

                <div className="space-y-9 text-[19px] font-[420] leading-[2.15] tracking-[0.01em] text-slate-300">

                  {currentPassage?.text
                    ?.split("\n")
                    ?.filter(Boolean)
                    ?.map(
                      (paragraph, index) => (
                        <p key={index}>
                          {paragraph}
                        </p>
                      )
                    )}

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ========================= */}
        {/* RIGHT PANEL */}
        {/* ========================= */}

        <div className="overflow-hidden bg-[#F3F7FB]">

          <div className="h-full overflow-y-auto">

            <div className="mx-auto flex min-h-full max-w-4xl flex-col px-10 py-10">

              {/* TOP BAR */}
              <div className="sticky top-0 z-20 mb-8 rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">

                <div className="flex items-start justify-between gap-6">

                  {/* QUESTION COUNT */}
                  <div>

                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Question
                    </div>

                    <div className="mt-3 flex items-end gap-3">

                      <div className="text-5xl font-bold tracking-[-0.06em] text-slate-900">
                        {currentQ + 1}
                      </div>

                      <div className="pb-2 text-xl font-medium text-slate-400">
                        / {totalQuestions}
                      </div>

                    </div>

                  </div>

                  {/* QUESTION NAV */}
                  <div className="flex flex-wrap justify-end gap-3">

                    {Array.from({
                      length:
                        totalQuestions,
                    }).map((_, i) => {
                      const answered =
                        answers[i] !=
                        null;

                      const active =
                        currentQ === i;

                      return (
                        <button
                          key={i}
                          onClick={() =>
                            setCurrentQ(i)
                          }
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-sm font-bold transition-all duration-200

                          ${
                            active
                              ? "border-cyan-500 bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                              : answered
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
                          }
                          `}
                        >
                          {i + 1}
                        </button>
                      );
                    })}

                  </div>

                </div>

                {/* PROGRESS */}
                <div className="mt-6">

                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">

                    <span>
                      Progress
                    </span>

                    <span>
                      {
                        Object.keys(
                          answers
                        ).length
                      }
                      /
                      {
                        totalQuestions
                      }{" "}
                      answered
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">

                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                      }}
                    />

                  </div>

                </div>

              </div>

              {/* QUESTION CARD */}
              <div className="rounded-[32px] border border-slate-200/80 bg-white p-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">

                {/* STEM */}
                <div className="mb-12">

                  <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">
                    Question Stem
                  </div>

                  <h2 className="text-[30px] font-bold leading-[1.6] tracking-[-0.03em] text-slate-900">
                    {
                      currentQuestion?.stem
                    }
                  </h2>

                </div>

                {/* OPTIONS */}
                <div className="space-y-5">

                  {currentQuestion?.options?.map(
                    (
                      option,
                      index
                    ) => {
                      const selected =
                        answers[
                          currentQ
                        ] === index;

                      return (
                        <button
                          key={index}
                          onClick={() =>
                            selectAnswer(
                              index
                            )
                          }
                          className={`group w-full rounded-3xl border p-6 text-left transition-all duration-200

                          ${
                            selected
                              ? "border-cyan-500 bg-cyan-500 text-white shadow-xl shadow-cyan-500/20"
                              : "border-slate-200 bg-slate-50/80 text-slate-800 hover:border-cyan-300 hover:bg-cyan-50"
                          }
                          `}
                        >

                          <div className="flex items-start gap-5">

                            {/* OPTION BADGE */}
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold transition-all

                              ${
                                selected
                                  ? "bg-white text-cyan-600"
                                  : "bg-slate-200 text-slate-700 group-hover:bg-cyan-100"
                              }
                              `}
                            >
                              {String.fromCharCode(
                                65 +
                                  index
                              )}
                            </div>

                            {/* TEXT */}
                            <div className="pt-[2px] text-[17px] font-medium leading-8">
                              {option}
                            </div>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

                {/* ACTIONS */}
                <div className="mt-14 flex items-center justify-between">

                  <button
                    onClick={
                      prevQuestion
                    }
                    disabled={
                      currentQ === 0
                    }
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 font-semibold text-slate-700 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <button
                    onClick={
                      nextQuestion
                    }
                    disabled={
                      currentQ ===
                      totalQuestions -
                        1
                    }
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-8 py-4 font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Save & Next
                    <ChevronRight className="h-4 w-4" />
                  </button>

                </div>

              </div>

              {/* FOOTER LEGEND */}
              <div className="mt-8 flex flex-wrap items-center gap-6 px-2 text-sm text-slate-500">

                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-cyan-500" />
                  Current
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  Answered
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-300" />
                  Unanswered
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}