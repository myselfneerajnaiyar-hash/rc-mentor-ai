"use client";
import { useState, useEffect } from "react";

export default function RCProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [tests, setTests] = useState([]);

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem("rcProfile") || "{}");
    setTests(raw.tests || []);
  }, []);

  if (!tests.length) {
    return (
      <div style={{ marginTop: 20, padding: 20, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3>RC Profile</h3>
        <p>No test data yet. Take at least one RC test to build your profile.</p>
      </div>
    );
  }

  const all = tests.flatMap(t => t.questions);
  const totalQ = all.length;
  const correct = all.filter(q => q.correct).length;
  const accuracy = Math.round((correct / totalQ) * 100);
  const avgTime = Math.round(all.reduce((a, b) => a + (b.time || 0), 0) / totalQ);

  const last = tests.slice(-8);

  const accSeries = last.map(t => {
    const q = t.questions;
    const c = q.filter(x => x.correct).length;
    return Math.round((c / q.length) * 100);
  });

  const timeSeries = last.map(t => {
    const q = t.questions;
    return Math.round(q.reduce((a, b) => a + (b.time || 0), 0) / q.length);
  });

  function line(points, h = 60) {
    if (points.length < 2) return "";
    const max = Math.max(...points);
    const min = Math.min(...points);
    const span = max - min || 1;

    return points
      .map((v, i) => {
        const x = (i / (points.length - 1)) * 300;
        const y = h - ((v - min) / span) * h;
        return `${x},${y}`;
      })
      .join(" ");
  }

  function readingStyle() {
    if (accuracy > 70 && avgTime < 35)
      return "You are an instinctive reader. You grasp ideas quickly and move with confidence.";
    if (accuracy < 55 && avgTime < 30)
      return "You rush before clarity forms. Speed is replacing structure.";
    if (accuracy > 65 && avgTime > 50)
      return "You are thoughtful but slow. Comprehension is good; efficiency is missing.";
    return "You are still forming your reading identity. Patterns will stabilize soon.";
  }

  function momentum() {
    if (accSeries.length < 3) return "Too early to detect momentum.";
    const d = accSeries[accSeries.length - 1] - accSeries[0];
    if (d > 10) return "You are gaining stability and confidence.";
    if (d < -10) return "Your performance is slipping. Reset habits.";
    return "You are oscillating. Consistency is your next frontier.";
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h2>RC Profile</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {["overview", "skills", "speed", "today", "plan"].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: "6px 12px",
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

      {activeTab === "overview" && (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "Accuracy", value: accuracy + "%" },
              { label: "Avg Time / Q", value: avgTime + "s" },
              { label: "RCs Attempted", value: tests.length },
              { label: "Total Questions", value: totalQ },
            ].map((c, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 10, border: "1px solid #e5e7eb", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 16, borderRadius: 10, border: "1px solid #e5e7eb", background: "#f8fafc" }}>
            <b>Your Reading Style</b>
            <p style={{ marginTop: 6 }}>{readingStyle()}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ padding: 16, borderRadius: 10, border: "1px solid #e5e7eb" }}>
              <b>Accuracy Trend</b>
              <svg width="300" height="60">
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  points={line(accSeries)}
                />
              </svg>
            </div>

            <div style={{ padding: 16, borderRadius: 10, border: "1px solid #e5e7eb" }}>
              <b>Avg Time Trend</b>
              <svg width="300" height="60">
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  points={line(timeSeries)}
                />
              </svg>
            </div>
          </div>

          <div style={{ padding: 16, borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff7ed" }}>
            <b>Momentum</b>
            <p style={{ marginTop: 6 }}>{momentum()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
