"use client";

import { useState } from "react";

export default function Home() {
  const [passage, setPassage] = useState("");
  const [paragraphs, setParagraphs] = useState([]);
  const [index, setIndex] = useState(0);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  // Start the guided session
  const startSession = async () => {
    if (!passage.trim()) return;

    const parts = passage
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    setParagraphs(parts);
    setIndex(0);
    setLoading(true);
    setReply("");

    const res = await fetch("/api/rc-mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paragraph: parts[0],
        index: 1,
        total: parts.length,
      }),
    });

    const data = await res.json();
    setReply(data.reply || data.error || "No response");
    setLoading(false);
  };

  // Handle A/B/C/D click and move to next paragraph
  const handleOption = async (option) => {
    const next = index + 1;
    if (next >= paragraphs.length) return;

    setIndex(next);
    setLoading(true);

    const res = await fetch("/api/rc-mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paragraph: paragraphs[next],
        index: next + 1,
        total: paragraphs.length,
        answer: option,
      }),
    });

    const data = await res.json();
    setReply(data.reply || data.error || "No response");
    setLoading(false);
  };

  return (
    <main style={{ padding: 30, fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto" }}>
      <h1>RC Mentor AI</h1>

      <textarea
        placeholder="Paste an RC passage here..."
        value={passage}
        onChange={(e) => setPassage(e.target.value)}
        rows={10}
        style={{ width: "100%", marginTop: 20, padding: 12 }}
      />

      <br />

      <button
        onClick={startSession}
        disabled={loading}
        style={{ marginTop: 10, padding: "8px 16px" }}
      >
        {loading ? "Thinking..." : "Start Guided RC"}
      </button>

      {reply && (
        <div style={{ marginTop: 30 }}>
          <h3>Mentor says:</h3>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{reply}</div>

          <div style={{ marginTop: 20 }}>
            {["A", "B", "C", "D"].
