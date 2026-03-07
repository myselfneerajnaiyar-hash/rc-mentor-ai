"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import TabGroup from "./TabGroup";

import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";

export default function VocabProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [words, setWords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showWeakWords, setShowWeakWords] = useState(false);
  const [expandedWord, setExpandedWord] = useState(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  async function loadProfileData() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    const userId = authData.user.id;

    const { data: wordsData } = await supabase
      .from("user_words")
      .select("*")
      .eq("user_id", userId);

    const { data: sessionData } = await supabase
      .from("vocab_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (wordsData) setWords(wordsData);
    if (sessionData) setSessions(sessionData);
  }

  /* ================= METRICS ================= */

  const totalWords = words.length;

  const masteredWords = words.filter(w =>
    w.total_attempts &&
    w.correct_attempts / w.total_attempts >= 0.8
  ).length;

  const weakWords = words.filter(w =>
    !w.total_attempts ||
    w.correct_attempts / w.total_attempts < 0.5
  );

  const strongPercent = totalWords
    ? Math.round((masteredWords / totalWords) * 100)
    : 0;

  const weakPercent = totalWords
    ? 100 - strongPercent
    : 0;

  /* RETENTION (7 DAY) */

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentSessions = sessions.filter(
    s => new Date(s.created_at) >= sevenDaysAgo
  );

  const totalAttempts = recentSessions.reduce(
    (sum, s) => sum + (s.total_questions || 0),
    0
  );

  const totalCorrect = recentSessions.reduce(
    (sum, s) => sum + (s.correct_answers || 0),
    0
  );

  const retentionPercent =
    totalAttempts > 0
      ? Math.round((totalCorrect / totalAttempts) * 100)
      : 0;

      /* ================= DISCIPLINE CALCULATIONS ================= */

const now = new Date();

const active = words.filter(w => {
  if (!w.last_reviewed_at) return false;
  const diff = (now - new Date(w.last_reviewed_at)) / (1000 * 60 * 60 * 24);
  return diff <= 2;
}).length;

const slipping = words.filter(w => {
  if (!w.last_reviewed_at) return false;
  const diff = (now - new Date(w.last_reviewed_at)) / (1000 * 60 * 60 * 24);
  return diff > 2 && diff <= 6;
}).length;

const cold = words.filter(w => {
  if (!w.last_reviewed_at) return true;
  const diff = (now - new Date(w.last_reviewed_at)) / (1000 * 60 * 60 * 24);
  return diff > 6;
}).length;

      /* ================= MENTOR INSIGHTS ================= */

let retentionMessage = "";

if (retentionPercent === 0) {
  retentionMessage = "Start practising to activate your retention engine.";
} else if (retentionPercent < 40) {
  retentionMessage = "Your retention is weak. Focus on revising old words before learning new ones.";
} else if (retentionPercent < 70) {
  retentionMessage = "Good progress. Improve consistency to push beyond 80%.";
} else {
  retentionMessage = "Excellent retention. Maintain this momentum.";
}

const weakCount = weakWords.length;

let strengthMessage = "";

if (weakCount === 0) {
  strengthMessage = "You have no weak words. Strong foundation built.";
} else if (weakCount > totalWords * 0.6) {
  strengthMessage = "Majority of words are weak. You need a revision cycle immediately.";
} else {
  strengthMessage = "Convert weak words into strong ones to improve performance.";
}

let disciplineMessage = "";

if (cold > active) {
  disciplineMessage = "Most words are cold. You are losing recall strength.";
} else if (active > cold) {
  disciplineMessage = "Good consistency. Keep revising every 48 hours.";
} else {
  disciplineMessage = "Revision rhythm needs tightening.";
}

  const retentionData = [
    { name: "Retention", value: retentionPercent }
  ];

  /* WEEKLY BAR DATA */

  const weeklyData = sessions.slice(-7).map(s => ({
    date: new Date(s.created_at).toLocaleDateString().slice(0,5),
    accuracy: s.accuracy || 0
  }));

  /* STRENGTH PIE DATA */

  const strengthData = [
    { name: "Strong", value: strongPercent },
    { name: "Weak", value: weakPercent }
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-8 py-10 text-slate-100">

      <h1 className="text-3xl font-bold">Vocab Profile</h1>
      <p className="text-slate-400 mt-2 mb-6">
        Your vocabulary performance dashboard
      </p>

      <TabGroup
        tabs={[
          { label: "Overview", value: "overview" },
          { label: "Strength", value: "strength" },
          { label: "Discipline", value: "discipline" },
          { label: "Revision", value: "revision" },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* ================= OVERVIEW ================= */}
      {activeTab === "overview" && (
        <div className="mt-8 grid md:grid-cols-2 gap-8">

          {/* RETENTION RADIAL */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-6">
              Retention Health
            </h3>

            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={retentionData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
  dataKey="value"
  cornerRadius={10}
  fill={
    retentionPercent < 40
      ? "#ef4444"
      : retentionPercent < 70
      ? "#f97316"
      : "#22c55e"
  }
/>
              </RadialBarChart>
            </ResponsiveContainer>

            <p className="text-3xl font-bold mt-4">
              {retentionPercent}%
            </p>

            <p className="text-slate-400 text-sm mt-3 text-center max-w-xs">
  {retentionMessage}
</p>
          </div>

          {/* WEEKLY BAR CHART */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <h3 className="text-lg font-semibold mb-6">
              Weekly Accuracy
            </h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="accuracy" radius={[6,6,0,0]}>
  {weeklyData.map((entry, index) => (
    <Cell
      key={index}
      fill={
        entry.accuracy < 40
          ? "#ef4444"
          : entry.accuracy < 70
          ? "#f97316"
          : "#22c55e"
      }
    />
  ))}
</Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-slate-400 text-sm mt-4">
  {weeklyData.length >= 2 &&
    weeklyData[weeklyData.length - 1].accuracy >
      weeklyData[weeklyData.length - 2].accuracy
      ? "Your accuracy is improving this week."
      : "Your weekly accuracy needs more consistency."}
</p>
          </div>

        </div>
      )}

      {/* ================= STRENGTH ================= */}
      {activeTab === "strength" && (
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-8">

          <h3 className="text-xl font-semibold mb-6">
            Strength Distribution
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={strengthData}
                dataKey="value"
                outerRadius={120}
                label
              >
                
                {strengthData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
           
          </ResponsiveContainer>
           <p className="text-slate-400 text-sm mt-6 text-center">
  {strengthMessage}
</p>

          {weakWords.length > 0 && (
            <button
              onClick={() => setShowWeakWords(v => !v)}
              className="mt-6 px-4 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition"
            >
              {showWeakWords ? "Hide Weak Words" : "View Weak Words"}
            </button>
          )}

          {showWeakWords && (
            <div className="mt-6 space-y-2">
              {weakWords.map(w => (
                <div
                  key={w.word}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm"
                >
                  <b>{w.word}</b> — {w.correct_attempts || 0}/{w.total_attempts || 0}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= DISCIPLINE ================= */}
      {activeTab === "discipline" && (
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-8 grid grid-cols-3 gap-6">

          <StatBox label="Active (0–2 days)" value={
            words.filter(w => {
              if (!w.last_reviewed_at) return false;
              const diff = (new Date() - new Date(w.last_reviewed_at)) / (1000*60*60*24);
              return diff <= 2;
            }).length
          } />

          <StatBox label="Slipping (3–6 days)" value={
            words.filter(w => {
              if (!w.last_reviewed_at) return false;
              const diff = (new Date() - new Date(w.last_reviewed_at)) / (1000*60*60*24);
              return diff > 2 && diff <= 6;
            }).length
          } />

          <StatBox label="Cold (7+ days)" value={
            words.filter(w => {
              if (!w.last_reviewed_at) return true;
              const diff = (new Date() - new Date(w.last_reviewed_at)) / (1000*60*60*24);
              return diff > 6;
            }).length
          } />

          <p className="text-slate-400 text-sm mt-6 col-span-3 text-center">
  {disciplineMessage}
</p>

        </div>
      )}

     {/* ================= REVISION ================= */}
      {activeTab === "revision" && (
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-8">

          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              Revision Queue
            </h3>

            <span className="text-sm text-slate-400">
              {weakWords.length} weak words
            </span>
          </div>

          {weakWords.length === 0 ? (
            <p className="text-emerald-400">
              🎉 No urgent revision needed.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {weakWords
                .sort((a, b) => {
                  const aAcc = a.total_attempts
                    ? a.correct_attempts / a.total_attempts
                    : 0;
                  const bAcc = b.total_attempts
                    ? b.correct_attempts / b.total_attempts
                    : 0;
                  return aAcc - bAcc; // Most weak first
                })
                .map(w => {
                  const attempts = w.total_attempts || 0;
                  const correct = w.correct_attempts || 0;
                  const percent = attempts
                    ? Math.round((correct / attempts) * 100)
                    : 0;

                  return (
  <div
    key={w.word}
    className="bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:border-red-500/60 transition"
  >

    <div className="flex justify-between items-center mb-3">
      <h4 className="text-lg font-semibold">
        {w.word}
      </h4>

      {percent < 40 && (
        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
          Critical
        </span>
      )}
    </div>

    {/* Progress */}
    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full transition-all duration-500"
        style={{
          width: `${percent}%`,
          background:
            percent < 40
              ? "#ef4444"
              : percent < 70
              ? "#f97316"
              : "#22c55e"
        }}
      />
    </div>

    <div className="flex justify-between text-xs text-slate-400 mt-3">
      <span>{correct}/{attempts}</span>
      <span>{percent}% accuracy</span>
    </div>

    {/* REVIEW TOGGLE */}
    <button
      onClick={() =>
        setExpandedWord(
          expandedWord === w.word ? null : w.word
        )
      }
      className="mt-4 w-full bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-xl py-2 text-sm hover:bg-blue-500/30 transition"
    >
      {expandedWord === w.word ? "Hide" : "Review"}
    </button>

    {/* EXPANDED CONTENT */}
    {expandedWord === w.word && (
      <div className="mt-5 pt-4 border-t border-slate-700 space-y-3 text-sm">

        <p>
          <span className="text-slate-400">Meaning:</span>{" "}
          {w.meaning || "Not available"}
        </p>

        <p>
          <span className="text-slate-400">Usage:</span>{" "}
          {w.usage || "Not available"}
        </p>

        <p>
          <span className="text-slate-400">Root:</span>{" "}
          {w.root || "Not available"}
        </p>

        <p>
          <span className="text-slate-400">Synonyms:</span>{" "}
         {Array.isArray(w.synonyms)
  ? w.synonyms.join(", ")
  : w.synonyms || "—"}
        </p>

        <p>
          <span className="text-slate-400">Antonyms:</span>{" "}
         {Array.isArray(w.antonyms)
  ? w.antonyms.join(", ")
  : w.antonyms || "—"}
        </p>

      </div>
    )}

  </div>
);
                })}

            </div>
          )}
        </div>
      )}

    </div>
  );
}
/* SMALL STAT COMPONENT */

function StatBox({ label, value }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}