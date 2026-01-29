"use client";
import { useState, useEffect } from "react";

export default function VocabLab() {
  const [tab, setTab] = useState("bank");
  // "bank" | "drill" | "learn" | "profile"

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #eef2ff, #f8fafc)",
        color: "#1f2937",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 12 }}>Vocabulary Lab</h1>

        {/* Top Tabs */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {[
            { key: "bank", label: "WordBank" },
            { key: "drill", label: "Vocab Drills" },
            { key: "learn", label: "Learn" },
            { key: "profile", label: "Profile" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #c7d2fe",
                background: tab === t.key ? "#4f46e5" : "#eef2ff",
                color: tab === t.key ? "#fff" : "#1e293b",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: 20,
            minHeight: 420,
            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
          }}
        >
          {tab === "bank" && <WordBank />}
          {tab === "drill" && <VocabDrill />}
          {tab === "learn" && <VocabLearn />}
          {tab === "profile" && <VocabProfile />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- PLACEHOLDERS ---------------- */

function WordBank() {
  return (
    <div>
      <h2>WordBank</h2>
      <p style={{ color: "#555" }}>
        Your personal vocabulary memory. Words appear here automatically from RC,
        Speed Gym, or when you add them manually.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          border: "1px dashed #c7d2fe",
          background: "#f8fafc",
        }}
      >
        <b>Manual Add (coming next)</b>
        <p style={{ fontSize: 14, color: "#6b7280" }}>
          Type a word and press Enter. It will behave like a dictionary and auto-save.
        </p>
      </div>
    </div>
  );
}

function VocabDrill() {
  return (
    <div>
      <h2>Vocab Drills</h2>
      <p style={{ color: "#555" }}>
        Timed micro-tests to convert recognition into recall. Endless. Adaptive.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          border: "1px dashed #c7d2fe",
          background: "#f8fafc",
        }}
      >
        <b>Drill Engine (coming next)</b>
        <p style={{ fontSize: 14, color: "#6b7280" }}>
          10-question timed drills generated from your WordBank.
        </p>
      </div>
    </div>
  );
}

function VocabLearn() {
  return (
    <div>
      <h2>Learn</h2>
      <p style={{ color: "#555" }}>
        Structured lessons that teach clusters of words together for memory.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          border: "1px dashed #c7d2fe",
          background: "#f8fafc",
        }}
      >
        <b>Lesson System (coming next)</b>
        <p style={{ fontSize: 14, color: "#6b7280" }}>
          Cognitive verbs, academic tone, uncertainty, power, emotion gradients.
        </p>
      </div>
    </div>
  );
}

function VocabProfile() {
  return (
    <div>
      <h2>Vocab Profile</h2>
      <p style={{ color: "#555" }}>
        Track retention, mastery curve, and your lexical growth.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          border: "1px dashed #c7d2fe",
          background: "#f8fafc",
        }}
      >
        <b>Analytics (coming next)</b>
        <p style={{ fontSize: 14, color: "#6b7280" }}>
          Word counts, mastery distribution, recall accuracy, mentor diagnosis.
        </p>
      </div>
    </div>
  );
}
