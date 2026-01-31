"use client";
import { useState } from "react";
import RCView from "./RCView";
import RCProfile from "./RCProfile";

export default function RCContainer({ view, setView }) {
  const [activeTab, setActiveTab] = useState("paste");
  // paste | generate | profile

  return (
    <div style={{ padding: 20 }}>
      {/* RC LOCAL TABS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {[
          { key: "paste", label: "Paste your passage" },
          { key: "generate", label: "Generate Passage" },
          { key: "profile", label: "RC Profile" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: activeTab === tab.key ? "#2563eb" : "#f3f4f6",
              color: activeTab === tab.key ? "#fff" : "#111",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === "paste" && <RCView mode="paste" view={view} setView={setView} />}
      {activeTab === "generate" && <RCView mode="generate" view={view} setView={setView} />}
      {activeTab === "profile" && <RCProfile />}
    </div>
  );
}
