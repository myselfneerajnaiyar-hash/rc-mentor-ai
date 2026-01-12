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
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>RC Mentor</h1>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={10}
        style={{ width: "100%", padding: 12, fontSize: 14 }}
        placeholder="Paste full passage here..."
      />

      <br /><br />

      <button
        onClick={prepare}
        style={{
          background: "#111",
          color: "white",
          padding: "10px 18px",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
          fontWeight: 600
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
                border: i === index ? "2px solid #111" : "1px solid #ccc",
                padding: 12,
                marginBottom: 10,
                cursor: "pointer",
                background: i === index ? "#f0f0f0" : "white"
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
              marginTop: 20,
              background: loading ? "#aaa" : "#2563eb",
              color: "white",
              padding: "12px 22px",
              borderRadius: 8,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
          >
            {loading ? "Thinking..." : Dissect Paragraph ${index + 1}}
          </button>
        </>
      )}

      {reply && (
        <div
          style={{
            marginTop: 40,
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            padding: 20,
            borderRadius: 10,
            background: "#fafafa",
            border: "1px solid #ddd"
          }}
        >
          {reply}
        </div>
      )}
    </main>
  );
}
