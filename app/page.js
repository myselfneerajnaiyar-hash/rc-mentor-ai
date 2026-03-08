"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const originalParse = JSON.parse;

JSON.parse = function (...args) {
  try {
    return originalParse(...args);
  } catch (e) {
    console.error("JSON PARSE CRASHED ON:", args[0]);
    throw e;
  }
};

import { useState, useEffect } from "react";
import HomeView from "../components/HomeView";
import MentorView from "../components/MentorView";
import Navbar from "../components/Navbar";
import RCView from "../components/RCView";
import SpeedGym from "../components/SpeedGym";
import SpeedDashboard from "../components/SpeedDashboard";
import SpeedContainer from "../components/SpeedContainer";
import VocabLab from "../components/VocabLab";
import CATArenaLanding from "../cat-arena/CATArenaLanding";
import CATArenaView from "../cat-arena/CATArenaView";
import CATArenaTestView from "../cat-arena/CATArenaTestView";
import CATInstructions from "../cat-arena/CATInstructions"
import RCSectionalContainer from "../cat-arena/rc/RCSectionalContainer";
import CATAnalytics from "../components/CATAnalytics";
import MobileBottomNav from "./components/MobileBottomNav";
import { supabase } from "../lib/supabase"
import ProfileView from "../components/ProfileView";
import LoginPage from "./login/page";
import { Home, Brain, BookOpen, Timer, GraduationCap, BarChart3, User, Flame, MessageSquare } from "lucide-react";
import DailyWorkoutFlow from "../components/DailyWorkoutFlow";
import Leaderboard from "../components/Leaderboard"
import DailyWorkoutContainer from "../components/DailyWorkoutContainer"
import TabGroup from "../components/TabGroup";
import ChatMentor from "../components/ChatMentor"
import PracticeSwitcher from "@/components/PracticeSwitcher";


