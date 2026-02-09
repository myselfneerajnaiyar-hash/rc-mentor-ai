"use client";
import { useState } from "react";
import SpeedGym from "./SpeedGym";
import SpeedDashboard from "./SpeedDashboard";

export default function SpeedContainer() {
  const [tab, setTab] = useState("drill"); // drill | profile
  const [started, setStarted] = useState(false);

  return (
    <div style={page}>
      {/* ================= HEADER ================= */}
      <div style={header}>
        <h1 style={title}>Speed Reading Gym</h1>
        <p style={subtitle}>
          Train how fast you read without losing meaning.
        </p>

        {/* TABS */}
        <div style={tabs}>
          <button
            onClick={() => {
              setTab("drill");
              setStarted(false); // reset when coming back
            }}
            style={{ ...tabBtn, ...(tab === "drill" ? tabActive : {}) }}
          >
            Speed Drill
          </button>
          <button
            onClick={() => setTab("profile")}
            style={{ ...tabBtn, ...(tab === "profile" ? tabActive : {}) }}
          >
            Speed Profile
          </button>
        </div>

        {/* INFO STRIP */}
        <div style={infoStrip}>
          ⏱️ 3–5 min drills · 🎯 Eye-span & focus · 📈 Progress tracked automatically
        </div>
      </div>

      {/* ================= CONTENT ================= */}

      {/* ---------- DRILL TAB ---------- */}
      {tab === "drill" && (
        <>
          {!started ? (
            /* ===== INTRO CARD ===== */
            <div style={drillCard}>
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

             {/* CTA OR DRILL */}
{!started ? (
  <div style={ctaRow}>
    <button
      style={startBtn}
      onClick={() => setStarted(true)}
    >
      Start Drill
    </button>
  </div>
) : (
  <div style={{ marginTop: 20 }}>
    <SpeedGym />
  </div>
)}
        </>
      )}

      {/* ---------- PROFILE TAB ---------- */}
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
  marginTop: 4,
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
  color: "#334155",
  cursor: "pointer",
};

const tabActive = {
  background: "#2563eb",
  color: "#ffffff",
};

const infoStrip = {
  marginTop: 12,
  fontSize: 13,
  color: "#475569",
  background: "#eef2ff",
  borderRadius: 12,
  padding: "10px 14px",
};

/* ================= DRILL CARD ================= */

const drillCard = {
  marginTop: 18,
  background: "linear-gradient(180deg, #ecfeff, #ffffff)",
  borderRadius: 22,
  padding: 22,
  boxShadow: "0 15px 30px rgba(0,0,0,0.08)",
};

const sectionTitle = {
  fontSize: 20,
  fontWeight: 800,
  marginBottom: 12,
  color: "#0f172a",
};

const steps = {
  paddingLeft: 18,
  color: "#334155",
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
  color: "#0f172a",
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
  fontSize: 15,
  cursor: "pointer",
};

/* ================= PROFILE ================= */

const profileCard = {
  marginTop: 18,
  background: "#ffffff",
  borderRadius: 22,
  padding: 20,
  boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
};
