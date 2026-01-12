"use client";

import { useState } from "react";

export default function Home() {
  const [raw, setRaw] = useState("");
  const [parts, setParts] = useState([]);
  const [index, setIndex] = useState(0);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const prepare = () => {
    const p = raw
      .split(/\n+/)
      .map(x => x.trim())
      .filter(x => x.length > 40);

    setParts(p);
    setIndex(0);
    setReply("");
  };

  const run = async (i) => {
    setLoading(true);
    const res = await fetch("/api/rc-mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paragraph: parts[i],
        index: i + 1,
        total: parts.length
      })
    });

    const data = await res.json();
    setReply(data.reply);
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ color: "#0f172a" }}>RC Mentor – NEW UI</h1>
      <p style={{ color: "#475569" }}>Paste a passage. Let’s read it together.</p>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={10}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 8,
          border: "1px solid #cbd5e1",
          fontSize: 14
        }}
        placeholder="Paste full passage here..."
      />

      <br /><br />

      <button
        onClick={prepare}
        style={{
          background: "#2563eb",
          color: "white",
          padding: "10px 18px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontSize: 14
        }}
      >
        Split into Paragraphs
      </button>

      {parts.length > 0 && (
        <>
          <h3 style={{ marginTop: 30 }}>Detected Paragraphs</h3>

          {parts.map((p, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              style={{
                border: i === index ? "2px solid #2563eb" : "1px solid #e5e7eb",
                padding: 12,
                marginBottom: 10,
                cursor: "pointer",
                background: i === index ? "#eff6ff" : "white",
                borderRadius: 6
              }}
            >
              <b>Paragraph {i + 1}</b>
              <div style={{ marginTop: 6, fontSize: 14 }}>{p}</div>
            </div>
          ))}

          <button
            disabled={loading}
            onClick={() => run(index)}
            style={{
              marginTop: 10,
              background: loading ? "#94a3b8" : "#16a34a",
              color: "white",
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14
            }}
          >
            {loading ? "Thinking..." : Dissect Paragraph ${index + 1}}
          </button>
        </>
      )}

      {reply && (
        <div
          style={{
            marginTop: 30,
            whiteSpace: "pre-wrap",
            lineHeight: 1.7,
            background: "#f8fafc",
            padding: 16,
            borderRadius: 8,
            border: "1px solid #e5e7eb"
          }}
        >
          {reply}
        </div>
      )}
    </main>
  );
}
