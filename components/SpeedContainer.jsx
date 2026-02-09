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
  background: "linear-gradient(180deg, #f8fafc, #eef2ff)",
  padding: "16px 16px 90px",
};

const header = {
  background: "#ffffff",
  borderRadius: 20,
  padding: 18,
  boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
};

const title = {
  fontSize: 26,
  fontWeight: 800,
  color: "#0f172a",
};

const subtitle = {
  color: "#475569",
  fontSize: 14,
  marginBottom: 14,
};

const tabs = {
  display: "flex",
  gap: 8,
  background: "#e5e7eb",
  padding: 6,
  borderRadius: 999,
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
  background: "#eef2ff",
  borderRadius: 12,
  padding: "10px 14px",
};

const drillCard = {
  marginTop: 18,
  background: "linear-gradient(180deg, #ecfeff, #ffffff)",
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
  background: "#f1f5f9",
  padding: 10,
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 600,
};

const ctaRow = {
  marginTop: 18,
  display: "flex",
  justifyContent: "center",
};

const startBtn = {
  background: "#22c55e",
  color: "#ffffff",
  border: "none",
  padding: "12px 26px",
  borderRadius: 14,
  fontWeight: 800,
  cursor: "pointer",
};

const profileCard = {
  marginTop: 18,
  background: "#ffffff",
  borderRadius: 22,
  padding: 20,
};
