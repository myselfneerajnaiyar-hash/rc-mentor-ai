"use client";

import {
  Brain,
  BookOpen,
  Timer,
  BarChart3,
  GraduationCap,
  Target,
  Lightbulb,
} from "lucide-react";

/* ---------- Time-based greeting ---------- */
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning 🌅";
  if (h >= 12 && h < 17) return "Good afternoon ☀️";
  if (h >= 17 && h < 22) return "Good evening 🌙";
  return "Good night 🌌";
}

export default function HomeView({ setView, startAdaptiveRC, userName }) {
  return (
    <div style={wrap}>
      <div style={panel}>
        {/* Header */}
        <h1 style={title}>
         {getGreeting()}, {userName || "Champion"} 👋
        </h1>
        <p style={subtitle}>Ready for RC practice?</p>

        {/* Today’s Focus */}
        <div style={focusCard}>
          <div style={focusHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Target size={18} />
              <b>Today’s Focus</b>
            </div>
            <button style={focusBtn} onClick={startAdaptiveRC}>
              Start →
            </button>
          </div>

          <p style={{ marginTop: 6, color: "#475569" }}>
            Adaptive RC – Passage 1
          </p>

          <div style={barOuter}>
            <div style={barInner} />
          </div>

          <p style={microFeedback}>You’re on track for today’s target</p>
        </div>

        {/* Training Modes */}
        <h3 style={sectionTitle}>Training Modes</h3>

        <div style={grid}>
          <ModeCard
            icon={<Brain />}
            title="Adaptive RC Flow"
            desc="Sharpen RC skills intelligently"
            color="#4f7cff"
            button="Start Adaptive RC"
            onClick={() => {
              setView("rc");
              startAdaptiveRC();
            }}
          />

          <ModeCard
            icon={<BookOpen />}
            title="Vocabulary Lab"
            desc="Improve vocabulary for CAT"
            color="#f59e0b"
            button="Practice Vocabulary"
            onClick={() => setView("vocab")}
          />

          <ModeCard
            icon={<Timer />}
            title="Speed Reading Gym"
            desc="Boost reading speed & focus"
            color="#22c55e"
            button="Start Speed Drill"
            onClick={() => setView("speed")}
          />

          <ModeCard
            icon={<BarChart3 />}
            title="Analytics"
            desc="Accuracy · Speed · Trends"
            color="#6366f1"
            button="View RC Profile"
            onClick={() => setView("rc")}
          />
        </div>

        {/* CAT RC Arena */}
        <div style={catCard}>
          <div style={catLeft}>
            <div style={{ ...iconBox, background: "#6366f1" }}>
              <GraduationCap color="#fff" />
            </div>
            <div>
              <b>CAT RC Arena</b>
              <p style={catSub}>Full-length RC sectionals</p>
            </div>
          </div>

          <button
            style={{ ...primaryBtn, background: "#6366f1", width: 180 }}
            onClick={() => setView("cat")}
          >
            Start CAT Sectional →
          </button>
        </div>

        {/* Why This Works */}
        <div style={whyCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Lightbulb />
            <b>Why This Works</b>
          </div>

          <ul style={whyList}>
            <li>
              <b>Guided RC flow</b> — no random practice
            </li>
            <li>
              <b>Daily completion targets</b> maintain momentum
            </li>
            <li>
              <b>Skill progression</b> tracked over time
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---------- Reusable Mode Card ---------- */
function ModeCard({ icon, title, desc, color, button, onClick }) {
  return (
    <div style={modeCard}>
      <div style={{ ...iconBox, background: color }}>{icon}</div>
      <h4>{title}</h4>
      <p style={descText}>{desc}</p>
      <button
        style={{ ...primaryBtn, background: color, marginTop: "auto" }}
        onClick={onClick}
      >
        {button} →
      </button>
    </div>
  );
}

/* ---------- Styles ---------- */

const wrap = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f0f9ff, #e0f2fe)",
};

const panel = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "20px 16px 120px",
};

const title = { fontSize: 28, fontWeight: 800 };
const subtitle = { color: "#475569", marginBottom: 20 };

const sectionTitle = {
  marginTop: 24,
  marginBottom: 12,
  fontSize: 18,
  fontWeight: 700,
};

/* Focus */
const focusCard = {
  border: "3px solid #1e3a8a",
  borderRadius: 20,
  padding: 16,
  background: "#fff",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
};

const focusHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const focusBtn = {
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  padding: "8px 16px",
  borderRadius: 999,
  fontWeight: 600,
};

const microFeedback = {
  marginTop: 8,
  fontSize: 13,
  color: "#16a34a",
};

/* Grid */
const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const modeCard = {
  background: "#fff",
  borderRadius: 20,
  padding: 18,
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  minHeight: 220,
};

const iconBox = {
  width: 48,
  height: 48,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 10,
};

const descText = {
  color: "#475569",
  fontSize: 14,
  marginBottom: 12,
};

/* Buttons */
const primaryBtn = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "none",
  color: "#fff",
  fontWeight: 600,
};

/* CAT */
const catCard = {
  marginTop: 24,
  background: "#fff",
  borderRadius: 22,
  padding: 20,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  minHeight: 110,
  boxShadow: "0 12px 28px rgba(0,0,0,0.1)",
};

const catLeft = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const catSub = {
  fontSize: 13,
  color: "#475569",
};

/* Progress bar */
const barOuter = {
  height: 8,
  background: "#e5e7eb",
  borderRadius: 6,
  marginTop: 10,
};

const barInner = {
  width: "33%",
  height: "100%",
  background: "#f59e0b",
  borderRadius: 6,
};

/* Why */
const whyCard = {
  marginTop: 24,
  background: "#dbeafe",
  border: "3px solid #2563eb",
  borderRadius: 20,
  padding: 18,
};

const whyList = {
  marginTop: 10,
  paddingLeft: 18,
  lineHeight: 1.6,
};
