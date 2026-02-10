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

export default function HomeView({ setView, startAdaptiveRC }) {
  return (
    <div style={wrap}>
      <div style={panel}>
        {/* Header */}
        <h1 style={title}>Good morning, Neeraj 👋</h1>
        <p style={subtitle}>Ready for RC practice?</p>

        {/* Today’s Focus */}
        <div style={focusCard}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Target size={18} />
                <b>Today’s Focus</b>
              </div>
              <div style={muted}>Adaptive RC – Passage 1</div>
            </div>

            <button
              style={{ ...pillBtn, background: "#f59e0b" }}
              onClick={() => {
                setView("rc");
                startAdaptiveRC();
              }}
            >
              Start →
            </button>
          </div>

          <div style={barOuter}>
            <div style={barInner} />
          </div>

          <div style={smallMuted}>Progress: 1 / 3 RCs</div>
        </div>

        {/* Training Modes */}
        <h3 style={sectionTitle}>Training Modes</h3>

        <div style={grid}>
          <CenteredCard
            icon={<Brain color="#fff" />}
            title="Adaptive RC Flow"
            desc="Sharpen RC skills intelligently"
            cta="Start Adaptive RC"
            color="#4f7cff"
            onClick={() => {
              setView("rc");
              startAdaptiveRC();
            }}
          />

          <CenteredCard
            icon={<BookOpen color="#fff" />}
            title="Vocabulary Lab"
            desc="Improve vocabulary for CAT"
            cta="Practice Vocabulary"
            color="#f59e0b"
            onClick={() => setView("vocab")}
          />

          <CenteredCard
            icon={<Timer color="#fff" />}
            title="Speed Reading Gym"
            desc="Boost reading speed & focus"
            cta="Start Speed Drill"
            color="#22c55e"
            onClick={() => setView("speed")}
          />

          <CenteredCard
            icon={<BarChart3 color="#fff" />}
            title="Analytics"
            desc="Track RC accuracy & patterns"
            cta="View RC Profile"
            color="#6366f1"
            onClick={() => setView("rc")}
          />
        </div>

        {/* CAT RC Arena */}
        <div style={arenaCard}>
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ ...iconBox, background: "#6366f1" }}>
              <GraduationCap color="#fff" />
            </div>
            <div>
              <b>CAT RC Arena</b>
              <div style={{ ...muted, fontSize: 13 }}>
                Full-length RC sectionals
              </div>
            </div>
          </div>

          <button
            style={{ ...pillBtn, background: "#6366f1" }}
            onClick={() => setView("cat")}
          >
            Take 40-Min Test →
          </button>
        </div>

        {/* Why This Works */}
        <div style={why}>
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Lightbulb size={20} />
            Why This Works
          </h3>
          <ul>
            <li>Guided RC flow — no random practice.</li>
            <li>Daily completion targets keep momentum.</li>
            <li>Skill progression tracked over time.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENT ================= */

function CenteredCard({ icon, title, desc, cta, color, onClick }) {
  return (
    <div style={cCard} onClick={onClick}>
      <div style={{ ...iconCircle, background: color }}>{icon}</div>

      <h4 style={{ marginTop: 10 }}>{title}</h4>
      <p style={cardDesc}>{desc}</p>

      <button style={{ ...cardBtn, background: color }}>
        {cta} →
      </button>
    </div>
  );
}

/* ================= STYLES ================= */

const wrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  paddingTop: 16,
  background: "linear-gradient(180deg,#f0f9ff,#e0f2fe)",
};

const panel = {
  width: "100%",
  maxWidth: 720,
  padding: "16px 16px 90px",
};

const title = { fontSize: 26, fontWeight: 800 };
const subtitle = { color: "#475569", marginBottom: 18 };

const sectionTitle = {
  marginTop: 24,
  marginBottom: 12,
  color: "#334155",
};

/* Focus Card */
const focusCard = {
  background: "#fff",
  borderRadius: 18,
  padding: "12px 14px",
  border: "3px solid #1e3a8a",
  boxShadow: "0 10px 24px rgba(0,0,0,0.1)",
};

const barOuter = {
  height: 7,
  background: "#e5e7eb",
  borderRadius: 6,
  marginTop: 10,
};

const barInner = {
  height: "100%",
  width: "33%",
  background: "#f59e0b",
  borderRadius: 6,
};

const smallMuted = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 4,
};

/* Grid */
const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

/* Centered Cards */
const cCard = {
  background: "#fff",
  borderRadius: 18,
  padding: "18px 14px",
  boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minHeight: 220,
};

const iconCircle = {
  width: 48,
  height: 48,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardDesc = {
  fontSize: 13,
  color: "#64748b",
  textAlign: "center",
  marginTop: 6,
};

const cardBtn = {
  marginTop: "auto",
  padding: "10px 14px",
  borderRadius: 10,
  color: "#fff",
  border: "none",
  fontWeight: 600,
  width: "100%",
};

/* Arena */
const arenaCard = {
  marginTop: 24,
  background: "#fff",
  borderRadius: 20,
  padding: "22px 18px",
  boxShadow: "0 10px 24px rgba(0,0,0,0.1)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const pillBtn = {
  padding: "10px 16px",
  borderRadius: 999,
  color: "#fff",
  border: "none",
  fontWeight: 600,
};

const muted = {
  color: "#64748b",
};

/* Why */
const why = {
  marginTop: 26,
  background: "#dbeafe",
  borderRadius: 18,
  padding: 18,
  border: "2px solid #2563eb",
  color: "#1e3a8a",
  boxShadow: "0 8px 20px rgba(37,99,235,0.25)",
};
