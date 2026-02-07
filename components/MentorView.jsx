"use client";

export default function MentorView({
  text,
  setText,
  splitPassage,
  setShowGenerator,
}) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
      <h2 style={{ marginTop: 0 }}>AuctorRC</h2>

      <p>Paste a passage. Let’s read it together.</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your RC passage here…"
        style={{
          width: "100%",
          minHeight: 180,
          padding: 12,
          borderRadius: 8,
          border: "1px solid #d1d5db",
          fontSize: 14,
        }}
      />

      <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
        <button
          onClick={splitPassage}
          style={{
            padding: "10px 16px",
            background: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Split Passage
        </button>

       
      </div>
    </div>
  );
}
