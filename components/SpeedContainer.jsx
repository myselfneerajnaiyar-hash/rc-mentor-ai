"use client";

import { useState } from "react";
import SpeedGym from "./SpeedGym";
import SpeedDashboard from "./SpeedDashboard";

export default function SpeedContainer() {
  const [tab, setTab] = useState("drill"); 
  // drill | dashboard

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setTab("drill")}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: tab === "drill" ? "#2563eb" : "#f3f4f6",
            color: tab === "drill" ? "#fff" : "#111",
            fontWeight: 600,
          }}
        >
          Speed Drill
        </button>

        <button
          onClick={() => setTab("dashboard")}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: tab === "dashboard" ? "#2563eb" : "#f3f4f6",
            color: tab === "dashboard" ? "#fff" : "#111",
            fontWeight: 600,
          }}
        >
          Speed Profile
        </button>
      </div>

      {tab === "drill" && <SpeedGym />}
      {tab === "dashboard" && <SpeedDashboard />}
    </div>
  );
}
