"use client";
import { useState } from "react";
import SpeedGym from "./SpeedGym";
import SpeedDashboard from "./SpeedDashboard";

export default function SpeedContainer() {
  const [tab, setTab] = useState("drill"); // drill | profile

  return (
    <div style={page}>
      {/* HEADER */}
      <div style={header}>
        <h1 style={title}>Speed Reading Gym</h1>
        <p style={subtitle}>
          Train how fast you read without losing meaning.
        </p>

        {/* TABS */}
        <div style={tabs}>
          {["drill", "profile"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...tabBtn,
                ...(tab === t ? tabActive : {})
              }}
            >
              {t === "drill" ? "Speed Drill" : "Speed Profile"}
            </button>
          ))}
        </div>

        {/* INFO STRIP */}
        <div style={infoStrip}>
          ⏱️ 3–5 min drills · 🎯 Eye-span & focus · 📈 Progress tracked
        </div>
      </div>

      {/* CONTENT AREA */}
      <div style={content}>
        {tab === "drill" && <SpeedGym />}
        {tab === "profile" && <SpeedDashboard />}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const page = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc, #eef2ff)",
  padding: "16px 16px 80px",
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
  marginBottom: 4,
};

const subtitle = {
  color: "#475569",
  fontSize: 14,
  marginBottom: 14,
};

const tabs = {
  display: "flex",
  gap: 10,
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

const content = {
  marginTop: 16,
};
