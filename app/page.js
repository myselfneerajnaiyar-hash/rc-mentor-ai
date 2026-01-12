"use client";

import { useState } from "react";

export default function Home() {
  const [raw, setRaw] = useState("");
  const [parts, setParts] = useState([]);
  const [index, setIndex] = useState(0);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const prepare = () => {
    // Split ONLY on real blank lines
    const p = raw
      .split(/\n{2,}/)
      .map(x => x.trim())
      .filter(x => x.length > 0);

    setParts(p);
    setIndex(0);
    setReply("");
  };

  const run = async (i) => {
    if (!parts[i]) return;

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

      <p style={{ color: "#444" }}>
        Paste the full passage below.  
        <b>Leave one blank line between paragraphs.</b>
      </p>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={12}
        style={{ width: "100%", padding: 12 }}
        placeholder={`Paste passage here.

IMPORTANT:
Insert a BLANK LINE between paragraphs.

Example:

Paragraph one ends here.

Paragraph two starts here.
`}
      />

      <br /><br />
      <button onClick={prepare}>Split into Paragraphs</button>

      {parts.length > 0 && (
        <>
          <h3>Detected Paragraphs</h3>

          {parts.map((p, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              style={{
                border: i === index ? "2px solid black" : "1px solid #ccc",
                padding: 10,
                marginBottom: 10,
                cursor: "pointer",
                background: i === index ? "#f3f3f3" : "white"
              }}
            >
              <b>Paragraph {i + 1}</b>
              <div style={{ marginTop: 6, fontSize: 14, whiteSpace: "pre-wrap" }}>
                {p}
              </div>
            </div>
          ))}

          <button disabled={loading} onClick={() => run(index)}>
            {loading ? "Thinking..." : Dissect Paragraph ${index + 1}}
          </button>
        </>
      )}

      {reply && (
        <div
          style={{
            marginTop: 30,
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            borderTop: "1px solid #ccc",
            paddingTop: 20
          }}
        >
          {reply}
        </div>
      )}
    </main>
  );
}
