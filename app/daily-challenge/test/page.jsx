"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import DailyRCResult from "@/components/DailyRCResult";
import { useRouter } from "next/navigation"
import Link from "next/link"
import posthog from "posthog-js";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Clock3,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Flag,
  Brain,
  X
} from "lucide-react";

export default function DailyChallengeTestPage() {

    const router = useRouter();

  const [challenge, setChallenge] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

    const [alreadyAttempted,
  setAlreadyAttempted] =
  useState(false);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] =
    useState({});

  const [timeLeft, setTimeLeft] =
    useState(480);

    const [resultData, setResultData] =
  useState(null);
   

 const [showResults, setShowResults] =
  useState(false);

const [score, setScore] =
  useState(0);



  /* ================= FETCH ================= */

  useEffect(() => {

    async function loadChallenge() {

    const today =
  new Date()
    .toISOString()
    .split("T")[0];

const { data: rcSet, error: setError } =
  await supabase
    .from("daily_rc_sets")
    .select("*")
    .eq(
      "challenge_date",
      today
    )
    .single();

if (setError || !rcSet) {
  setLoading(false);
  return;
}

const {
  data: rcQuestions,
  error: questionError,
} = await supabase
  .from("daily_rc_questions")
  .select("*")
  .eq("daily_rc_set_id", rcSet.id)
  .order("order_no");

if (questionError) {
  setLoading(false);
  return;
}

setChallenge({
  ...rcSet,
  questions: rcQuestions || [],
});

const user =
  await supabase.auth.getUser();

if (user.data.user) {

  const { data: attempt } =
    await supabase
      .from("daily_rc_attempts")
      .select("id")
      .eq(
        "user_id",
        user.data.user.id
      )
      .eq(
        "daily_rc_set_id",
        rcSet.id
      )
      .maybeSingle();

  if (attempt) {

    setAlreadyAttempted(true);

    setLoading(false);

    return;
  }
}

setTimeLeft(
  (rcSet.timer_minutes || 8) * 60
);

      setLoading(false);
    }

    loadChallenge();

  }, []);

  /* ================= TIMER ================= */

 useEffect(() => {

  if (showResults) return;

  if (timeLeft <= 0) return;

  const interval = setInterval(() => {

    setTimeLeft(prev => prev - 1);

  }, 1000);

  return () => clearInterval(interval);

}, [timeLeft, showResults]);

