"use client"

import { useRouter } from "next/navigation"
import { startProductTour } from "@/components/ProductTour";

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Leaderboard from "@/components/Leaderboard"
import SubscribeButton from "@/components/SubscribeButton"
import RCLeaderboard from "@/components/RCLeaderboard"
import TodayActivity from "@/components/home-v2/TodayActivity";
import WordHuntLeaderboard from "@/components/WordHuntLeaderboard"
import RCArenaChampion from "@/components/RCArenaChampion"
import PremiumFeatures from "@/components/home-v2/PremiumFeatures";
import PremiumCTA from "@/components/home-v2/PremiumCTA";
import TestSeriesHero from "@/components/home-v2/TestSeriesHero";
import LeaderboardSection from "@/components/home-v2/LeaderboardSection";
import ReadingProfile from "@/components/home-v2/ReadingProfile";
import BirbalCoachReport from "@/components/home-v2/BirbalCoachReport";
import BirbalFloatingButton from "@/components/home-v2/BirbalFloatingButton";
import BirbalCoachCard
from "@/components/BirbalCoachCard";
import Header from "@/components/home-v2/Header";
import { generateCoachPlan }
from "@/lib/birbal/generateCoachPlan";

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

export default function ShadowHomeView({ setView, startAdaptiveRC, userName, user, exam, }) {
const normalizedExam = exam?.trim().toUpperCase() || "";

const isCAT = normalizedExam === "CAT";

const examDisplayNames = {
  CAT: "CAT VARC",
  XAT: "XAT Verbal",
  GMAT: "GMAT Verbal",
  CLAT: "CLAT English",
  "BANK PO": "Bank PO English",
  SSC: "SSC English",
  CUET: "CUET Language",
  IPMAT: "IPMAT Verbal",
};

const examDisplayName =
  examDisplayNames[normalizedExam] || exam || "Reading";

  const router = useRouter()
  const [streak, setStreak] = useState(0)
  const [coach, setCoach] = useState(null);
  const [dailyRCStreak, setDailyRCStreak] = useState(0)
  const [wordHuntStreak, setWordHuntStreak] = useState(0)
  const [coachReport, setCoachReport] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [todayMission, setTodayMission] =

  useState(null);
  
const [playedToday, setPlayedToday] = useState(false)
const [completedArenaToday, setCompletedArenaToday] =
useState(false)

const [completedWorkoutToday, setCompletedWorkoutToday] =
useState(false)
const [isPremium, setIsPremium] = useState(false)
const [birbalCredits, setBirbalCredits] = useState(0)
const [trialExpired, setTrialExpired] = useState(false)
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
  .select("streak_count,daily_rc_streak")
  .eq("user_id", user.id)
  .single()

    if (!error && data) {
      setStreak(data.streak_count || 0)

setDailyRCStreak(
  data.daily_rc_streak || 0
)
    }
  }

  loadStreak()
}, [user])


useEffect(() => {

  if (!user?.id) return;

  async function loadCoachReport() {

  const res = await fetch(
  `/api/birbal-coach?userId=${user.id}`
);

if (!res.ok) {
  console.error(await res.text());
  return;
}

const text = await res.text();

console.log(text);

const data = JSON.parse(text);

setCoach(data.coach);
setCoachReport(data.coach);

   setCoach(data.coach);
setCoachReport(data.coach);

  }

  loadCoachReport();

}, [user]);

