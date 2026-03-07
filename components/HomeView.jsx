"use client"

import { useRouter } from "next/navigation"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Leaderboard from "./Leaderboard"
import SubscribeButton from "@/components/SubscribeButton"
import {
  Brain,
  BookOpen,
  Timer,
  BarChart3,
  GraduationCap,
  Target,
  Trophy,
  MessageSquare,
  Flame,
  Lock,
} from "lucide-react"

/* ---------- Time-based greeting ---------- */
function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return "Good morning 🌅"
  if (h >= 12 && h < 17) return "Good afternoon ☀️"
  if (h >= 17 && h < 22) return "Good evening 🌙"
  return "Good night 🌌"
}

export default function HomeView({ setView, startAdaptiveRC, userName, user }) {
  const router = useRouter()
  const [streak, setStreak] = useState(0)
 const [stats, setStats] = useState({
  accuracy: 0,
  speed: 0,
  score: 0,
  iq: 0,
  iqBreakdown: {
    accuracy: 0,
    speed: 0,
    balance: 0
  }
})

const [insight, setInsight] = useState({
  strength: "",
  weakness: "",
  advice: "",
});

const ALL_RC_TYPES = [
  "main-idea",
  "detail",
  "inference",
  "tone",
  "purpose",
  "assumption",
  "next-paragraph",
  "function",
  "author-agreement"
];

const [skills, setSkills] = useState([]);
const [dna, setDNA] = useState({
  type: "",
  description: ""
})

useEffect(() => {
  async function loadStreak() {
    if (!user) return

    const { data, error } = await supabase
      .from("profiles")
      .select("streak_count")
      .eq("user_id", user.id)
      .single()

    if (!error && data) {
      setStreak(data.streak_count || 0)
    }
  }

  loadStreak()
}, [user])

useEffect(() => {

if (!user?.id) return;

async function loadStats() {

  const { data, error } = await supabase
 .from("rc_questions")
.select("question_type, is_correct, time_taken_sec")
.eq("user_id", user.id)
  

  if (error || !data || data.length === 0) return;


  let totalQ = 0;
  let correct = 0;
  let totalTime = 0;

  const typeStats = {};

// initialize all skills
ALL_RC_TYPES.forEach(type => {
  typeStats[type] = { correct: 0, total: 0 };
});

  data.forEach(q => {

  const time = q.time_taken_sec || 0;

totalQ++;

if (q.is_correct) correct++;

if (time > 0) {
  totalTime += time;
}

 

  totalTime += time;

   const type = (q.question_type || "inference")
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/_/g, "-");

    if (!typeStats[type]) {
      typeStats[type] = { correct: 0, total: 0 };
    }

    typeStats[type].total++;

    if (q.is_correct) {
      typeStats[type].correct++;
    }

  });

 const skillData = ALL_RC_TYPES.map(type => {

  const s = typeStats[type];

  const acc = s.total === 0
    ? 0
    : Math.round((s.correct / s.total) * 100);

  return {
    type,
    accuracy: acc,
    total: s.total
  };

});
  const accuracy = Math.round((correct / totalQ) * 100);

  const avgTime = totalTime / totalQ;

const wordsPerQuestion = 100;
const rawSpeed = (wordsPerQuestion / avgTime) * 60;

// clamp realistic range
const speed = Math.max(120, Math.min(350, Math.round(rawSpeed)));

  const score = Math.min(100, Math.round(accuracy * 1.3));

  setStats({
    accuracy,
    speed,
    score,
  });

/* ---------- RC Intelligence Score ---------- */

// speed normalization
const speedScore = Math.min(100, Math.round((speed / 300) * 100));

// skill balance
const accValues = skillData.map(s => s.accuracy);

const mean =
  accValues.reduce((a,b)=>a+b,0) / accValues.length;

const variance =
  accValues.reduce((sum,val)=>sum+Math.pow(val-mean,2),0) /
  accValues.length;

const skillBalance = Math.max(0, 100 - Math.round(variance));

// contributions
const accuracyPart = Math.round(accuracy * 0.5);
const speedPart = Math.round(speedScore * 0.3);
const balancePart = Math.round(skillBalance * 0.2);

const rcIQ = accuracyPart + speedPart + balancePart;

setStats(prev => ({
  ...prev,
  iq: rcIQ,
  iqBreakdown: {
    accuracy: accuracyPart,
    speed: speedPart,
    balance: balancePart
  }
}));

  let dnaType = ""
let dnaDesc = ""

if (speed >= 250 && accuracy >= 60) {
  dnaType = "⚡ Strategic Reader"
  dnaDesc = "You balance speed and comprehension well."
}

else if (speed >= 250 && accuracy < 60) {
  dnaType = "⚡ Impulsive Reader"
  dnaDesc = "You read fast but accuracy suffers. Slow slightly."
}

else if (speed < 250 && accuracy >= 60) {
  dnaType = "🧠 Analytical Reader"
  dnaDesc = "You analyze deeply but may spend too long."
}

else {
  dnaType = "🐢 Developing Reader"
  dnaDesc = "Both speed and accuracy need structured practice."
}

setDNA({
  type: dnaType,
  description: dnaDesc
})

  /* ---------- AI Insight ---------- */

  let bestType = "";
  let worstType = "";
  let bestAcc = -1;
  let worstAcc = 2;

  Object.entries(typeStats).forEach(([type, s]) => {

   const acc = s.total === 0 ? 0 : s.correct / s.total;

    if (acc > bestAcc) {
      bestAcc = acc;
      bestType = type;
    }

    if (acc < worstAcc) {
      worstAcc = acc;
      worstType = type;
    }

  });
function prettyType(t) {
  const map = {
    inference: "Inference Questions",
    tone: "Tone / Author Attitude",
    "main-idea": "Main Idea Questions",
    "next-paragraph": "Next Paragraph Questions",
    function: "Function Questions",
    purpose: "Author Purpose Questions",
  };

  return map[t] || "Reading Comprehension";
}


  const finalStrength = prettyType(bestType);
  const finalWeakness = prettyType(worstType);

 
setSkills(skillData);

  setInsight({
    strength: finalStrength,
    weakness: finalWeakness,
    advice: `Focus on ${finalWeakness} this week.`,
  });

}

if (user?.id) {
  loadStats();
}

}, [user]);


  return (
   <div className="flex flex-col gap-10 pb-28">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-white">
            {getGreeting()}, {userName || "Champion"} 👋
          </h1>
          <p className="text-slate-400 mt-1">
            Your structured RC training system
          </p>
        </div>

        {!user && (
          <Button onClick={() => setView("login")}>
            Login
          </Button>
        )}
      </div>

      {/* ================= BIRBAL ================= */}

<div
  onClick={() => setView("mentor")}
 className="mb-10 cursor-pointer rounded-2xl border border-indigo-500/30 bg-slate-900/20 hover:bg-slate-800 transition p-5 flex items-center justify-between shadow-lg"
>

  <div className="flex items-center gap-4">

    <img
      src="/birbal.png"
      className="w-12 h-12 rounded-full"
    />

    <div>
      <div className="text-lg font-semibold text-white">
        Ask Birbal
      </div>
      <span className="ml-2 text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
AI
</span>

      <div className="text-sm text-slate-400">
        Ask Birbal about RC mistakes, inference traps, or author logic
      </div>
    </div>

  </div>

  <div className="text-indigo-400 text-sm">
    Start →
  </div>

</div>

      {/* ================= DAILY WORKOUT ================= */}
      <Card className="bg-gradient-to-br from-indigo-600 to-indigo-500 text-white border-0 shadow-2xl rounded-3xl">
        <CardContent className="p-8 space-y-6">

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Flame size={22} />
              <h2 className="text-2xl font-bold">Today's 30-Min Workout</h2>
            </div>

            <Button
              variant="secondary"
              className="rounded-full px-6"
              onClick={startAdaptiveRC}
            >
              Start Drill →
            </Button>
          </div>

          {/* Workout Breakdown */}
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">

            <WorkoutBlock icon={<Timer size={18} />} time="5 min" label="Speed Drill" />
            <WorkoutBlock icon={<BookOpen size={18} />} time="5 min" label="Vocabulary" />
            <WorkoutBlock icon={<Brain size={18} />} time="15 min" label="2 RC Passages" />
            <WorkoutBlock icon={<Target size={18} />} time="5 min" label="Tone / Main Idea" />
            <WorkoutBlock icon={<BarChart3 size={18} />} time="Auto" label="Diagnosis Report" />

          </div>

        </CardContent>
      </Card>

      {/* ================= PERFORMANCE SNAPSHOT ================= */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          Performance Snapshot
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          <StatCard label="Accuracy" value={`${stats.accuracy}%`} />

<StatCard label="Avg Speed" value={`${stats.speed} wpm`} />

<StatCard
  label="Streak"
  value={streak > 0 ? `🔥 ${streak} days` : "Start 🔥"}
/>

<StatCard label="RC Score" value={`${stats.score}/100`} />
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800 rounded-2xl">
<CardContent className="p-6 space-y-2">

<h2 className="text-lg font-semibold text-white">
🧬 Your Reader DNA
</h2>

<p className="text-indigo-400 font-semibold text-lg">
{dna.type}
</p>

<p className="text-slate-400 text-sm">
{dna.description}
</p>

</CardContent>
</Card>

{/* ================= LEADERBOARD ================= */}
<div className="space-y-4">
  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
  <span>🏆</span>
  Daily Workout Leaderboard
  <span className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded-full">
    Today
  </span>
</h2>

  <Leaderboard />
</div>

 {/* ================= PREMIUM ================= */}

<Card className="bg-slate-900 border-slate-800 rounded-2xl">
  <CardContent className="p-6 space-y-4">

    <h2 className="text-xl font-semibold text-white">
      AuctorRC Premium
    </h2>

    <p className="text-slate-400 text-sm">
      Unlock unlimited RC practice, deeper analytics, and personal guidance from Birbal.
    </p>

    <div className="flex gap-4 flex-wrap">

     <Button
onClick={() => router.push("/pricing")}
className="rounded-xl"
> 
ViewPremium Plans →
</Button>

    </div>

  </CardContent>
</Card>

{/* ================= RC SKILL MAP ================= */}

<Card className="bg-slate-900 border-slate-800 rounded-2xl">

<CardContent className="p-6 space-y-4">

<h2 className="text-lg font-semibold text-white">
RC Skill Map
</h2>

{skills.length === 0 && (
<p className="text-slate-400 text-sm">
Complete a few RC passages to unlock skill insights.
</p>
)}

{skills.map((s, i) => (

<SkillBar
key={i}
label={s.type}
value={s.accuracy}
total={s.total}
/>

))}

</CardContent>

</Card>

<Card className="bg-gradient-to-br from-indigo-600 to-purple-600 border-0 rounded-2xl">
<CardContent className="p-6 text-center">

<div className="text-sm text-indigo-200">
Reading Intelligence
</div>

<div className="text-6xl font-bold text-white mt-2 tracking-tight">
{stats.iq}
</div>

<div className="text-indigo-200 text-sm mt-1">
Your Reading Intelligence Score
</div>

{/* IQ Breakdown */}
<div className="grid grid-cols-3 gap-8 text-center mt-8">

<div>
<div className="text-white font-semibold">
{stats.iqBreakdown.accuracy}
</div>
<div className="text-indigo-100 text-sm">
Accuracy
</div>
</div>

<div>
<div className="text-white font-semibold">
{stats.iqBreakdown.speed}
</div>
<div className="text-indigo-200 text-sm">
Speed
</div>
</div>

<div>
<div className="text-white font-semibold">
{stats.iqBreakdown.balance}
</div>
<div className="text-indigo-200 text-sm">
Skill Balance
</div>
</div>

</div>

</CardContent>
</Card>


      {/* ================= AI COACH ================= */}

<Card className="bg-slate-900 border-slate-800 rounded-2xl">
  <CardContent className="p-6 space-y-3">

    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
      🧠 AI Coach Insight
    </h2>

    <p className="text-slate-300">
      Strength: <span className="text-green-400">{insight.strength}</span>
    </p>

    <p className="text-slate-300">
      Weakness: <span className="text-red-400">{insight.weakness}</span>
    </p>

    <p className="text-slate-400 text-sm">
      {insight.advice}
    </p>

  </CardContent>
</Card>



      {/* ================= TRAINING MODES ================= */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          Training Modes
        </h2>
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          <ModeCard
            icon={<Brain />}
            title="Adaptive RC"
            desc="AI-driven passage selection"
            onClick={() => {
              setView("rc")
              startAdaptiveRC()
            }}
          />

          <ModeCard
            icon={<BookOpen />}
            title="Vocabulary Lab"
            desc="Smart spaced repetition"
            onClick={() => setView("vocab")}
          />

          <ModeCard
            icon={<Timer />}
            title="Speed Gym"
            desc="Reading acceleration drills"
            onClick={() => setView("speed")}
          />

          <ModeCard
            icon={<GraduationCap />}
            title="CAT Sectionals"
            desc="Full-length timed tests"
            onClick={() => setView("cat")}
          />

        </div>
      </div>

     

     
    </div>
  )
}

/* ================= REUSABLE COMPONENTS ================= */

function WorkoutBlock({ icon, time, label }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center space-y-2 border border-white/20">
      <div className="flex justify-center">{icon}</div>
      <div className="text-sm opacity-80">{time}</div>
      <div className="font-semibold">{label}</div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <Card className="bg-slate-900 border-slate-800 rounded-2xl">
      <CardContent className="p-6 text-center">
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-slate-400 text-sm mt-1">{label}</div>
      </CardContent>
    </Card>
  )
}

