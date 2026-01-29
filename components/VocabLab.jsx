"use client";
import { useState, useEffect } from "react";

export default function VocabLab() {
  const [tab, setTab] = useState("bank");
  const [manualWord, setManualWord] = useState("");
  const [lookup, setLookup] = useState(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [bank, setBank] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("vocabBank") || "[]");
    setBank(saved);
  }, []);

  async function handleManualAdd(word) {
    setManualWord("");
    setLookup(null);
    setLoadingLookup(true);

    const res = await fetch("/api/enrich-word", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word }),
    });

    const data = await res.json();
    setLoadingLookup(false);

    const existing = JSON.parse(localStorage.getItem("vocabBank") || "[]");

    if (!existing.some(w => w.word.toLowerCase() === word.toLowerCase())) {
      const updated = [
        ...existing,
        { word, ...data, correctCount: 0, enriched: true },
      ];
      localStorage.setItem("vocabBank", JSON.stringify(updated));
      setBank(updated);
    }

    setLookup({ word, ...data });
  }

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

        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: 20,
            minHeight: 420,
            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
          }}
        >
          {tab === "bank" && (
            <WordBank
              manualWord={manualWord}
              setManualWord={setManualWord}
              lookup={lookup}
              loading={loadingLookup}
              handleManualAdd={handleManualAdd}
              bank={bank}
              setLookup={setLookup}
            />
          )}
          {tab === "drill" && <VocabDrill />}
          {tab === "learn" && <VocabLearn />}
          {tab === "profile" && <VocabProfile />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function WordBank({
  manualWord,
  setManualWord,
  lookup,
  loading,
  handleManualAdd,
  bank,
  setLookup,
}) {
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
        <input
          placeholder="Type a word and press Enter"
          value={manualWord}
          onChange={e => setManualWord(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && manualWord.trim()) {
              handleManualAdd(manualWord.trim());
            }
          }}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 16,
          }}
        />

        {loading && <p style={{ marginTop: 12 }}>Looking up word…</p>}

        {lookup && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#f8fafc",
            }}
          >
            <h3>{lookup.word}</h3>
            <p><b>Meaning:</b> {lookup.meaning || "—"}</p>
            <p><b>Part of Speech:</b> {lookup.partOfSpeech || "—"}</p>
            <p><b>Usage:</b> {lookup.usage || "—"}</p>
            <p><b>Root:</b> {lookup.root || "—"}</p>
            <p><b>Synonyms:</b> {(lookup.synonyms || []).join(", ") || "—"}</p>
            <p><b>Antonyms:</b> {(lookup.antonyms || []).join(", ") || "—"}</p>
          </div>
        )}

        {bank.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h4>Saved Words</h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              {bank.map((w, i) => (
                <button
                  key={i}
                  onClick={() => setLookup(w)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <b>{w.word}</b>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {w.partOfSpeech || ""}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VocabDrill() {
  return <div><h2>Vocab Drills</h2><p>Coming next.</p></div>;
}

function VocabLearn() {
  return <div><h2>Learn</h2><p>Coming next.</p></div>;
}

function VocabProfile() {
  return <div><h2>Profile</h2><p>Coming next.</p></div>;
}
