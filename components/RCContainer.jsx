"use client";

import { useState } from "react";
import RCView from "./RCView";

export default function RCContainer({ view, setView }) {
  const [rcSubView, setRcSubView] = useState("practice"); 
  // practice | profile

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setRcSubView("practice")}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: rcSubView === "practice" ? "#2563eb" : "#f3f4f6",
            color: rcSubView === "practice" ? "#fff" : "#111",
            fontWeight: 600,
          }}
        >
          Practice RC
        </button>

        <button
          onClick={() => setRcSubView("profile")}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: rcSubView === "profile" ? "#2563eb" : "#f3f4f6",
            color: rcSubView === "profile" ? "#fff" : "#111",
            fontWeight: 600,
          }}
        >
          RC Profile
        </button>
      </div>

      {/* Your existing RC engine */}
      <RCView
        view="rc"
        setView={() => {}}
        forcedPhase={rcSubView === "profile" ? "profile" : "mentor"}
      />
    </div>
  );
}
