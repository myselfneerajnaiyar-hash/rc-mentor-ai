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
        {/* Header */}
        <h1 style={title}>AuctorRC</h1>
        <p style={subtitle}>Train clarity. One RC at a time.</p>

        {/* Today’s Focus */}
        <div style={focusCard}>
          <div style={focusRow}>
            <div>
              <div style={focusTitle}>
                <Target size={18} /> Today’s Focus
              </div>
              <p style={muted}>Adaptive RC – Passage 1</p>
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

          <p style={smallMuted}>Progress: 1 / 3 RCs</p>
        </div>

        {/* Training Modes */}
        <h3 style={sectionTitle}>Training Modes</h3>

        <div style={twoCol}>
          <HorizontalCard
            icon={<Brain size={22} />}
            title="Adaptive RC Flow"
            desc="Sharpen RC skills intelligently"
            color="#4f7cff"
            cta="Start Adaptive RC"
            onClick={() => {
              setView("rc");
              startAdaptiveRC();
            }}
          />

          <HorizontalCard
            icon={<BookOpen size={22} />}
            title="Vocabulary Lab"
            desc="Words that actually matter for CAT"
            color="#f59e0b"
            cta="Practice Vocabulary"
            onClick={() => setView("vocab")}
          />
        </div>

        <div style={twoCol}>
          <HorizontalCard
            icon={<Timer size={22} />}
            title="Speed Reading Gym"
            desc="Boost reading speed & focus"
            color="#22c55e"
            cta="Start Speed Drill"
            onClick={() => setView("speed")}
          />

          <HorizontalCard
            icon={<BarChart3 size={22} />}
            title="Analytics"
            desc="Track RC accuracy & patterns"
            color="#6366f1"
            cta="View Profile"
            onClick={() => setView("rc-profile")}
          />
        </div>

        {/* CAT Arena */}
        <div style={{ marginTop: 20 }}>
          <HorizontalCard
            icon={<GraduationCap size={22} />}
            title="CAT RC Arena"
            desc="Full-length RC sectionals"
            color="#4f46e5"
            cta="Take 40-Min Test"
            full
            onClick={() => setView("cat")}
          />
        </div>

        {/* Why This Works */}
        <div style={why}>
          <h3>Why This Works</h3>
          <ul>
            <li>You don’t fail CAT because of vocabulary.</li>
            <li>You fail by misreading logic and traps.</li>
            <li>AuctorRC trains how you think.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ================= CARD ================= */

function HorizontalCard({ icon, title, desc, cta, color, onClick, full }) {
  return (
    <div
      style={{
        ...hCard,
        gridColumn: full ? "1 / -1" : "auto",
      }}
      onClick={onClick}
    >
      <div style={cardLeft}>
        <div style={{ ...iconBox, background: color }}>{icon}</div>
        <div>
          <h4 style={{ margin: 0 }}>{title}</h4>
          <p style={muted}>{desc}</p>
        </div>
      </div>

      <button
        style={{
          ...hBtn,
          background: color,
        }}
      >
        {cta} →
      </button>
    </div>
  );
}

/* ================= STYLES ================= */

const wrap = {
  minHeight: "100vh",
  background: "#f0f9ff",
};

const panel = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "20px 16px 110px",
};

const title = { fontSize: 28, fontWeight: 800 };
const subtitle = { color: "#475569", marginBottom: 20 };

const sectionTitle = {
  marginTop: 24,
  marginBottom: 10,
  color: "#334155",
};

const muted = {
  color: "#64748b",
  fontSize: 14,
  margin: "4px 0",
};

const smallMuted = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 6,
};

const focusCard = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  marginBottom: 24,
};

const focusRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const focusTitle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontWeight: 600,
};

const focusBtn = {
  background: "#f59e0b",
  border: "none",
  color: "#fff",
  padding: "8px 14px",
  borderRadius: 10,
  fontWeight: 600,
  cursor: "pointer",
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

const twoCol = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
  marginBottom: 14,
};

const hCard = {
  background: "#ffffff",
  borderRadius: 16,
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
  cursor: "pointer",
};

const cardLeft = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const iconBox = {
  width: 40,
  height: 40,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
};

const hBtn = {
  border: "none",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 10,
  fontWeight: 600,
};

const why = {
  marginTop: 30,
  background: "rgba(255,255,255,0.7)",
  borderRadius: 14,
  padding: 16,
  fontSize: 14,
  color: "#475569",
};
