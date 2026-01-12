"use client";

import { useState } from "react";

export default function Home() {
  const [passage, setPassage] = useState("");
  const [paragraphs, setParagraphs] = useState([]);
  const [index, setIndex] = useState(0);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

 const parts = passage
  .split(/\n+/)          // split on ANY line break
  .map(p => p.trim())
  .filter(p => p.length > 0);

    if (!parts.length) return;

    setParagraphs(parts);
    setIndex(0);
    setLoading(true);

    const res = await fetch("/api/rc-mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paragraph: parts[0],
        index: 1,
        total: parts.length
      })
    });

    const data = await res.json();
    setReply(data.reply);
    setLoading(false);
  };

 const handleOption = async (opt) => {
  setLoading(true);

  const res = await fetch("/api/rc-mentor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paragraph: paragraphs[index],   // SAME paragraph
      index: index + 1,
      total: paragraphs.length,
      answer: opt
    })
  });

  const data = await res.json();
  setReply(data.reply);
  setLoading(false);

  // Move to next paragraph ONLY after mentor responds
  const next = index + 1;
  if (next < paragraphs.length) {
    setIndex(next);
  }
};
  return (
    <main style={{ maxWidth: 800, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>RC Mentor</h1>

      <textarea
        value={passage}
        onChange={(e) => setPassage(e.target.value)}
        rows={10}
        style={{ width: "100%", padding: 12 }}
        placeholder="Paste passage here..."
      />

      <br /><br />

      <button onClick={startSession} disabled={loading}>
        {loading ? "Thinking..." : "Let's dissect"}
      </button>

      {reply && (
        <div style={{ marginTop: 30 }}>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {reply}
          </div>

          <div style={{ marginTop: 20 }}>
            {["A", "B", "C", "D"].map(opt => (
              <button
                key={opt}
                onClick={() => handleOption(opt)}
                style={{ display: "block", margin: "6px 0" }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