useEffect(() => {

  if (!user?.id) return;

  const tasks = [];

  let missionText = "";

  // New user
  if (
    streak === 0 &&
    dailyRCStreak === 0 &&
    wordHuntStreak === 0
  ) {

   if (isCAT) {
  missionText =
    "Welcome to Auctor RC. Complete your first Daily RC Arena, play one Word Hunt and finish one Daily Workout.";

  tasks.push({
    title: "Daily RC Arena",
    completed: false
  });
} else {
  missionText =
    "Welcome to Auctor RC. Complete your first RC, play one Word Hunt and finish one Daily Workout.";

  tasks.push({
    title: "Practice RC",
    completed: false
  });
}

tasks.push({
  title: "Word Hunt",
  completed: false
});

tasks.push({
  title: "Daily Workout",
  completed: false
});
  }

  else {

   if (isCAT && dailyRCStreak === 0) {
  tasks.push({
    title: "Daily RC Arena",
    completed: dailyRCStreak > 0
  });
}

    if (wordHuntStreak === 0) {
     tasks.push({
 title: "Word Hunt",
 completed: playedToday
});
    }

    if (streak < 3) {
     tasks.push({
 title: "Daily Workout",
 completed: streak > 0
});
    }

    if (stats.accuracy < 60) {
      tasks.push({
  title: `Practice ${insight.weakness}`,
  completed: false
});
    }

    missionText =
      `Your current accuracy is ${stats.accuracy}%.
Focus on ${insight.weakness}.
Today's goal is consistency and improvement.`;
  }

  setTodayMission({
    text: missionText,
    tasks,
  });

}, [
  stats,
  streak,
  dailyRCStreak,
  wordHuntStreak,
  insight
]);
useEffect(() => {

  async function loadPremium() {

    if (!user?.id) return

    const { data } = await supabase
      .from("profiles")
      .select(`
        is_premium,
        birbal_credits,
        birbal_credit_month,
        trial_expires_at
      `)
      .eq("user_id", user.id)
      .single()

    if (!data) return

    const currentMonth =
      `${new Date().getFullYear()}-${new Date().getMonth() + 1}`

    let credits = data.birbal_credits || 0

    // MONTH RESET
    if (
      data.birbal_credit_month !== currentMonth
    ) {

      credits = data.is_premium ? 30 : 1

      await supabase
        .from("profiles")
        .update({
          birbal_credits: credits,
          birbal_credit_month: currentMonth
        })
        .eq("user_id", user.id)
    }

    setBirbalCredits(credits)

    setIsPremium(data?.is_premium || false)

    // TRIAL CHECK
    const expired =
      data.trial_expires_at
        ? new Date() >
          new Date(data.trial_expires_at)
        : true

    setTrialExpired(expired)
  }

  loadPremium()

}, [user])


useEffect(() => {
  async function loadWordHuntStreak() {
    if (!user?.id) return;

    const res = await fetch("/api/hangman-streak", {
      method: "POST",
      body: JSON.stringify({ user_id: user.id }),
    });

    const data = await res.json();

    setWordHuntStreak(data.streak || 0);
    setPlayedToday(data.isActiveToday || false);
  }

  loadWordHuntStreak();
}, [user]);

useEffect(() => {

  async function loadTodayActivity() {

    if (!user?.id) return;

    const today =
      new Date().toISOString().split("T")[0];

    const { data: arena } =
      await supabase
        .from("daily_rc_attempts")
        .select("id")
        .eq("user_id", user.id)
        .gte(
          "completed_at",
          `${today}T00:00:00`
        )
        .limit(1);

    const { data: workout } =
      await supabase
        .from("workout_attempts")
        .select("id")
        .eq("user_id", user.id)
        .gte(
          "completed_at",
          `${today}T00:00:00`
        )
        .limit(1);

    setCompletedArenaToday(
      arena?.length > 0
    );

    setCompletedWorkoutToday(
      workout?.length > 0
    );
  }

  loadTodayActivity();

}, [user]);

useEffect(() => {

  if (!user?.id) return;

  async function loadBirbalContext() {

    const res = await fetch(
      `/api/birbal-context?userId=${user.id}`
    );

    const context = await res.json();

    setStats({
  accuracy: context.analytics.overallAccuracy,
  speed: context.analytics.averageWPM || 0,
  iq: context.analytics.readingIQ,
  score: context.analytics.overallAccuracy,
  iqBreakdown: {}
});

setDNA({
  type: context.analytics.readerType,
  description: ""
});

setSkills(context.analytics.skills || []);
setInsight({
  strength:
    context.analytics.strongestSkill || "Not enough data",
  weakness:
    context.analytics.weakestSkill || "Not enough data",
  advice:
    context.recommendations?.join("\n") || ""
});
  }

  loadBirbalContext();

}, [user]);




  return (
    <>

 
   <div className="flex flex-col gap-10 pb-28">
<Header
  startTour={() => startProductTour(isCAT)}
  user={user}
  userName={userName}
  examDisplayName={examDisplayName}
  coach={coach}
  stats={stats}
  streak={streak}
  startAdaptiveRC={startAdaptiveRC}
  setView={setView}
/>

 {isCAT && (
  <>
    <TestSeriesHero setView={setView} />

   
  </>
)}

<TodayActivity
  exam={normalizedExam}
  setView={setView}
  dailyRCCompleted={completedArenaToday}
  workoutCompleted={completedWorkoutToday}
  wordhuntCompleted={playedToday}
/>
<PremiumFeatures
  setView={setView}
  startAdaptiveRC={startAdaptiveRC}
/>
<PremiumCTA />

<LeaderboardSection exam={exam} />

<ReadingProfile
  stats={stats}
  dna={dna}
  skills={skills}
  insight={insight}
/>

<BirbalCoachReport
  data={coachReport}
/>

<BirbalFloatingButton
    setView={setView}
    setChatOpen={setChatOpen}
/>


</div>
</>
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
  );
}
  
 