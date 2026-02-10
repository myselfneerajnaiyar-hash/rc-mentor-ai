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
          <VerticalCard
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

          <VerticalCard
            icon={<BookOpen color="#fff" />}
            title="Vocabulary Lab"
            desc="Improve vocabulary for CAT"
            cta="Practice Vocabulary"
            color="#f59e0b"
            onClick={() => setView("vocab")}
          />

          <VerticalCard
            icon={<Timer color="#fff" />}
            title="Speed Reading Gym"
            desc="Boost reading speed & focus"
            cta="Start Speed Drill"
            color="#22c55e"
            onClick={() => setView("speed")}
          />

          <VerticalCard
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
            <li>Most CAT aspirants misinterpret RC logic.</li>
            <li>Builds logical thinking, not rote learning.</li>
            <li>Tracks progress over time.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENT ================= */

function VerticalCard({ icon, title, desc, cta, color, onClick }) {
  return (
    <div style={vCard} onClick={onClick}>
      <h4>{title}</h4>

      <div style={{ ...iconBox, background: color }}>
        {icon}
      </div>

      <p style={{ ...muted, fontSize: 13 }}>{desc}</p>

      <button style={{ ...vBtn, background: color }}>
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
  border: "2.5px solid #1e3a8a",
  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
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

/* Cards */
const vCard = {
  background: "#fff",
  borderRadius: 18,
  padding: 14,
  boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const iconBox = {
  width: 42,
  height: 42,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const muted = {
  color: "#64748b",
};

const vBtn = {
  marginTop: 6,
  padding: "10px 12px",
  borderRadius: 10,
  color: "#fff",
  border: "none",
  fontWeight: 600,
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

/* Why */
const why = {
  marginTop: 26,
  background: "#e0edff",
  borderRadius: 18,
  padding: 18,
  color: "#1e3a8a",
};
