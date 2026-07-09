"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function BirbalWelcomeModal({
    user,
  onStart,
}) {
  const [step, setStep] = useState(1);
  const [isCAT, setIsCAT] = useState(false);
 const TOTAL_STEPS = 3;

useEffect(() => {
  async function loadUserExam() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("exam")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Could not load user exam:", error);
      return;
    }

    setIsCAT(data?.exam?.toUpperCase() === "CAT");
  }

  loadUserExam();
}, [user?.id]);

const close = async () => {
  await supabase
    .from("profiles")
    .update({
      birbal_onboarded: true,
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
max-h-[90vh]
overflow-y-auto
bg-slate-900/95
backdrop-blur-xl
border
border-indigo-500/20
rounded-3xl
p-5 sm:p-6
shadow-2xl
shadow-indigo-900/30
animate-modalEnter
"
>

    <div className="flex justify-center gap-2 mb-4">

  {[1, 2, 3].map((s) => (
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
  message={`Hi! I'm Birbal, your personal reading mentor.
I’ll help you understand how you read, where your reasoning goes wrong, and what to improve next.
The more you practice, the better I understand you.`}
/>
    <div className="space-y-2 mt-4">

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
      className="mt-4 w-full bg-indigo-600 py-3 rounded-xl font-semibold"
    >
      Continue →
    </button>
  </>
)}

      {step === 2 && (
  <>
   <BirbalSpeech
  message={`Getting an answer wrong isn't the real problem. Not knowing why you got it wrong is.
I’ll help you spot patterns in your mistakes and turn them into a clear plan for improvement.`}
/>

    <div className="space-y-3">

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
      className="mt-4 w-full bg-indigo-600 py-3 rounded-xl font-semibold"
    >
      Show My Tools →
    </button>

  </>
)}
{step === 3 && (
  <>
   <BirbalSpeech
  message={`You don't need to use everything at once.
Start practising, explore the tools below, and I'll help you focus on what matters most for your improvement.
Ready? Let's begin.`}
/>

    <div className="space-y-3">

{isCAT && (
      <JourneyCard
        icon="🏆"
        title="Daily RC Arena"
        desc="Daily CAT PYQ challenge + leaderboard"
      />
)}

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
  onClick={close}
  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-semibold transition"
>
  Let's Begin →
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
    }, 10);

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
    <div className="flex items-start gap-3 mb-4">

      <img
        src="/birbal.png"
        alt="Birbal"
       className="
w-12 h-12
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
    p-3
    text-slate-200
    leading-snug
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
        rounded-xl
        px-4
        py-3
        flex
        items-center
        gap-3
        hover:border-indigo-500/40
        transition-all
      "
    >
      <div className="text-2xl">
        {icon}
      </div>

      <div>
        <div className="text-white font-semibold">
          {title}
        </div>

        <div className="text-slate-400 text-sm">
          {desc}
        </div>
      </div>
    </div>
  );
}