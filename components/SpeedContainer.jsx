"use client";
import { useState } from "react";
import SpeedGym from "./SpeedGym";
import SpeedDashboard from "./SpeedDashboard";

export default function SpeedContainer() {
  const [tab, setTab] = useState("drill"); // drill | profile

  return (
    <div style={{ padding: 20 }}>
      <h1>Speed Gym</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {["drill", "profile"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: tab === t ? "#2563eb" : "#f3f4f6",
              color: tab === t ? "#fff" : "#111",
              fontWeight: 600,
            }}
          >
            {t === "drill" ? "Speed Drill" : "Speed Profile"}
          </button>
        ))}
      </div>

      {tab === "drill" && <SpeedGym />}
      {tab === "profile" && <SpeedDashboard />}
    </div>
  );
}
