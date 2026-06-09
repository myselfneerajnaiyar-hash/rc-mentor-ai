"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function BirbalWelcomeModal({
    user,
  onStart,
}) {
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 6

 const close = async () => {

  await supabase
    .from("profiles")
    .update({
      birbal_onboarded: true
    })
    .eq("user_id", user.id);

  onStart?.();
};

  return (
   <div className="
fixed inset-0
z-[9999]
bg-black/60
backdrop-blur-md
flex items-center justify-center p-4
animate-fadeIn
">
     <div
className="
w-full
max-w-xl
bg-slate-900/95
backdrop-blur-xl
border
border-indigo-500/20
rounded-3xl
p-8
shadow-2xl
shadow-indigo-900/30
animate-modalEnter
"
>

    <div className="flex justify-center gap-2 mb-6">

  {[1,2,3,4,5,6].map((s) => (
    <div
      key={s}
      className={`h-2 rounded-full transition-all ${
        step >= s
          ? "w-10 bg-indigo-500"
          : "w-2 bg-slate-700"
      }`}
    />
  ))}

</div>
      {step === 1 && (
  <>
   <BirbalSpeech
 message={`
Welcome to Auctor RC.
Most aspirants solve hundreds of passages but never discover WHY they keep making the same mistakes.
My job is to identify those weaknesses, explain them clearly, and help you improve every day.
Think of me as your personal RC mentor.
`}
/>
    <div className="space-y-3 mt-6">

      <JourneyCard
        icon="🧠"
        title="Diagnose Mistakes"
        desc="Understand WHY answers go wrong"
      />

      <JourneyCard
        icon="🎯"
        title="Fix Weaknesses"
        desc="Target specific RC question types"
      />

      <JourneyCard
        icon="🏆"
        title="Think Like Toppers"
        desc="Learn elite RC decision-making"
      />

    </div>

    <button
      onClick={() => setStep(2)}
      className="mt-6 w-full bg-indigo-600 py-3 rounded-xl font-semibold"
    >
      Continue →
    </button>
  </>
)}

      {step === 2 && (
  <>
    <BirbalSpeech
     message={`
Most RC platforms stop after showing the correct answer.
Auctor goes much deeper.
You'll learn why an option is wrong, which RC skill is weak, and exactly what to practice next.
That's how consistent improvement happens.
`}
    />

    <div className="space-y-4">

      <JourneyCard
        icon="❌"
        title="Most Students"
        desc="Solve RC → Check Answer → Repeat"
      />

      <JourneyCard
        icon="🧠"
        title="Auctor Method"
        desc="Solve RC → Diagnosis → Improvement Plan"
      />

      <JourneyCard
        icon="📈"
        title="Continuous Growth"
        desc="Track speed, accuracy and weak areas"
      />

    </div>

    <button
      onClick={() => setStep(3)}
      className="mt-6 w-full bg-indigo-600 py-3 rounded-xl font-semibold"
    >
      Show My Tools →
    </button>

  </>
)}
{step === 3 && (
  <>
   <BirbalSpeech
  message={`These are the 5 tools you'll use most often.
You do not need to use all of them every day.
I'll tell you what to focus on.`}
/>

    <div className="space-y-3">

      <JourneyCard
        icon="🏆"
        title="Daily RC Arena"
        desc="Daily CAT PYQ challenge + leaderboard"
      />

      <JourneyCard
        icon="🔥"
        title="Daily Workout"
        desc="Structured 30-minute plan"
      />

      <JourneyCard
        icon="📖"
        title="RC Generator"
        desc="Unlimited RC practice"
      />

      <JourneyCard
        icon="⚡"
        title="Speed Drills"
        desc="Improve reading speed"
      />

      <JourneyCard
        icon="🧩"
        title="Vocabulary Lab"
        desc="Word Bank + Vocabulary Drills"
      />

    </div>

    <button
      onClick={() => setStep(4)}
      className="mt-6 w-full bg-indigo-600 py-3 rounded-xl font-semibold"
    >
      More Features →
    </button>
  </>
)}

{step === 4 && (
  <>
    <BirbalSpeech
  message={`The Editorial Decoder is one of my most powerful tools.
Upload any newspaper editorial and I'll break down tone, inference, vocabulary and author intent.
Precision Training focuses only on your weak areas.
Analytics helps you track progress like a professional athlete.`}
/>

    <div className="space-y-3 mt-6">

      <JourneyCard
        icon="🧠"
        title="Birbal Editorial Decoder"
        desc="Upload any editorial screenshot and understand tone, inference, vocabulary and author logic."
      />

      <JourneyCard
        icon="🎯"
        title="Precision Training"
        desc="Practice only your weak question types."
      />

      <JourneyCard
        icon="📊"
        title="Detailed Analytics"
        desc="Reading IQ, Reader DNA, Speed, Accuracy and Weakness Tracking."
      />

    </div>

    <button
      onClick={() => setStep(5)}
      className="mt-6 w-full bg-indigo-600 py-3 rounded-xl font-semibold"
    >
      Continue →
    </button>
  </>
)}

{step === 5 && (
  <>
   <BirbalSpeech
  message={`Improvement comes from consistency.
Streaks keep you showing up daily.
Leaderboards add competition.
Word Hunt makes vocabulary practice fun.
Small wins every day create big gains over time.`}
/>

    <div className="space-y-3 mt-6">

      <JourneyCard
        icon="🔥"
        title="Streaks"
        desc="Build daily momentum."
      />

      <JourneyCard
        icon="🏆"
        title="Leaderboards"
        desc="Compete with other learners."
      />

      <JourneyCard
        icon="🧩"
        title="Word Hunt"
        desc="Learn vocabulary through play."
      />

    </div>

    <button
      onClick={() => setStep(6)}
      className="mt-6 w-full bg-indigo-600 py-3 rounded-xl font-semibold"
    >
      Show Today's Plan →
    </button>
  </>
)}

       {step === 6 && (
  <>
    <BirbalSpeech
  message={`You don't need hours of study every day.
Complete this mission and you've made meaningful progress.
Show up daily and the results will follow.`}
/>

    <div className="space-y-3 mt-6">

      <JourneyCard
        icon="🏆"
        title="Daily RC Arena"
        desc="8 mins"
      />

      <JourneyCard
        icon="🧩"
        title="Word Hunt"
        desc="3 mins"
      />

      <JourneyCard
        icon="🔥"
        title="Daily Workout"
        desc="30 mins"
      />

      <JourneyCard
        icon="📊"
        title="Review Analytics"
        desc="2 mins"
      />

    </div>

    <div className="mt-5 text-emerald-400 font-semibold">
      Total Time: ~33 Minutes
    </div>

    <button
      onClick={close}
      className="mt-6 w-full bg-emerald-600 py-3 rounded-xl font-semibold"
    >
      Start Today's Mission →
    </button>
  </>
)}
      </div>
    </div>
  );
}