useEffect(() => {

  if (timeLeft === 0 && !showResults) {
    submitTest();
  }

}, [timeLeft]);

  /* ================= FORMAT TIME ================= */

  const formattedTime = useMemo(() => {

    const mins =
      Math.floor(timeLeft / 60);

    const secs =
      timeLeft % 60;

    return `${mins}:${secs
      .toString()
      .padStart(2, "0")}`;

  }, [timeLeft]);

  /* ================= LOADING ================= */

  if (loading) {

   

   
   return (

     <div className="min-h-screen bg-[#071120] text-white">
      

        <div className="text-3xl font-black animate-pulse">
          Loading RC Arena...
        </div>

      </div>

    );
  }

  if (!challenge) {

    return (

      <div className="min-h-screen bg-[#071120] flex items-center justify-center text-red-400 text-2xl font-bold">

        Failed to load challenge

      </div>

    );
  }

  if (alreadyAttempted) {

  return (

    <div className="
      min-h-screen
      bg-[#071120]
      text-white
      flex
      items-center
      justify-center
      px-6
    ">

      <div
        className="
        max-w-2xl
        text-center
        "
      >

        <div className="text-7xl">
          🏆
        </div>

        <h1
          className="
          text-5xl
          font-black
          mt-6
          "
        >
          Attempt Exhausted
        </h1>

        <p
          className="
          mt-6
          text-slate-300
          text-lg
          leading-8
          "
        >
          You have already completed
          today's Daily RC Challenge.

          Review your diagnosis,
          learn from your mistakes
          and come back tomorrow.
        </p>

        <Link
          href="/daily-challenge/result"
        >

          <button
            className="
            mt-10
            px-10
            h-16
            rounded-2xl
            bg-emerald-600
            font-black
            text-xl
            "
          >
            View Today's Report →
          </button>

        </Link>

      </div>

    </div>

  );
}

 

  /* ================= DATA ================= */

  const questions =
    challenge.questions || [];

  const currentQ =
    questions[currentQuestion];

  const answeredCount =
    Object.keys(answers).length;

   

    
  /* ================= SELECT OPTION ================= */

  function selectOption(index) {

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: index,
    }));
  }

  function clearResponse() {

  setAnswers(prev => {

    const updated = { ...prev };

    delete updated[currentQuestion];

    return updated;

  });

}

 async function submitTest() {

  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  questions.forEach((q, i) => {

    const selected = answers[i];

    if (selected === undefined) {

      unanswered++;
      return;

    }

    const correctAnswer =
      Number(q.correct_answer) - 1;

    if (selected === correctAnswer) {

      correct++;

    } else {

      incorrect++;

    }

  });

 const attempted =
  correct + incorrect;

const totalTime =
  (challenge.timer_minutes || 8) * 60;

const timeUsed =
  totalTime - timeLeft;

const accuracy =
  attempted === 0
    ? 0
    : Math.round(
        (correct / attempted) * 100
      );

const catScore =
  (correct * 3) - incorrect;

const compositeScore =
  (catScore * 100) + timeLeft;

  const user = await supabase.auth.getUser();

  const profileRes = await supabase
  .from("profiles")
  .select("championship_points")
  .eq("user_id", user.data.user.id)
  .single();

const currentPoints =
  profileRes.data?.championship_points || 0;

await supabase
  .from("profiles")
  .update({
    championship_points:
      currentPoints + compositeScore
  })
  .eq("user_id", user.data.user.id);

const { data: attemptRow, error: attemptError } =
  await supabase
    .from("daily_rc_attempts")
   .insert({
  user_id: user.data.user.id,
  daily_rc_set_id: challenge.id,

  score: catScore,

  accuracy: accuracy,

  correct_count: correct,

  incorrect_count: incorrect,

  unanswered_count: unanswered,

  composite_score: compositeScore,

  time_taken: timeUsed,

  completed_at: new Date(),
})
    .select()
    .single();

    const today =
  new Date().toISOString().split("T")[0];

const { data: profile } =
  await supabase
    .from("profiles")
    .select(
      "daily_rc_streak,last_rc_attempt_date"
    )
    .eq(
      "user_id",
      user.data.user.id
    )
    .single();

let newStreak = 1;

if (
  profile?.last_rc_attempt_date
) {

  const last =
    new Date(
      profile.last_rc_attempt_date
    );

  const yesterday =
    new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  const lastDate =
    last.toISOString().split("T")[0];

  const yesterdayDate =
    yesterday.toISOString().split("T")[0];

  if (lastDate === today) {

    newStreak =
      profile.daily_rc_streak || 1;

  } else if (
    lastDate === yesterdayDate
  ) {

    newStreak =
      (profile.daily_rc_streak || 0) + 1;

  }
}

await supabase
  .from("profiles")
  .update({
    daily_rc_streak: newStreak,
    last_rc_attempt_date: today,
  })
  .eq(
    "user_id",
    user.data.user.id
  );

if (attemptError) {

  if (
    attemptError.code === "23505"
  ) {

    alert(
      "You have already attempted today's challenge."
    );

    router.push(
      "/daily-challenge/result"
    );

    return;
  }

  console.error(attemptError);
  return;
}

posthog.capture("daily_rc_completed", {
  challenge_id: challenge.id,
  challenge_title: challenge.title,
  score: catScore,
  accuracy: accuracy,
  time_used: timeUsed,
  correct: correct,
  incorrect: incorrect,
});

const questionRows =
  questions.map((q, index) => {

    const selected =
      answers[index];

    const correctAnswer =
      Number(q.correct_answer) - 1;

    return {

      attempt_id: attemptRow.id,

      question_id: q.id,

      selected_option:
        selected !== undefined
          ? String.fromCharCode(65 + selected)
          : null,

      correct_option:
        String.fromCharCode(
          64 + Number(q.correct_answer)
        ),

      is_correct:
        selected === correctAnswer,

      time_spent: 0,

      question_type:
        q.question_type || "unknown",
    };
  });

  const { error: questionError } =
  await supabase
    .from("daily_rc_question_attempts")
    .insert(questionRows);

if (questionError) {
  console.error(questionError);
}
setScore(correct);

localStorage.setItem(
  "dailyRCResult",
  JSON.stringify({
    attemptId: attemptRow.id,
    correct,
    incorrect,
    unanswered,
    attempted,
    accuracy,
    catScore,
    compositeScore,
    timeUsed,
    timeLeft
  })
);

router.push("/daily-challenge/result");
}

  
  /* ================= TIMER COLORS ================= */

  let timerClasses =
    "bg-cyan-500/10 border-cyan-400/20 text-cyan-200";

  if (timeLeft <= 120) {

    timerClasses =
      "bg-amber-500/10 border-amber-400/20 text-amber-200";
  }

  if (timeLeft <= 30) {

    timerClasses =
      "bg-red-500/10 border-red-400/20 text-red-200 animate-pulse";
  }

 return (

 <div className="min-h-screen bg-[#071120] text-white">
     <div
  className="
    fixed
    top-6
    right-6
    z-[999]
    px-5
    py-3
    rounded-2xl
    border
    backdrop-blur-xl
    shadow-xl
    min-w-[140px]
    bg-cyan-500/10
    border-cyan-400/20
    text-cyan-200
  "
>
  <div className="flex items-center gap-2 font-bold">
    <Clock3 className="w-5 h-5" />
    {formattedTime}
  </div>
</div>

 <div className="h-full flex flex-col px-2 py-2  gap-3">

      {/* ================= TOP BAR ================= */}

   <Card
className="
rounded-none
border-b
border-white/5
bg-[#0d1726]
"
>

<CardContent className="px-5 py-4">

<div
  className="
  flex
  flex-col
  lg:flex-row
  lg:justify-between
  lg:items-center
  gap-4
  w-full
  "
>

  {/* LEFT */}
  <div>

    <div className="text-xs uppercase tracking-[0.25em] text-cyan-300 font-bold">
      Daily RC Arena
    </div>

    <h1 className="text-2xl font-black text-white mt-2">
      {challenge.title}
    </h1>

    <div className="flex flex-wrap items-center gap-2 mt-4">

      <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-200 text-sm">
        CAT-Level Simulation
      </div>

      <div className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400 text-sm text-white font-bold">
        {questions.length} Questions
      </div>

      <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-200 text-sm">
        {challenge.source_year}
      </div>

     

    </div>

  </div>

  
  <div
  className="
  flex
  flex-wrap
  items-center
  gap-3
  mt-4
  lg:mt-0
  lg:ml-auto
  "
>

<div className="w-[180px] px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/20 shrink-0">

  <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-200 font-bold">
    Progress
  </div>

  <>
  <div className="text-lg font-black text-white">
    {answeredCount} Attempted
  </div>

  <div className="text-sm text-slate-400">
    {questions.length - answeredCount} Remaining
  </div>
</>

</div>

 

  <Button
    onClick={() => {
      const unanswered =
        questions.length -
        Object.keys(answers).length;

      if (unanswered > 0) {
        const proceed = window.confirm(
          `You still have ${unanswered} unanswered question(s). Submit anyway?`
        );

        if (!proceed) return;
      }

      submitTest();
    }}
    className="
    h-[52px]
    px-8
    rounded-2xl
    bg-emerald-600
    hover:bg-emerald-500
    text-white
    font-bold
    "
  >
    Submit Test
  </Button>

</div>

  

</div>
</CardContent>

       </Card>

       
    



      {/* ================= MAIN ================= */}
<div
  className="
  mt-0
  grid
  grid-cols-1
  md:grid-cols-2
  gap-6
  flex-1
  min-h-0
  "
>
        {/* ================= PASSAGE PANEL ================= */}

       <Card className="h-full rounded-[32px] border border-white/5 bg-[#0d1726] overflow-hidden">

          <div className="h-full min-h-0 flex flex-col">

            {/* HEADER */}

            <div className="shrink-0 border-b border-white/5 bg-[#101c30] px-6 py-5">

              <div className="flex items-center justify-between">

                <div>

                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-300 font-bold">

                    Reading Passage

                  </div>

                  <div className="text-xl font-bold text-white mt-2">

                    {challenge.title}

                  </div>

                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400">

                  <Brain className="w-4 h-4" />

                  Inference-heavy RC

                </div>

              </div>

            </div>

            {/* BODY */}

            <div className="flex-1 overflow-y-auto px-8 py-8">

            

 <div className="flex flex-col gap-12">

 {(
  challenge.passage_json?.length
    ? challenge.passage_json
    : challenge.passage
        ?.split(/\n\s*\n/)
        .filter(Boolean)
        || []
).map((para, i) => (

    <div
      key={i}
      className="text-[18px] leading-[2.15] text-slate-200"
    >
      {para}
    </div>

  ))}

</div>

</div>

        

          </div>

        </Card>

        {/* ================= QUESTION PANEL ================= */}

     <Card className="h-full rounded-[32px] bg-slate-900/90 overflow-hidden shadow-[0_0_40px_rgba(15,23,42,0.6)]">

          <div className="h-full flex flex-col min-w-0">

            {/* HEADER */}

            <div className="shrink-0 border-b border-white/5 bg-slate-800 border-b border-slate-700 px-6 py-5">

              <div className="flex items-center justify-between">

                <div>

                 <div className="text-xs uppercase tracking-[0.28em] text-cyan-200 font-black drop-shadow-[0_0_8px_rgba(103,232,249,0.6)]">
  Question
</div>

                  <div className="text-2xl font-black text-white mt-2">

                    Q{currentQuestion + 1}
                    <div className="mt-2">

  {answers[currentQuestion] !== undefined ? (

    <span className="text-emerald-400 text-sm font-bold">
      ● Answered
    </span>

  ) : (

    <span className="text-amber-400 text-sm font-bold">
      ● Not Answered
    </span>

  )}

</div>

                  </div>

                  <div className="flex gap-2 mt-4 flex-wrap">

  {questions.map((_, i) => {

    const active =
      currentQuestion === i;

    const answered =
      answers[i] !== undefined;

    return (

      <button
        key={i}
        onClick={() =>
          setCurrentQuestion(i)
        }
        className={`
          w-10 h-10
          rounded-xl
          font-bold
          transition-all
          ${
            active
              ? "bg-white text-black"
              : answered
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-slate-800 text-slate-400"
          }
        `}
      >

        {i + 1}

      </button>

    );

  })}

</div>


                 

                </div>

                <button className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-300">

                  <Flag className="w-5 h-5" />

                </button>

              </div>

            </div>

            {/* BODY */}

            <div className="mt-10 flex-1 min-h-0 overflow-y-auto px-6 py-7">

              <div className="text-[22px] font-bold leading-[1.5] text-white tracking-tight">

                {currentQ?.question_text}

              </div>

              {/* OPTIONS */}

              <div className="space-y-4 mt-8">

                {currentQ?.options?.map(
                  (option, index) => {

                    const selected =
                      answers[currentQuestion] ===
                      index;

                    return (

                      <button
                        key={index}
                        onClick={() =>
                          selectOption(index)
                        }
                        className={`
                          w-full text-left rounded-3xl p-5 transition-all border
                          ${
                           selected
  ? "border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20"
  : "border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-cyan-400/40"
                          }
                        `}
                      >

                        <div className="flex gap-4">

                         <div
  className={`
    w-10 h-10 rounded-xl
    flex items-center justify-center
    font-bold
    ${
      selected
        ? "bg-emerald-500 text-white shadow-lg shadow-cyan-500/30"
        : "bg-slate-700 text-white"
    }
  `}
>
  {String.fromCharCode(65 + index)}
</div>

                        <div className="flex-1 min-w-0 break-words text-[16px] leading-7 text-white pt-1">
  {String(
    typeof option === "string"
      ? option
      : option?.text || option?.option || ""
  )}
</div>

                          {selected && (

                            <CheckCircle2 className="w-6 h-6 text-emerald-300 mt-1" />

                          )}

                        </div>

                      </button>

                    );
                  }
                )}

              </div>

            </div>

            {/* FOOTER */}

           <div className="sticky bottom-0 shrink-0 border-t border-white/5 bg-[#132038] px-6 py-4 flex items-center justify-between gap-4 min-w-0">
              <Button
                variant="outline"
                disabled={currentQuestion === 0}
                onClick={() =>
                  setCurrentQuestion(
                    (prev) => prev - 1
                  )
                }
                className="rounded-2xl border-white/10 bg-transparent text-white"
              >

                <ChevronLeft className="w-4 h-4 mr-1" />

                Previous

              </Button>

              <Button
  onClick={clearResponse}
  disabled={
    answers[currentQuestion] === undefined
  }
  className="
    rounded-2xl
    bg-cyan-500/15
    border
    border-cyan-400/30
    text-cyan-300
    hover:bg-cyan-500/25
    hover:text-cyan-200
  "
>
  ✕ Clear Response
</Button>

              

              <Button
                disabled={
                  currentQuestion ===
                  questions.length - 1
                }
                onClick={() =>
                  setCurrentQuestion(
                    (prev) => prev + 1
                  )
                }
                className="rounded-2xl border-white/10 bg-transparent text-white"
              >

                Next

                <ChevronRight className="w-4 h-4 ml-1" />

              </Button>

            </div>

          </div>

        </Card>

      </div>

    </div>
    </div>

  

);
}