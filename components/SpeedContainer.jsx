"use client";
import { useState } from "react";
import SpeedGym from "./SpeedGym";
import SpeedDashboard from "./SpeedDashboard";
import TabGroup from "./TabGroup";

export default function SpeedContainer() {
  const [tab, setTab] = useState("drill");
  const [started, setStarted] = useState(false);

  return (
    <div style={page}>
      {/* HEADER */}
      <div style={header}>
        <h1 style={title}>Speed Reading Gym</h1>
        <p style={subtitle}>
          Train how fast you read without losing meaning.
        </p>

       <TabGroup
  tabs={[
    { label: "Speed Drill", value: "drill" },
    { label: "Speed Profile", value: "profile" },
  ]}
  active={tab}
  onChange={(val) => {
    setTab(val);
    if (val === "drill") setStarted(false);
  }}
/>

        <div style={infoStrip}>
          ⏱️ 3–5 min drills · 🎯 Eye-span & focus · 📈 Progress tracked automatically
        </div>
      </div>

      {/* CONTENT */}
      {tab === "drill" && (
        <div style={drillCard}>
          {!started ? (
            <>
              <h2 style={sectionTitle}>How the Speed Drill Works</h2>

              <ul style={steps}>
                <li>📄 You read a <b>long passage</b>, one paragraph at a time</li>
                <li>❓ Each paragraph is followed by a <b>focus question</b></li>
                <li>⏱️ You read under <b>gentle time pressure</b></li>
                <li>🧠 This trains <b>eye-span, chunking, and recall</b></li>
              </ul>

              <div style={benefits}>
                <div style={benefitBox}>⚡ Faster reading without panic</div>
                <div style={benefitBox}>🎯 Better retention of key ideas</div>
                <div style={benefitBox}>📈 Speed & accuracy tracked over time</div>
              </div>

              <div style={ctaRow}>
                <button
  onClick={() => setStarted(true)}
  className="mt-6 px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/20"
>
  Start Drill
</button>
              </div>
            </>
          ) : (
            <SpeedGym />
          )}
        </div>
      )}

      {tab === "profile" && (
        <div style={profileCard}>
          <SpeedDashboard />
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

/* ================= DARK PERFORMANCE THEME ================= */

const page = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #0f172a, #0b1220)",
  padding: "clamp(16px, 4vw, 32px)",
  boxSizing: "border-box",
  overflowX: "hidden",
  color: "#e2e8f0",
};

const header = {
  background: "#111827",
  borderRadius: 24,
  padding: "clamp(16px, 4vw, 28px)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
  border: "1px solid #1f2937",
};

const title = {
  fontSize: 32,
  letterSpacing: "-0.5px",
  fontWeight: 800,
  color: "#f8fafc",
};

const subtitle = {
  color: "#94a3b8",
  fontSize: 14,
  marginBottom: 14,
};




const infoStrip = {
  marginTop: 12,
  fontSize: 13,
  background: "#0b1220",
  border: "1px solid #1e293b",
  color: "#94a3b8",
  borderRadius: 12,
  padding: "10px 14px",
};

const drillCard = {
  marginTop: 18,
  background: "#111827",
  boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
  border: "1px solid #1f2937",
  borderRadius: 22,
  padding: "clamp(16px, 4vw, 22px)",
};

const sectionTitle = {
  fontSize: 20,
  fontWeight: 800,
  marginBottom: 12,
  color: "#f8fafc",
};

const steps = {
  paddingLeft: 18,
  fontSize: 14,
  lineHeight: "1.8",
  color: "#cbd5e1",
};

const benefits = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
  marginTop: 16,
};

const benefitBox = {
  background: "#0f172a",
  padding: 14,
  borderRadius: 14,
  fontSize: 13,
  fontWeight: 600,
  border: "1px solid #1e293b",
  color: "#e2e8f0",
};

const ctaRow = {
  marginTop: 18,
  display: "flex",
  justifyContent: "center",
};


const profileCard = {
  marginTop: 18,
  background: "#111827",
  borderRadius: 22,
  padding: "clamp(16px, 4vw, 20px)",
  border: "1px solid #1f2937",
};