function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");

    let i = 0;

    const interval = setInterval(() => {
      i++;

      setDisplayed(text.slice(0, i));

      if (i >= text.length) {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="whitespace-pre-wrap">
      {displayed}
    </span>
  );
}

function BirbalSpeech({ message }) {
  return (
    <div className="flex items-start gap-4 mb-6">

      <img
        src="/birbal.png"
        alt="Birbal"
       className="
w-14 h-14
rounded-full
border-2
border-indigo-500
shadow-lg
shadow-indigo-500/30
float-birbal
"
      />

      <div
  className="
    flex-1
   bg-gradient-to-r from-slate-800/90 to-slate-700/50
    border
    border-slate-700
    rounded-2xl
    p-4
    text-slate-200
    leading-relaxed
  "
>
  <div className="text-xs text-indigo-400 mb-2">
    Birbal says
  </div>

  <TypewriterText text={message} />
</div>

    </div>
  );
}

function JourneyCard({ icon, title, desc }) {
  return (
    <div
      className="
        bg-gradient-to-r
        from-slate-800/80
        to-slate-800/40
        border
        border-slate-700
        rounded-2xl
        p-4
        flex
        items-center
        gap-4
        hover:border-indigo-500/40
        transition-all
      "
    >
      <div className="text-3xl">
        {icon}
      </div>

      <div>
        <div className="text-white font-semibold text-lg">
          {title}
        </div>

        <div className="text-slate-400 text-sm">
          {desc}
        </div>
      </div>
    </div>
  );
}