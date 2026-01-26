"use client";
import { useEffect, useState } from "react";

export default function RCProfile({ onBack }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem("rcProfile") || "{}");
    setProfile(raw);
  }, []);

  if (!profile || !profile.tests || profile.tests.length === 0) {
    return (
      <div style={{ marginTop: 20, padding: 20, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3>RC Profile</h3>
        <p>No test data yet. Take at least one RC test to build your profile.</p>
        <button onClick={onBack}>Back</button>
      </div>
    );
  }

  const tests = profile.tests;
  const all = tests.flatMap(t => t.questions);

  const totalQ = all.length;
  const correct = all.filter(q => q.correct).length;
  const accuracy = Math.round((correct / totalQ) * 100);
  const avgTime = Math.round(all.reduce((a, b) => a + b.time, 0) / totalQ);

  return (
    <div style={{ marginTop: 20 }}>
      <h2>RC Profile</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {["overview", "skills", "speed", "today", "plan"].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: activeTab === t ? "#2563eb" : "#f3f4f6",
              color: activeTab === t ? "#fff" : "#111",
              fontWeight: 600,
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Accuracy", value: accuracy + "%" },
              { label: "Avg Time / Q", value: avgTime + "s" },
              { label: "RCs Attempted", value: tests.length },
              { label: "Total Questions", value: totalQ },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 10 }}>
            <p style={{ margin: 0, fontStyle: "italic" }}>
              Your RC profile is stabilizing into a recognizable pattern.  
              With every test, this dashboard will become sharper and more predictive.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
