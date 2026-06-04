"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function DetailedReviewPage() {

    const [rcSet, setRcSet] = useState(null);
    const [questions, setQuestions] =
  useState([]);

const [attempts, setAttempts] =
  useState([]);
    const [openParagraph, setOpenParagraph] =
  useState(null);
  

useEffect(() => {
  async function loadData() {

   const today =
  new Date()
    .toISOString()
    .split("T")[0];

const { data } =
  await supabase
    .from("daily_rc_sets")
    .select("*")
    .eq(
      "challenge_date",
      today
    )
    .single();

    setRcSet(data);

    const { data: questionData } =
  await supabase
    .from("daily_rc_questions")
    .select("*")
    .eq("daily_rc_set_id", data.id)
    .order("order_no");

setQuestions(questionData || []);

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
    .eq(
      "daily_rc_set_id",
      data.id
    )
    .order("completed_at", {
      ascending: false,
    })
    .limit(1)
    .single();

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

  setAttempts(attemptRows || []);
}
  }

  loadData();
}, []);

if (!rcSet) {
  return (
    <div className="min-h-screen bg-[#071120] text-white flex items-center justify-center">
      Loading Review...
    </div>
  );
}


const enrichment =
  rcSet.passage_enrichment || {};

  const passageFlow =
  enrichment.passageFlow || [];

  const psychology =
  enrichment?.readingPsychology || {};

  console.log(enrichment.readingPsychology);


  return (
    <div className="min-h-screen bg-[#071120] text-white">
      <div className="max-w-7xl mx-auto px-8 py-10">

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

        <h1 className="text-6xl font-black">
          Detailed Review
        </h1>

        <p className="text-slate-400 mt-4">
          Passage analysis, vocabulary, trap analysis and question review.
        </p>

        <Tabs
  defaultValue="passage"
  className="mt-10"
>

  <TabsList className="bg-slate-900 border border-cyan-500/20 p-1">

    <TabsTrigger
      value="passage"
      className="px-8"
    >
      Passage Blueprint
    </TabsTrigger>

    <TabsTrigger
      value="autopsy"
      className="px-8"
    >
      Question Autopsy
    </TabsTrigger>

  </TabsList>

  <TabsContent value="passage">

        {/* PASSAGE BLUEPRINT */}

        <div className="mt-12">

          <div className="text-cyan-300 text-sm uppercase tracking-[0.25em] font-bold">
            Passage Blueprint
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">

            <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/60 p-6">
              <div className="text-cyan-300 font-bold">
                Central Debate
              </div>

              <p className="mt-4 text-slate-300">
               {enrichment.centralDebate}
              </p>
            </div>

            <div className="rounded-3xl border border-purple-500/20 bg-slate-900/60 p-6">
              <div className="text-purple-300 font-bold">
                Core Theme
              </div>

              <p className="mt-4 text-slate-300">
                {enrichment.coreTheme}
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6">
              <div className="text-emerald-300 font-bold">
                Author Intent
              </div>

              <p className="mt-4 text-slate-300">
               {enrichment.authorIntent}
              </p>
            </div>

           <div className="space-y-3">

  <div>
    <span className="text-orange-300 font-bold">
      Supports:
    </span>

    <p className="text-slate-300 mt-1">
      {enrichment.authorPositioning?.supports}
    </p>
  </div>

  <div>
    <span className="text-red-300 font-bold">
      Criticizes:
    </span>

    <p className="text-slate-300 mt-1">
      {enrichment.authorPositioning?.criticizes}
    </p>
  </div>

  <div>
    <span className="text-cyan-300 font-bold">
      Hidden Assumption:
    </span>

    <p className="text-slate-300 mt-1">
      {enrichment.authorPositioning?.hiddenAssumption}
    </p>
  </div>

</div>

          </div>
      
</div>

{/* ACTUAL PASSAGE */}

<div className="mt-16">

  <div className="text-cyan-300 text-sm uppercase tracking-[0.35em] font-black">
    Actual Passage
  </div>

  <Card
    className="
      mt-6
      bg-slate-900/60
      border-cyan-500/20
    "
  >

    <CardContent className="p-8">

      {(rcSet.passage_json || []).length > 0 ? (

        <div className="space-y-6">

          {rcSet.passage_json.map(
            (paragraph, index) => (

              <p
                key={index}
                className="
                  text-slate-300
                  leading-8
                  text-base md:text-lg
                "
              >
                {paragraph}
              </p>

            )
          )}

        </div>

      ) : (

        <p
          className="
            text-slate-300
            leading-8
            text-base md:text-lg
            whitespace-pre-wrap
          "
        >
          {rcSet.passage}
        </p>

      )}

    </CardContent>

  </Card>

</div>

<div className="mt-16">

 <div className="text-cyan-300 text-sm uppercase tracking-[0.35em] font-black">
  Author's Argument Journey
</div>

 <div className="mt-8">

  {(enrichment.passageFlowMap || []).map(
    (step, index) => (

      <div
        key={step.step}
        className="flex gap-4"
      >

        {/* TIMELINE */}

        <div className="flex flex-col items-center">

          <div
            className="
              h-10
              w-10
              rounded-full
              bg-cyan-400
              text-black
              font-black
              flex
              items-center
              justify-center
              shadow-lg
              ring-4
              ring-cyan-500/20
              shadow-cyan-500/30
            "
          >
            {step.step}
          </div>

         {index <
  enrichment.passageFlowMap.length - 1 && (

  <>
    <div
      className="
        w-[3px]
        h-12
        bg-cyan-400/50
      "
    />

    <div
      className="
        text-cyan-300
        text-xl
        font-black
        leading-none
      "
    >
      ▼
    </div>

    <div
      className="
        w-[3px]
        h-12
        bg-cyan-400/50
      "
    />
  </>

)}

        </div>

        {/* CONTENT */}

        <div
         className="
  flex-1
  pb-16
"
        >

          <div
            className="
              text-cyan-300
              text-sm
              uppercase
              tracking-widest
              font-black
            "
          >
            Argument Step
          </div>

          <h3
            className="
              text-2xl
              font-black
              text-white
              mt-2
            "
          >
            {step.title}
          </h3>

          <p
            className="
              text-slate-300
              leading-7
              mt-4
            "
          >
            {step.description}
          </p>

        </div>

      </div>

    )
  )}

</div>

</div>

      {/* PARAGRAPH FLOW */}

{/* PARAGRAPH FLOW */}

<div className="mt-16 max-w-7xl mx-auto px-8">

  <div className="text-purple-300 text-sm uppercase tracking-[0.25em] font-bold">
    Paragraph Flow
  </div>

  <div className="mt-6 space-y-4">

    {passageFlow.map((para, index) => (

      <Card
        key={index}
        className="bg-slate-900/60 border-cyan-500/20 overflow-hidden"
      >

        <button
          onClick={() =>
            setOpenParagraph(
              openParagraph === index
                ? null
                : index
            )
          }
          className="w-full flex items-center justify-between p-6 text-left"
        >

          <div>

          <div className="text-cyan-300 font-black text-lg">
  Paragraph {para.paragraph}
</div>

<div className="text-slate-400 mt-1">
  {para.transitionType}
</div>

<div className="text-xs text-cyan-400 mt-2">
  Click to expand
</div>

          </div>

          <ChevronDown
            className={`transition-transform duration-300 ${
              openParagraph === index
                ? "rotate-180"
                : ""
            }`}
          />

        </button>

        {openParagraph === index && (

          <CardContent className="pt-0 pb-6 px-6">

            <div className="mt-4">

              <div className="text-cyan-300 font-bold">
                Actual Meaning
              </div>

              <p className="mt-2 text-slate-300 leading-7">
                {para.actualMeaning}
              </p>

            </div>

            <div className="mt-6">

              <div className="text-emerald-300 font-bold">
                Simple Explanation
              </div>

              <p className="mt-2 text-slate-300 leading-7">
                {para.simpleExplanation}
              </p>

            </div>

            <div className="mt-6">

              <div className="text-purple-300 font-bold">
                Why This Paragraph Exists
              </div>

              <p className="mt-2 text-slate-300 leading-7">
                {para.whyThisParagraphExists}
              </p>

            </div>

            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">

              <div className="text-red-300 font-bold">
                ⚠️ CAT Reading Danger
              </div>

              <p className="mt-2 text-slate-300">
                {para.catReadingDanger}
              </p>

            </div>

           

          </CardContent>

        )}

      </Card>

    ))}

  </div>

</div>

{/* VOCABULARY INTELLIGENCE */}

<div className="mt-20 max-w-7xl mx-auto px-8">

  <div className="text-cyan-300 text-sm uppercase tracking-[0.25em] font-black">
    Vocabulary Intelligence
  </div>

  <div className="grid md:grid-cols-2 gap-6 mt-6">

    {(enrichment.vocabulary || []).map((word, index) => (

      <Card
        key={index}
        className="
          bg-slate-900/60
          border-cyan-500/20
        "
      >

        <CardContent className="p-6">

          <h3 className="text-2xl font-black text-cyan-300">
            {word.word}
          </h3>

          <div className="mt-6">

            <div className="text-purple-300 font-bold">
              Dictionary Meaning
            </div>

            <p className="mt-2 text-slate-300">
              {word.meaning}
            </p>

          </div>

          <div className="mt-6">

            <div className="text-emerald-300 font-bold">
              Simple Meaning
            </div>

            <p className="mt-2 text-slate-300">
              {word.simpleMeaning}
            </p>

          </div>

          <div
            className="
              mt-6
              rounded-2xl
              border
              border-amber-500/20
              bg-amber-500/10
              p-4
            "
          >

            <div className="text-amber-300 font-bold">
              Why The Author Used It
            </div>

            <p className="mt-2 text-slate-300">
              {word.whyAuthorUsedIt}
            </p>

          </div>

        </CardContent>

      </Card>

    ))}

  </div>

</div>
{/* READING PSYCHOLOGY */}

<div className="mt-20">

  <div className="text-pink-300 text-sm uppercase tracking-[0.25em] font-black">
    Reading Psychology
  </div>

  <div className="grid md:grid-cols-2 gap-6 mt-6">

    <Card className="bg-slate-900/50 border-pink-500/20">
      <CardContent className="p-6">
        <h3 className="text-red-300 font-black mb-4">
          Author Trap Moments
        </h3>

        <ul className="space-y-3">
          {(psychology.authorTrapMoments || []).map(
            (item, i) => (
              <li key={i} className="text-slate-300">
                • {item}
              </li>
            )
          )}
        </ul>
      </CardContent>
    </Card>

    <Card className="bg-slate-900/50 border-cyan-500/20">
      <CardContent className="p-6">
        <h3 className="text-cyan-300 font-black mb-4">
          Scope Shift Moments
        </h3>

        <ul className="space-y-3">
          {(psychology.scopeShiftMoments || []).map(
            (item, i) => (
              <li key={i} className="text-slate-300">
                • {item}
              </li>
            )
          )}
        </ul>
      </CardContent>
    </Card>

    <Card className="bg-slate-900/50 border-amber-500/20">
      <CardContent className="p-6">
        <h3 className="text-amber-300 font-black mb-4">
          False Inference Zones
        </h3>

        <ul className="space-y-3">
          {(psychology.falseInferenceZones || []).map(
            (item, i) => (
              <li key={i} className="text-slate-300">
                • {item}
              </li>
            )
          )}
        </ul>
      </CardContent>
    </Card>

    <Card className="bg-slate-900/50 border-purple-500/20">
      <CardContent className="p-6">
        <h3 className="text-purple-300 font-black mb-4">
          Where Weak Students Fail
        </h3>

        <ul className="space-y-3">
          {(psychology.whereWeakStudentsFail || []).map(
            (item, i) => (
              <li key={i} className="text-slate-300">
                • {item}
              </li>
            )
          )}
        </ul>
      </CardContent>
    </Card>

  </div>

</div>

</TabsContent>

<TabsContent value="autopsy">

  <div className="mt-10">

    <Card className="bg-slate-900/60 border-cyan-500/20">

      <CardContent className="p-8">

        <h2 className="text-3xl font-black text-cyan-300">
          Question Autopsy
        </h2>

       <div className="space-y-8">

  {questions.map((question) => {

    const autopsy =
      question.question_enrichment || {};

    const attempt =
      attempts.find(
        a =>
          a.question_id ===
          question.id
      );

    return (

      <Card
        key={question.id}
        className="
          bg-slate-900/60
          border-cyan-500/20
        "
      >

        <CardContent className="p-4 md:p-8">

          {/* HEADER */}

       <div className="flex flex-col md:flex-row md:justify-between gap-4">

            <div>

            <h2 className="text-2xl md:text-3xl font-black text-cyan-300">

                Question
                {" "}
                {autopsy.questionNumber}

              </h2>

              <div className="mt-3 text-slate-400">

                Difficulty:
                {" "}
                {autopsy.difficulty}

              </div>

              <div className="mt-3 flex gap-2">

  <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
    {autopsy.trapType}
  </span>

</div>

<div className="mt-3 flex flex-wrap gap-2">

  <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm">
    {autopsy.primarySkill}
  </span>

  <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm">
    {autopsy.secondarySkill}
  </span>

</div>

            </div>

            <div>

             {!attempt?.selected_option ? (

  <div className="text-slate-400 font-black">
    • Unattempted
  </div>

) : attempt?.is_correct ? (

  <div className="text-emerald-400 font-black">
    ✓ Correct
  </div>

) : (

  <div className="text-red-400 font-black">
    ✗ Incorrect
  </div>

)}

            </div>

          </div>

          {/* QUESTION */}

          <div className="mt-8">

            <div className="text-cyan-300 font-bold">

              Actual Question

            </div>

            <p className="mt-3 text-white">

              {question.question_text}

            </p>

            <div className="mt-6 space-y-3">

  {(question.options || []).map((option, index) => {

    const letter =
      ["A", "B", "C", "D"][index];

    const correctLetter =
  ["A", "B", "C", "D"][
    Number(question.correct_answer) - 1
  ];

const isCorrect =
  letter === correctLetter;

    const isSelected =
      letter === attempt?.selected_option;

    return (

      <div
        key={index}
        className={`
          p-4 rounded-xl border text-white

          ${isCorrect
            ? "border-emerald-500 bg-emerald-500/20"
            : isSelected
            ? "border-red-500 bg-red-500/20"
            : "border-slate-700 bg-slate-900/50"}
        `}
      >

        <div className="font-black text-cyan-300">
          {letter}
        </div>

        <div className="mt-2 text-white">
          {option.text}
        </div>

      </div>

    );

  })}

</div>
</div>

          {/* USER ANSWER */}

          <div className="grid md:grid-cols-2 gap-4 mt-8">

            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">

              <div className="text-red-300 font-bold">

                Your Answer

              </div>

              <div className="text-2xl mt-2 text-white font-black">

                {attempt?.selected_option ||
                  "Not Attempted"}

              </div>

            </div>

            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">

              <div className="text-emerald-300 font-bold">

                Correct Answer

              </div>

             <div className="text-2xl mt-2 text-emerald-300 font-black">
  {
    ["A", "B", "C", "D"][
      Number(question.correct_answer) - 1
    ]
  }
</div>

            </div>

          </div>

          {/* CAT TESTING */}

          <div className="mt-8 rounded-2xl border border-cyan-500/20 p-6">

            <h3 className="text-cyan-300 font-black">

              What CAT Was Testing

            </h3>

            <p className="mt-4 text-slate-300">

              {autopsy.stemAnalysis}

            </p>

          </div>

          {/* WHY FAIL */}

          <div className="mt-6 rounded-2xl border border-red-500/20 p-6">

            <h3 className="text-red-300 font-black">

              Why Students Fail

            </h3>

            <p className="mt-4 text-slate-300">

              {autopsy.whyStudentsFail}

            </p>

            <p className="mt-4 text-slate-400">

              {autopsy.panicMistake}

            </p>

          </div>

          {/* TRAP */}

          <div className="mt-6 rounded-2xl border border-amber-500/20 p-6">

            <h3 className="text-amber-300 font-black">

              Trap Breakdown

            </h3>

            <p className="mt-4 text-slate-300">

              {autopsy.authorTrapMechanism}

            </p>

          </div>

          {/* EVIDENCE */}

          <div className="mt-6 rounded-2xl border border-purple-500/20 p-6">

            <h3 className="text-purple-300 font-black">

              Evidence Line

            </h3>

            <p className="mt-4 text-slate-300">

              {autopsy.evidenceLine}

            </p>

          </div>

          {/* TOPPER */}

          <div className="mt-6 rounded-2xl border border-emerald-500/20 p-6">

            <h3 className="text-emerald-300 font-black">

              Topper Thinking

            </h3>

            <p className="mt-4 text-slate-300">

              {autopsy.idealThinkingProcess}

            </p>

          </div>

          {/* CORRECT OPTION */}

          <div className="mt-6 rounded-2xl border border-cyan-500/20 p-6">

            <h3 className="text-cyan-300 font-black">

              Why Correct Option Wins

            </h3>

            <div className="mt-6 rounded-2xl border border-emerald-500/20 p-6">

  <h3
  className="
    text-emerald-300
    font-black
    text-lg
    leading-tight
  "
>
    One Sentence To Remember
  </h3>

            <p className="mt-4 text-slate-300">

              {
                autopsy.whatCorrectOptionDoesBetter
              }

            </p>
            </div>

          </div>

        <div className="mt-6">

  <h3 className="text-2xl font-black text-amber-300">
    Option Autopsy
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

    {["A", "B", "C", "D"].map((letter) => {

      const correctLetter =
  ["A", "B", "C", "D"][
    Number(question.correct_answer) - 1
  ];

const isCorrect =
  letter === correctLetter;
      const explanation =
        autopsy.eliminationLogic?.[
          `option${letter}`
        ];

      return (
        <Card
          key={letter}
          className={`
            bg-slate-900/60 border
            ${
              isCorrect
                ? "border-emerald-500"
                : "border-slate-700"
            }
          `}
        >
          <CardContent className="p-5">

            <div
              className={`
                font-black
                ${
                  isCorrect
                    ? "text-emerald-300"
                    : "text-cyan-300"
                }
              `}
            >
              Option {letter}
              {isCorrect ? " ✓" : ""}
            </div>

            <p className="mt-3 text-slate-300">
              {explanation}
            </p>

          </CardContent>
        </Card>
      );

    })}

  </div>

</div>

        </CardContent>

      </Card>

    );

  })}

</div>

      </CardContent>

    </Card>

  </div>

</TabsContent>

</Tabs>
</div>
</div>


  );
}