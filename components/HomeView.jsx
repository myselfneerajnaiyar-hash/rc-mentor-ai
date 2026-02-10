"use client";

import {
  BookOpen,
  Brain,
  Timer,
  BarChart3,
  GraduationCap,
  Target,
} from "lucide-react";

export default function HomeView({ setView, startAdaptiveRC }) {
  return (
    <div style={wrap}>
      <div style={panel}>
        {/* Greeting */}
        <h1 style={title}>Good morning, Neeraj 👋</h1>
        <p style={subtitle}>Ready for RC practice?</p>

        {/* Today’s Focus */}
        <div style={focusCard}>
          <div style={focusHeader}>
            <div style={focusLeft}>
              <Target size={20} />
              <div>
                <strong>Today’s Focus</strong>
                <div style={muted}>Adaptive RC – Passage 1</div>
              </div>
            </div>

            <button
              style={focusBtn}
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
          <VerticalCard
            icon={<Brain size={26} />}
            title="Adaptive RC Flow"
            desc="Sharpen RC skills intelligently"
            color="#4f7cff"
            cta="Start Adaptive RC"
            onClick={() => {
              setView("rc");
              startAdaptiveRC();
            }}
          />

          <VerticalCard
            icon={<BookOpen size={26} />}
            title="Vocabulary Lab"
            desc="Improve vocabulary for CAT"
            color="#f59e0b"
            cta="Practice Vocabulary"
            onClick={() => setView("vocab")}
          />

          <VerticalCard
            icon={<Timer size={26} />}
            title="Speed Reading Gym"
            desc="Boost reading speed & focus"
            color="#22c55e"
            cta="Start Speed Drill"
            onClick={() => setView("speed")}
          />

          <VerticalCard
            icon={<BarChart3 size={26} />}
            title="Analytics"
            desc="Track RC accuracy & patterns"
            color="#6366f1"
            cta="View RC Profile"
            onClick={() => setView("rc-profile")}
          />
        </div>

        {/* CAT RC Arena */}
        <div style={arenaCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ ...iconBox, background: "#4f46e5" }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <strong>CAT RC Arena</strong>
              <div style={muted}>Take full-length RC sectionals</div>
            </div>
          </div>

          <button
            style={{ ...arenaBtn }}
            onClick={() => setView("cat")}
          >
            Take 40-Min Test →
          </button>
        </div>

        {/* Why This Works */}
        <div style={why}>
          <h3>Why This Works</h3>
          <ul>
            <li>Most CAT aspirants misinterpret RC logic.</li>
            <li>Builds logical thinking, not rote learning.</li>
            <li>Tracks progress over time.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function VerticalCard({ icon, title, desc, cta, color, onClick }) {
  return (
    <div style={vCard} onClick={onClick}>
      <div style={{ ...iconBox, background: color }}>{icon}</div>
      <h4>{title}</h4>
      <p style={muted}>{desc}</p>
      <button style={{ ...vBtn, background: color }}>{cta} →</button>
    </div>
  );
}

/* ================= STYLES ================= */

const wrap = { background: "#f0f9ff", minHeight: "100vh" };

const panel = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "20px 16px 110px",
};

const title = { fontSize: 26, fontWeight: 800 };
const subtitle = { color: "#475569", marginBottom: 16 };

const sectionTitle = { margin: "24px 0 12px", color: "#334155" };

const muted = { color: "#64748b", fontSize: 14 };
const smallMuted = { fontSize: 12, color: "#64748b", marginTop: 6 };

const focusCard = {
  background: "#fff",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
};

const focusHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const focusLeft = { display: "flex", gap: 10, alignItems: "center" };

const focusBtn = {
  background: "#f59e0b",
  border: "none",
  color: "#fff",
  padding: "8px 14px",
  borderRadius: 10,
  fontWeight: 600,
};

const barOuter = {
  height: 8,
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

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const vCard = {
  background: "#fff",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const vBtn = {
  marginTop: "auto",
  border: "none",
  color: "#fff",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 600,
};

const iconBox = {
  width: 42,
  height: 42,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
};

const arenaCard = {
  marginTop: 20,
  background: "#fff",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const arenaBtn = {
  background: "#4f46e5",
  border: "none",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 600,
};

const why = {
  marginTop: 24,
  background: "rgba(255,255,255,0.7)",
  borderRadius: 16,
  padding: 16,
  color: "#475569",
};
