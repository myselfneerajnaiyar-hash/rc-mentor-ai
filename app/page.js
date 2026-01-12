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
      .split(/\n{2,}/)
      .map(x => x.trim())
      .filter(Boolean);

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
        rows={12}
        style={{ width: "100%", padding: 12 }}
        placeholder="Paste passage with blank lines between paragraphs"
      />

      <br /><br />
      <button onClick={prepare}>Split into Paragraphs</button>

      {parts.length > 0 && (
        <>
          <h3>Paragraph {index + 1}</h3>

          <div style={{
            padding: 12,
            border: "1px solid #ccc",
            whiteSpace: "pre-wrap",
            background: "#fafafa"
          }}>
            {parts[index]}
          </div>

          <br />
          <button disabled={loading} onClick={() => run(index)}>
            {loading ? "Thinking..." : "Dissect this Paragraph"}
          </button>
        </>
      )}

      {reply && (
        <div style={{
          marginTop: 30,
          whiteSpace: "pre-wrap",
          lineHeight: 1.6,
          borderTop: "1px solid #ccc",
          paddingTop: 20
        }}>
          {reply}
        </div>
      )}
    </main>
  );
}
