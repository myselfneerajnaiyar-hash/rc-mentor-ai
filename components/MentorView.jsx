"use client";

export default function MentorView() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
      <h2 style={{ marginTop: 0 }}>RC Mentor</h2>

      <p>Paste a passage. Let’s read it together.</p>

      <textarea
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
          style={{
            padding: "10px 16px",
            background: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Split Passage
        </button>

        <button
          style={{
            padding: "10px 16px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Generate New Passage
        </button>
      </div>
    </div>
  );
}
