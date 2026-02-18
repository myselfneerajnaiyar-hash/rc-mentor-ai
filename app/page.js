"use client";
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
import CATArenaTestView from "../cat-arena/CATArenaTestView";
import CATInstructions from "../cat-arena/CATInstructions"
import RCSectionalContainer from "../cat-arena/rc/RCSectionalContainer";
import CATAnalytics from "../components/CATAnalytics";
import MobileBottomNav from "./components/MobileBottomNav";
import { supabase } from "../lib/supabase"
import ProfileView from "../components/ProfileView";

async function loadSectionalAttemptMapFromDB() {
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
}

    
export default function Page() {
  const [text, setText] = useState("");
  const [paras, setParas] = useState([]);
  const [index, setIndex] = useState(0);
  

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
// home | rc | vocab | speed | cat
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
  function handler(e) {
    const { sectionalId, attemptId } = e.detail || {};

    setView("cat");
    setCatPhase("test");

    setActiveRCTest({
      id: sectionalId || "_history_", // fallback safety
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
  async function loadProfile() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (profile?.name) {
      // Capitalize properly
      const formatted =
        profile.name.charAt(0).toUpperCase() +
        profile.name.slice(1);
      setUserName(formatted);
    }
  }

  loadProfile();
}, []);

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

      const existing = JSON.parse(localStorage.getItem("rcProfile") || "{}");

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
      localStorage.setItem("rcProfile", JSON.stringify(existing));
      // ---- Auto-update today's plan progress ----
try {
  const weekKey = "rcWeeklyPlan";
  const saved = JSON.parse(localStorage.getItem(weekKey) || "{}");

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
      localStorage.setItem(weekKey, JSON.stringify(saved));
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

      const raw = JSON.parse(localStorage.getItem("rcProfile") || "{}");
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
  const saved = JSON.parse(localStorage.getItem(weekKey) || "{}");

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
  localStorage.setItem(weekKey, JSON.stringify(saved));
}
  
return (
  <>
  <main>
   {/* Desktop Navbar */}
<div className="desktop-navbar">
  <Navbar view={view} setView={setView} />
</div>

   {view === "home" && (
  <HomeView
    setView={setView}
    startAdaptiveRC={() => setView("rc")}
    userName={userName}
  />
)}

    {view === "rc" && <RCView view={view} setView={setView} />}

    {view === "speed" && <SpeedContainer />}

    {view === "vocab" && <VocabLab />}

    {view === "profile" && <ProfileView setView={setView} />}

{/* ================= CAT ARENA ================= */}

{view === "cat" && (
  <>
    {/* TOP TABS */}
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: 12,
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <button
        onClick={() => setCatTab("tests")}
        style={{
          flex: 1,
          padding: 12,
          borderRadius: 10,
          fontWeight: 600,
          border: "none",
          background: catTab === "tests" ? "#2563eb" : "#e5e7eb",
          color: catTab === "tests" ? "#fff" : "#111",
        }}
      >
        Take Tests
      </button>

      <button
        onClick={() => setCatTab("analytics")}
        style={{
          flex: 1,
          padding: 12,
          borderRadius: 10,
          fontWeight: 600,
          border: "none",
          background: catTab === "analytics" ? "#2563eb" : "#e5e7eb",
          color: catTab === "analytics" ? "#fff" : "#111",
        }}
      >
        Analytics
      </button>
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
  </>
)}
  </main>
{/* MOBILE BOTTOM NAV */}
<div className="mobile-nav">
  <MobileBottomNav view={view} setView={setView} />
</div>
  </>

);
}