function safeParse(value, fallback = {}) {
  try {
    if (!value || value === "undefined") return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function loadSectionalAttemptMapFromDB() {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return {};

    const { data } = await supabase
      .from("sectional_tests")
      .select("sectional_id")
      .eq("user_id", authData.user.id);

    const map = {};
    (data || []).forEach(row => {
      map[row.sectional_id] = true;
    });

    return map;
  } catch (e) {
    return {};
  }
}
    
export default function Page() {


  const [text, setText] = useState("");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);
  

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const [mode, setMode] = useState("idle");
  // idle | showingPrimary | showingEasier | solved

  const [feedback, setFeedback] = useState("");
  const [flow, setFlow] = useState("original");
  // original | generated

  const [genre, setGenre] = useState("Psychology");
  const [difficulty, setDifficulty] = useState("moderate");
  const [lengthRange, setLengthRange] = useState("400-500");

  // ---- TEST STATE ----
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [testAnswers, setTestAnswers] = useState({});
  const [testQuestions, setTestQuestions] = useState([]);
  const [testLoading, setTestLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState("mentor");
  // mentor | ready | test | result | newRC | profile | detailed | vocab | loading-adaptive
  const [view, setView] = useState("home"); 
// home | rc | vocab | speed | cat | workout
 const [activeRCTest, setActiveRCTest] = useState(null);
const [sectionalAttemptMap, setSectionalAttemptMap] = useState({});

  const [generatedRC, setGeneratedRC] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState("overview");
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [questionTimes, setQuestionTimes] = useState({});
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [userName, setUserName] = useState("");

  // ---- VOCAB STATE ----
  
  const [vocabIndex, setVocabIndex] = useState(0);
  const [vocabTimer, setVocabTimer] = useState(0);
  const [vocabRunning, setVocabRunning] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
 
  
  const [catPhase, setCatPhase] = useState("idle");
// idle | generating | instructions | test | diagnosis | review
  const [catTab, setCatTab] = useState("tests"); 
// tests | analytics

useEffect(() => {
  if (typeof window === "undefined") return;

  function handler(e) {
    const { sectionalId, attemptId } = e.detail || {};

    setView("cat");
    setCatPhase("test");

    setActiveRCTest({
      id: sectionalId || "history",
      __startPhase: "diagnosis",
      __attemptId: attemptId,
    });
  }

  window.addEventListener("OPEN_DIAGNOSIS", handler);

  return () => {
    window.removeEventListener("OPEN_DIAGNOSIS", handler);
  };
}, []);

  function computeStatus(w) {
    if (w.correctCount >= 3) return "mastered";
    if (w.correctCount >= 1) return "learning";
    return "new";
  }

  

  
  useEffect(() => {
    if (phase === "test") {
      setTimeLeft(6 * 60);
      setTimerRunning(true);
      setQuestionStartTime(Date.now());
    }
  }, [phase]);

  useEffect(() => {
    if (!timerRunning) return;
    if (timeLeft <= 0) {
      setTimerRunning(false);
      setPhase("result");
      return;
    }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning, timeLeft]);

 

  useEffect(() => {
  async function load() {
    if (view === "cat") {
      const map = await loadSectionalAttemptMapFromDB();
      setSectionalAttemptMap(map);
    }
  }
  load();
}, [view]);

useEffect(() => {
  let mounted = true;

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    if (mounted) {
      setUser(data?.user || null);
    }
  }

  getUser();

  const { data: authListener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (mounted) {
        setUser(session?.user || null);
      }
    }
  );

  return () => {
    mounted = false;
    authListener?.subscription?.unsubscribe();
  };
}, []);


 useEffect(() => {
  if (!user) return;

  async function loadProfile() {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.name) {
      const formatted =
        profile.name.charAt(0).toUpperCase() +
        profile.name.slice(1);
      setUserName(formatted);
    }
  }

  loadProfile();
}, [user]);

  function splitPassage() {
    const raw = text.trim();
    let parts = raw
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);

    if (parts.length === 1) {
      const sentences = raw.match(/[^.!?]+[.!?]+/g) || [raw];
      parts = [];
      let current = "";
      for (let s of sentences) {
        if ((current + s).length > 300) {
          parts.push(current.trim());
          current = s;
        } else {
          current += " " + s;
        }
      }
      if (current.trim()) parts.push(current.trim());
    }

    setParas(parts);
    setIndex(0);
    setData(null);
    setMode("idle");
    setFeedback("");
    setPhase("mentor");
    setShowGenerator(false);
  }

  const current = paras[index] || "";

  const showInitial =
    paras.length === 0 &&
    !showGenerator &&
    phase !== "newRC" &&
    !isAdaptive;

  const showGenPanel = showGenerator && !isAdaptive;
  async function explain() {
    if (!current) return;
    setLoading(true);
    setError("");
    setData(null);
    setFeedback("");
    setMode("idle");

    try {
      const res = await fetch("/api/rc-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paragraph: current }),
      });
      if (!res.ok) throw new Error("API failed");
      const json = await res.json();
      setData(json);
      setMode("showingPrimary");
      setQuestionStartTime(Date.now());
    } catch {
      setError("Could not fetch explanation.");
    } finally {
      setLoading(false);
    }
  }

  function choose(i) {
    const end = Date.now();
    const timeTaken = Math.round((end - questionStartTime) / 1000);

    const key =
      mode === "showingPrimary"
        ? `para-${index}-primary`
        : `para-${index}-easier`;

    setQuestionTimes(t => ({ ...t, [key]: timeTaken }));

    if (!data) return;

    if (mode === "showingPrimary") {
      if (i === data.primaryQuestion.correctIndex) {
        setFeedback("Correct. You're reading this paragraph the right way.");
        setMode("solved");
      } else {
        setFeedback("Not quite. Let’s try a simpler question on the same idea.");
        setMode("showingEasier");
        setQuestionStartTime(Date.now());
      }
    } else if (mode === "showingEasier") {
      if (i === data.easierQuestion.correctIndex) {
        setFeedback("Correct. Good recovery.");
        setMode("solved");
      }
    }
  }

  function nextParagraph() {
    if (index === paras.length - 1) {
      setPhase("ready");
      return;
    }
    setIndex(i => i + 1);
    setData(null);
    setMode("idle");
    setFeedback("");
  }

  async function startTest() {
    setTestLoading(true);
    setError("");

    setTestQuestions([]);
    setTestAnswers({});
    setQuestionTimes({});
    setResult(null);

    try {
      const full = paras.join("\n\n");
      const res = await fetch("/api/rc-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  passage: full,
  mode: "normal",
}),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();

      const normalized = (json.questions || []).map(q => ({
        ...q,
        type: q.type ? q.type.trim().toLowerCase() : "unknown",
      }));

      setTestQuestions(normalized);
      setPhase("test");
    } catch {
      setError("Could not generate test.");
    } finally {
      setTestLoading(false);
    }
  }

  async function submitTest() {
    setTimerRunning(false);
    setLoading(true);
    setError("");

    try {
      const full = paras.join("\n\n");
      const res = await fetch("/api/rc-diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passage: full,
          questions: testQuestions,
          answers: testAnswers,
        }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setResult(json);
      setPhase("result");

  let existing = {};
if (typeof window !== "undefined") {
  existing = safeParse(localStorage.getItem("rcProfile"));
}

      const record = {
        date: Date.now(),
        questions: testQuestions.map((q, i) => ({
          type: (q.type || "inference").trim().toLowerCase(),
          correct: Number(testAnswers[i]) === Number(q.correctIndex),
          time: questionTimes[`test-${i}`] || 0,
        })),
      };

      existing.tests = existing.tests || [];
existing.tests.push(record);

if (typeof window !== "undefined") {
  localStorage.setItem("rcProfile", JSON.stringify(existing));
}
      // ---- Auto-update today's plan progress ----
try {
  const weekKey = "rcWeeklyPlan";
 let saved = {};

if (typeof window !== "undefined") {
  saved = safeParse(localStorage.getItem(weekKey));
}

  const now = new Date();
  const weekId =
    now.getFullYear() +
    "-W" +
    Math.ceil(
      ((now - new Date(now.getFullYear(), 0, 1)) / 86400000 +
        new Date(now.getFullYear(), 0, 1).getDay() +
        1) /
        7
    );

  if (saved[weekId]) {
    const plan = saved[weekId];

    const dayIndex = Math.min(
      6,
      Math.max(0, Math.floor((now - new Date(plan.created)) / 86400000))
    );

    if (plan.days[dayIndex]) {
      plan.days[dayIndex].done += 1;
      saved[weekId] = plan;
      if (typeof window !== "undefined") {
  localStorage.setItem(weekKey, JSON.stringify(saved));
}
    }
  }
} catch (e) {
  console.error("Plan auto-update failed", e);
}
    } catch {
      setError("Could not analyze your test.");
    } finally {
      setLoading(false);
    }
  }

  async function generateNewRC() {
    setGenLoading(true);
    setError("");

    try {
      const res = await fetch("/api/rc-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre, difficulty, lengthRange }),
      });

      if (!res.ok) throw new Error();

      const json = await res.json();
      setGeneratedRC(json);
      setPhase("newRC");
      setShowGenerator(false);
    } catch {
      setError("Could not generate new RC.");
    } finally {
      setGenLoading(false);
    }
  }

  async function startAdaptiveRC() {
    try {
      setIsAdaptive(true);
      setShowGenerator(false);

      setParas([]);
      setIndex(0);
      setData(null);
      setFeedback("");
      setMode("idle");

      setPhase("loading-adaptive");

  let raw = {};

if (typeof window !== "undefined") {
  raw = safeParse(localStorage.getItem("rcProfile"));
}
      const tests = raw.tests || [];

      if (!tests.length) {
        const res = await fetch("/api/rc-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genre: "Mixed",
            difficulty: "moderate",
            lengthRange: "400-500",
          }),
        });

        const json = await res.json();

        const parts = json.passage
          .split(/\n\s*\n/)
          .map(p => p.trim())
          .filter(Boolean);

        setParas(parts);
        setIndex(0);
        setPhase("mentor");
        return;
      }

      setPhase("mentor");
    } catch (e) {
      console.error(e);
      setShowGenerator(true);
      setPhase("mentor");
    }
  }

  const score = testQuestions.reduce(
    (s, q, i) =>
      s + (Number(testAnswers[i]) === Number(q.correctIndex) ? 1 : 0),
    0
  );