function ModeCard({ icon, title, desc, onClick }) {
  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-indigo-500 transition-all duration-300 rounded-2xl">
      <CardContent className="p-6 space-y-4">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white">
          {icon}
        </div>

        <div>
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <p className="text-slate-400 text-sm mt-1">{desc}</p>
        </div>

        <Button onClick={onClick} className="w-full rounded-xl">
          Enter →
        </Button>
      </CardContent>
    </Card>
  )
}

function LockedCard({ icon, title, desc }) {
  return (
    <Card className="bg-slate-900 border-slate-800 rounded-2xl opacity-80">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-700 text-white">
            {icon}
          </div>
          <Lock size={16} className="text-slate-400" />
        </div>

        <div>
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <p className="text-slate-400 text-sm mt-1">{desc}</p>
        </div>

        <Button disabled className="w-full rounded-xl">
          Unlock Soon
        </Button>
      </CardContent>
    </Card>
  )
}

function getColor(v) {

  if (v >= 60) {
    return "bg-green-500"
  }

  if (v >= 40) {
    return "bg-orange-500"
  }

  return "bg-red-500"

}



function SkillBar({ label, value, total }) {
  return (

    <div className="space-y-1">

      <div className="flex justify-between text-sm text-slate-300">
        <span>{label}</span>
       <span>
  {value}% {total > 0 && `(${total}Q)`}
</span>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-2">
       <div
  className={`h-2 rounded-full ${getColor(value)}`}
  style={{ width: `${value}%` }}
/>
      </div>

    </div>

  )
}