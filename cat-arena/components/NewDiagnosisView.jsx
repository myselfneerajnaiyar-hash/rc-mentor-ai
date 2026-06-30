"use client";
import { useEffect, useState } from "react";

export default function NewDiagnosisView({
    

  attempt = {},
  enrichedPassages = [],
  enrichedQuestions = [],
}) {
  const accuracy =
    attempt?.attempted > 0
      ? Math.round(
          (attempt.correct / attempt.attempted) * 100
        )
      : 0;

      const [passages, setPassages] =
  useState([]);

const [questions, setQuestions] =
  useState([]);
  useEffect(() => {

  async function loadData() {

    const res =
      await fetch("/api/test-diagnosis");

    const data =
      await res.json();

    console.log(data);

    setPassages(
      data.passages?.map(
        p => p.passage_enrichment
      ) || []
    );

    setQuestions([
      ...(data.rcQuestions?.map(
        q => q.diagnosis
      ) || []),

      ...(data.vaQuestions?.map(
        q => q.diagnosis
      ) || []),
    ]);
  }

  loadData();

}, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Auctor Mentor Report
          </h1>

          <p className="text-slate-400 mt-2">
            Understand what happened,
            why it happened,
            and how toppers think.
          </p>
        </div>

        {/* PERFORMANCE OVERVIEW */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-5">
            Performance Overview
          </h2>

          <div className="grid md:grid-cols-4 gap-4">

            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-slate-400 text-sm">
                Score
              </div>
              <div className="text-3xl font-bold">
                {attempt.correct || 0}/{attempt.total || 0}
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-slate-400 text-sm">
                Attempted
              </div>
              <div className="text-3xl font-bold">
                {attempt.attempted || 0}
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-slate-400 text-sm">
                Accuracy
              </div>
              <div className="text-3xl font-bold">
                {accuracy}%
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-slate-400 text-sm">
                Questions
              </div>
              <div className="text-3xl font-bold">
                {attempt.total || 0}
              </div>
            </div>

          </div>
        </div>

        {/* PASSAGE INTELLIGENCE */}
        <div className="space-y-6">

          <h2 className="text-3xl font-bold">
            Passage Intelligence
          </h2>

          {passages.map((passage, index) => (

            <div
              key={index}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                  {index + 1}
                </div>

                <div>
                  <h3 className="text-2xl font-semibold">
                    Passage {index + 1}
                  </h3>
                </div>
              </div>

              {/* QUICK SNAPSHOT */}

              <div className="grid md:grid-cols-2 gap-4 mb-6">

                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="text-slate-400 text-sm mb-1">
                    Main Idea
                  </div>

                  <div>
                    {passage.mainIdeaInOneLine}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="text-slate-400 text-sm mb-1">
                    Core Theme
                  </div>

                  <div>
                    {passage.coreTheme}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="text-slate-400 text-sm mb-1">
                    Author Tone
                  </div>

                  <div>
                    {passage.authorTone}
                  </div>
                </div>

                <div className="bg-red-950 border border-red-800 rounded-xl p-4">
                  <div className="text-red-300 text-sm mb-1">
                    Exam Hall Warning
                  </div>

                  <div>
                    {passage.examHallWarning}
                  </div>
                </div>

              </div>

              {/* AUTHOR STRATEGY */}

              <div className="mb-6">

                <h4 className="text-xl font-semibold mb-3">
                  Author Strategy
                </h4>

                <div className="bg-slate-800 rounded-xl p-4">
                  {passage.authorStrategy}
                </div>

              </div>

              {/* PASSAGE FLOW */}

              {passage.passageFlowMap?.length > 0 && (
                <div className="mb-6">

                  <h4 className="text-xl font-semibold mb-4">
                    Argument Flow
                  </h4>

                  <div className="space-y-3">

                    {passage.passageFlowMap.map(
                      (step) => (
                        <div
                          key={step.step}
                          className="bg-slate-800 rounded-xl p-4"
                        >
                          <div className="font-semibold mb-1">
                            Step {step.step}: {step.title}
                          </div>

                          <div className="text-slate-300 text-sm">
                            {step.description}
                          </div>
                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* WHERE STUDENTS FAIL */}

              {passage.readingPsychology && (
                <div className="grid md:grid-cols-2 gap-4">

                  <div className="bg-slate-800 rounded-xl p-4">
                    <h4 className="font-semibold mb-3 text-red-400">
                      Where Weak Students Fail
                    </h4>

                    <ul className="space-y-2 text-sm">

                      {passage.readingPsychology
                        ?.whereWeakStudentsFail
                        ?.map((item, i) => (
                          <li key={i}>
                            • {item}
                          </li>
                        ))}

                    </ul>
                  </div>

                  <div className="bg-slate-800 rounded-xl p-4">
                    <h4 className="font-semibold mb-3 text-yellow-400">
                      False Inference Zones
                    </h4>

                    <ul className="space-y-2 text-sm">

                      {passage.readingPsychology
                        ?.falseInferenceZones
                        ?.map((item, i) => (
                          <li key={i}>
                            • {item}
                          </li>
                        ))}

                    </ul>
                  </div>

                </div>
              )}

              {/* REVISION */}

              <div className="mt-6 bg-blue-950 border border-blue-800 rounded-xl p-5">

                <div className="font-semibold mb-2">
                  5 Second Revision
                </div>

                <div>
                  {passage.fiveSecondRevision}
                </div>

              </div>

            </div>
          ))}
        </div>

        {/* QUESTION INTELLIGENCE */}

        {questions.length > 0 && (
          <div className="mt-10">

            <h2 className="text-3xl font-bold mb-6">
              Question Intelligence
            </h2>

            <div className="space-y-6">

              {questions.map((q, index) => (

                <div
                  key={index}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
                >
                  <h3 className="text-xl font-semibold mb-4">
                    Question {q.questionNumber}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">

                    <div className="bg-slate-800 rounded-xl p-4">
                      <div className="text-red-400 font-semibold mb-2">
                        Trap Type
                      </div>

                      <div>{q.trapType}</div>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4">
                      <div className="text-yellow-400 font-semibold mb-2">
                        Skill Tested
                      </div>

                      <div>
                        {q.primarySkill ||
                          q.skillTested}
                      </div>
                    </div>

                  </div>

                  <div className="mt-4 bg-slate-800 rounded-xl p-4">
                    <div className="font-semibold mb-2">
                      Why Students Fail
                    </div>

                    <div>
                      {q.whyStudentsFail}
                    </div>
                  </div>

                  <div className="mt-4 bg-green-950 border border-green-800 rounded-xl p-4">
                    <div className="font-semibold mb-2">
                      Topper Shortcut
                    </div>

                    <div>
                      {q.topperShortcut}
                    </div>
                  </div>

                  <div className="mt-4 bg-blue-950 border border-blue-800 rounded-xl p-4">
                    <div className="font-semibold mb-2">
                      Ideal Thinking Process
                    </div>

                    <div>
                      {q.idealThinkingProcess}
                    </div>
                  </div>

                </div>

              ))}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}