function updateTodayRCProgress() {
  const weekKey = "rcWeeklyPlan";
 
  let saved = {};

if (typeof window !== "undefined") {
  saved = safeParse(localStorage.getItem(weekKey));
}

  const now = new Date();
  const weekId =
    now.getFullYear() +
    "-W" +
    Math.ceil(
      ((now - new Date(now.getFullYear(), 0, 1)) / 86400000 +
        new Date(now.getFullYear(), 0, 1).getDay() +
        1) /
        7
    );

  if (!saved[weekId]) return;

  const plan = saved[weekId];

  const dayIndex = (now.getDay() + 6) % 7; // Monday = 0

  plan.days[dayIndex].done += 1; // allow overflow

  saved[weekId] = plan;

if (typeof window !== "undefined") {
  localStorage.setItem(weekKey, JSON.stringify(saved));
}
}
  
return (
 <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex relative">
<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_60%)]" />

    {/* Desktop Sidebar */}
<aside className="flex w-64 bg-slate-900/90 backdrop-blur-md border-r border-slate-800 p-6 flex-col">
    <div className="mb-8">
  <h2 className="text-xl font-semibold text-white tracking-tight">
    Auctor RC
  </h2>
  <p className="text-xs text-slate-500 mt-1">
    Powered by Birbal
  </p>
  <div className="h-px bg-slate-800 mt-6" />
</div>

<p className="text-xs uppercase text-slate-500 tracking-wider mb-3 mt-6">
  Navigation
