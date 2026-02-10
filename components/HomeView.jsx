"use client";
import {
  BookOpen,
  Timer,
  ListChecks,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

export default function HomeView({ setView, startAdaptiveRC }) {
  return (
    <div style={wrap}>
      <div style={panel}>
        {/* HEADER */}
        <h1 style={title}>AuctorRC</h1>
        <p style={subtitle}>Train clarity. One RC at a time.</p>

        {/* DAILY SNAPSHOT */}
        <div style={snapshot}>
          <div style={snapshotRow}>
            <span>Today</span>
            <b>1 / 3 RCs</b>
          </div>

          <div style={barOuter}>
            <div style={barInner} />
          </div>

          <div style={snapshotRow}>
            <span>Weekly Target</span>
            <span>12 RCs</span>
          </div>

          <div style={snapshotRow}>
            <span>Accuracy</span>
            <span>72%</span>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <Section title="Practice">
          <ActionCard
            icon={<BookOpen />}
            title="Adaptive RC"
            desc="Practice weak RC areas intelligently"
            action="Start RC"
            color="#4f7cff"
            onClick={() => {
              setView("rc");
              startAdaptiveRC();
            }}
          />

          <ActionCard
            icon={<Timer />}
            title="Speed Reading"
            desc="Improve pace without losing meaning"
            action="Start Drill"
            color="#22c55e"
            onClick={() => setView("speed")}
          />
        </Section>

        <Section title="Build Skills">
          <ActionCard
            icon={<ListChecks />}
            title="Vocabulary Lab"
            desc="Words that actually matter for CAT"
            action="Practice Vocab"
            color="#f59e0b"
            onClick={() => setView("vocab")}
          />

          <ActionCard
            icon={<GraduationCap />}
            title="CAT RC Arena"
            desc="Full-length RC sectionals"
            action="Take Test"
            color="#6366f1"
            onClick={() => setView("cat")}
          />
        </Section>

        {/* INSIGHT TEASER */}
        <div style={insight}>
          <TrendingUp size={18} />
          <span>
            You’re strongest in <b>Inference questions</b>.  
            Accuracy drops in <b>Tone-based RCs</b>.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------ COMPONENTS ------------------ */

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={sectionTitle}>{title}</h3>
      <div style={list}>{children}</div>
    </div>
  );
}

function ActionCard({ icon, title, desc, action, color, onClick }) {
  return (
    <div style={card} onClick={onClick}>
      <div style={{ ...iconWrap, background: color }}>{icon}</div>

      <div style={{ flex: 1 }}>
        <b style={{ fontSize: 15 }}>{title}</b>
        <p style={descText}>{desc}</p>
      </div>

      <button style={{ ...btn, background: color }}>
        {action}
      </button>
    </div>
  );
}

/* ------------------ STYLES ------------------ */

const wrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  background: "linear-gradient(180deg, #f0f9ff, #e0f2fe)",
};

const panel = {
  width: "100%",
  maxWidth: 720,
  padding: "20px 16px 100px",
};

const title = { fontSize: 26, fontWeight: 800 };
const subtitle = { fontSize: 14, color: "#475569", marginBottom: 16 };

const snapshot = {
  background: "#fff",
  borderRadius: 16,
  padding: 14,
  marginBottom: 16,
  border: "1px solid #e5e7eb",
};

const snapshotRow = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 13,
  marginBottom: 6,
};

const barOuter = {
  height: 8,
  background: "#e5e7eb",
  borderRadius: 6,
  margin: "8px 0",
};

const barInner = {
  height: "100%",
  width: "33%",
  background: "#f59e0b",
  borderRadius: 6,
};

const sectionTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#334155",
  marginBottom: 8,
};

const list = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const card = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 14,
  background: "#ffffff",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  cursor: "pointer",
};

const iconWrap = {
  width: 40,
  height: 40,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
};

const descText = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 2,
};

const btn = {
  border: "none",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
};

const insight = {
  marginTop: 24,
  padding: 14,
  borderRadius: 14,
  background: "rgba(255,255,255,0.7)",
  fontSize: 13,
  display: "flex",
  gap: 8,
  alignItems: "flex-start",
};
