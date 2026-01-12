"use client";

import { useState } from "react";

export default function Home() {
  const [passage, setPassage] = useState("");
  const [paragraphs, setParagraphs] = useState([]);
  const [index, setIndex] = useState(0);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function startSession() {
    if (!passage.trim()) return;

    const parts = passage
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    setParagraphs(parts);
    setIndex(0);
    setReply("");
    setLoading(true);

    const res = await fetch("/api/rc-mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paragraph: parts[0],
      }),
    });

    const data = await res.json();
    setReply(data.reply || data.error || "No response");
    setLoading(false);
  }

  async function next(option) {
    const nextIndex = index + 1;
    if (nextIndex >= paragraphs.length) return;

    setIndex(nextIndex);
    setLoading(true);

    const res = await fetch("/api/rc-mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paragraph: paragraphs[nextIndex],
      }),
    });

    const data = await res.json();
    setReply(data.reply || data.error || "No response");
    setLoading(false);
  }

  return (
    <main style={{ padding: 30, maxWidth: 800, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>RC Mentor</h1>

      <textarea
        placeholder="Paste full RC passage here..."
        value={passage}
        onChange={(e) => setPassage(e.target.value)}
        rows={10}
        style={{ width: "100%", padding: 12 }}
      />

      <br /><br />

      <button onClick={startSession} disabled={loading}>
        {loading ? "Thinking..." : "Start RC"}
      </button>

      {reply && (
        <div style={{ marginTop: 30, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {reply}

          <div style={{ marginTop: 20 }}>
            {["A", "B", "C", "D"].map((o) => (
              <button
                key={o}
                onClick={() => next(o)}
                style={{ display: "block", margin: "6px 0" }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