</p>


     <nav className="flex flex-col gap-2 mt-6">
 {[
  { id: "home", label: "Home", icon: Home },
  { id: "mentor",label: "Ask Birbal", icon: MessageSquare},
  { id: "workout", label: "Daily Workout", icon: Flame },
  { id: "daily", label: "Analytics", icon: BarChart3 },
  { id: "rc", label: "RC", icon: Brain },
  { id: "vocab", label: "Vocab", icon: BookOpen },
  { id: "speed", label: "Speed", icon: Timer },
  { id: "cat", label: "CAT", icon: GraduationCap },
  { id: "profile", label: "Profile", icon: User },
].map((item) => {
  const Icon = item.icon;
  return (
    <button
      key={item.id}
      onClick={() => setView(item.id)}
   className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
${
 view === item.id
  ? item.id === "mentor"
    ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
    : "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
}`}
    >
    <Icon size={18} className="shrink-0" />
      {item.label}
    </button>
  );
})}
</nav>

    </aside>

    {/* Main Content */}
  <main className="flex-1 overflow-y-auto bg-slate-900/30">
 <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="w-full">
        {(view === "rc" || view === "vocab" || view === "speed") && (
  <PracticeSwitcher view={view} setView={setView} />
)}
   {/* Desktop Navbar */}
<div className="desktop-navbar">
 {/* <Navbar view={view} setView={setView} /> */}
</div>

   {view === "home" && (
<HomeView
  setView={setView}
  startAdaptiveRC={() => setView("workout")}
  userName={userName}
  user={user}
/>
)}

{view === "mentor" && <ChatMentor />}

{view === "workout" && (
  <DailyWorkoutContainer user={user} />
)}



    {view === "rc" && <RCView view={view} setView={setView} />}

    {view === "speed" && <SpeedContainer />}

    {view === "vocab" && <VocabLab />}

    {view === "profile" && <ProfileView setView={setView} />}

    {view === "login" && <LoginPage />}

{/* ================= CAT ARENA ================= */}

{view === "cat" && (
  <>
  <div className="max-w-5xl mx-auto px-6">
   <div className="p-4 sticky top-0 z-20 bg-slate-900">
  <TabGroup
    tabs={[
      { value: "tests", label: "Take Tests" },
      { value: "analytics", label: "Analytics" },
    ]}
    active={catTab}
    onChange={setCatTab}
  />
</div>

    {/* ===== ANALYTICS TAB ===== */}
    {catTab === "analytics" && <CATAnalytics />}

    {/* ===== TESTS TAB ===== */}
    {catTab === "tests" && (
      <>
        {catPhase === "idle" && (
          <CATArenaLanding
            attemptedMap={sectionalAttemptMap}
            onStartRC={async (sectionalId) => {
              setCatPhase("generating");

              const res = await fetch(`/api/cat-sectionals/${sectionalId}`);
              const data = await res.json();

              if (!data.passages) {
                alert("Invalid test file");
                setCatPhase("idle");
                return;
              }

              data.id = sectionalId;
              setActiveRCTest(data);
              setCatPhase("instructions");
            }}
           
            onViewDiagnosis={(sectionalId, attemptId) => {
  setActiveRCTest({
    id: sectionalId,
    __startPhase: "diagnosis",
    __attemptId: attemptId,
  });

  setCatPhase("test");
}}


            onReviewTest={async (sectionalId) => {
             

              setCatPhase("generating");
              const res = await fetch(`/api/cat-sectionals/${sectionalId}`);
              const data = await res.json();

              data.id = sectionalId;
              data.__startPhase = "review";

              setActiveRCTest(data);
              setCatPhase("test");
            }}
          />
        )}

        {catPhase === "generating" && (
          <div style={{ padding: 40, textAlign: "center" }}>
            <h2>Generating CAT RC Sectional…</h2>
            <p>Please wait.</p>
          </div>
        )}

        {catPhase === "instructions" && (
          <CATInstructions
            onStart={() => setCatPhase("test")}
          />
        )}

       {catPhase === "test" && activeRCTest && (
  <RCSectionalContainer
    
    testData={activeRCTest}
    forceDiagnosis={activeRCTest.__startPhase === "diagnosis"}
    onExit={() => {
  setCatPhase("idle");
  setActiveRCTest(null);
}}
  />
)}

      </>
    )}
    </div>
  </>
)}
</div>

  {/* MOBILE BOTTOM NAV (Mobile only) */}
      <div className="md:hidden">
        <MobileBottomNav view={view} setView={setView} />
      </div>
</div>
    </main>
    </div>
  

);
}
