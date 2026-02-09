"use client";
import { useState } from "react";
import SpeedGym from "./SpeedGym";
import SpeedDashboard from "./SpeedDashboard";

export default function SpeedContainer() {
  const [tab, setTab] = useState("drill"); // drill | profile

  return (
    <div style={page}>
      {/* ===== HEADER ===== */}
      <h1 style={title}>Speed Reading Gym</h1>
      <p style={subtitle}>
        Train how fast you read without losing meaning.
      </p>

      {/* ===== TABS ===== */}
      <div style={tabs}>
        {["drill", "profile"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 999,
              border: "none",
              background: tab === t ? "#2563eb" : "#e5e7eb",
              color: tab === t ? "#ffffff" : "#334155",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t === "drill" ? "Speed Drill" : "Speed Profile"}
          </button>
        ))}
      </div>

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
  background: "#f8fafc",
  padding: "20px 16px 90px", // space for bottom nav
};

const title = {
  fontSize: 26,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 4,
};

const subtitle = {
  fontSize: 14,
  color: "#475569",
  marginBottom: 16,
};

const tabs = {
  display: "flex",
  gap: 10,
  background: "#e5e7eb",
  padding: 6,
  borderRadius: 999,
  marginBottom: 20,
};

const contentCard = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
};
