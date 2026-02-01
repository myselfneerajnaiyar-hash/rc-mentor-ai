"use client";

export default function PassagePanel({ passage }) {
  if (!passage) return null;

  return (
    <div
      style={{
        height: "calc(100vh - 120px)",
        overflowY: "auto",
        padding: 16,
        borderRight: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      {passage.title && (
        <h3
          style={{
            marginBottom: 12,
            fontWeight: 700,
            color: "#1f2937",
          }}
        >
          {passage.title}
        </h3>
      )}

      <div
        style={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.6,
          fontSize: 15,
          color: "#374151",
        }}
      >
        {passage.text}
      </div>
    </div>
  );
}
