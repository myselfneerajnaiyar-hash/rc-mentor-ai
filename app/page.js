"use client";

import { useState } from "react";

export default function Home() {
  const [passage, setPassage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function askMentor() {
    setLoading(true);
    setReply("");

    const res = await fetch("/api/rc-mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passage }),
    });

    const data = await res.json();
    setReply(data.reply || data.error || "No response");
    setLoading(false);
  }

  return (
    <main style={{ padding: 30, fontFamily: "sans-serif" }}>
      <h1>RC Mentor AI</h1>

      <textarea
        placeholder="Paste an RC passage here..."
        value={passage}
        onChange={(e) => setPassage(e.target.value)}
        rows={10}
        style={{ width: "100%", marginTop: 20 }}
      />

      <br />

      <button
        onClick={askMentor}
        disabled={loading}
        style={{ marginTop: 10, padding: "8px 16px" }}
      >
        {loading ? "Thinking..." : "Ask Mentor"}
      </button>

      {reply && (
        <div style={{ marginTop: 30, whiteSpace: "pre-wrap" }}>
          <h3>Mentor says:</h3>
          <p>{reply}</p>
        </div>
      )}
    </main>
  );
}
