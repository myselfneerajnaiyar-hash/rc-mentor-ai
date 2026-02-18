"use client";
import { useState } from "react";
import SpeedGym from "./SpeedGym";
import SpeedDashboard from "./SpeedDashboard";

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

        <div style={tabs}>
          <button
            style={{ ...tabBtn, ...(tab === "drill" ? tabActive : {}) }}
            onClick={() => {
              setTab("drill");
              setStarted(false);
            }}
          >
            Speed Drill
          </button>

          <button
            style={{ ...tabBtn, ...(tab === "profile" ? tabActive : {}) }}
            onClick={() => setTab("profile")}
          >
            Speed Profile
          </button>
        </div>

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
                  style={startBtn}
                  onClick={() => setStarted(true)}
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

const page = {
  minHeight: "100vh",
  background: "#dde7fb",
  padding: "32px",
};

const header = {
  background: "#ffffff",
  borderRadius: 24,
  padding: 28,
  boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
  border: "1px solid #e2e8f0",
};

const title = {
  fontSize: 32,
letterSpacing: "-0.5px",

  fontWeight: 800,
  color: "#0f172a",
};

const subtitle = {
  color: "#475569",
  fontSize: 14,
  marginBottom: 14,
};



const tabBtn = {
  flex: 1,
  padding: "10px 0",
  borderRadius: 999,
  border: "none",
  background: "transparent",
  fontWeight: 700,
  cursor: "pointer",
};

const tabActive = {
  background: "#2563eb",
  color: "#ffffff",
};

const infoStrip = {
  marginTop: 12,
  fontSize: 13,
 background: "#f8fafc",
border: "1px solid #e2e8f0",
color: "#334155",
  borderRadius: 12,
  padding: "10px 14px",
};

const drillCard = {
  marginTop: 18,
 background: "#ffffff",
boxShadow: "0 25px 60px rgba(15,23,42,0.06)",
border: "1px solid #e2e8f0",
  borderRadius: 22,
  padding: 22,
};

const sectionTitle = {
  fontSize: 20,
  fontWeight: 800,
  marginBottom: 12,
};

const steps = {
  paddingLeft: 18,
  fontSize: 14,
  lineHeight: "1.8",
};

const benefits = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginTop: 16,
};

const benefitBox = {
  background: "#ffffff",
  padding: 14,
  borderRadius: 14,
  fontSize: 13,
  fontWeight: 600,
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
};

const ctaRow = {
  marginTop: 18,
  display: "flex",
  justifyContent: "center",
};

const startBtn = {
  background: "#16a34a",
  color: "#ffffff",
  border: "none",
  padding: "14px 34px",
  borderRadius: 16,
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
  boxShadow: "0 12px 30px rgba(22,163,74,0.35)",
};

const profileCard = {
  marginTop: 18,
  background: "#ffffff",
  borderRadius: 22,
  padding: 20,
};

const tabs = {
  display: "flex",
  gap: 8,
  background: "#e5e7eb",
  padding: 6,
  borderRadius: 999,
};
