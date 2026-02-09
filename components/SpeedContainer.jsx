"use client";
import { useState } from "react";
import SpeedGym from "./SpeedGym";
import SpeedDashboard from "./SpeedDashboard";

export default function SpeedContainer() {
  const [tab, setTab] = useState("drill"); // drill | profile

  return (
    <div style={page}>
      {/* ===== HEADER ===== */}
      <div style={header}>
        <h1 style={title}>Speed Reading Gym</h1>
        <p style={subtitle}>
          Train how fast you read without losing meaning.
        </p>
      </div>

      {/* ===== TAB BAR ===== */}
      <div style={tabsWrapper}>
        <div style={tabs}>
          {["drill", "profile"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...tabBtn,
                ...(tab === t ? tabActive : {}),
              }}
            >
              {t === "drill" ? "Speed Drill" : "Speed Profile"}
            </button>
          ))}
        </div>
      </div>

      {/* ===== DIVIDER ===== */}
      <div style={divider} />

      {/* ===== CONTENT ===== */}
      <div style={contentCard}>
        {tab === "drill" && <SpeedGym />}
        {tab === "profile" && <SpeedDashboard />}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const page = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
  padding: "16px 14px 90px",
};

const header = {
  marginBottom: 14,
};

const title = {
  fontSize: 24,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 4,
};

const subtitle = {
  fontSize: 14,
  color: "#475569",
};

const tabsWrapper = {
  marginTop: 12,
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
  color: "#334155",
  fontWeight: 700,
  cursor: "pointer",
};

const tabActive = {
  background: "#2563eb",
  color: "#ffffff",
  boxShadow: "0 4px 10px rgba(37,99,235,0.35)",
};

const divider = {
  height: 1,
  background: "linear-gradient(to right, transparent, #c7d2fe, transparent)",
  margin: "16px 0",
};

const contentCard = {
  background: "#ffffff",
  borderRadius: 20,
  padding: 16,
  boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
};
