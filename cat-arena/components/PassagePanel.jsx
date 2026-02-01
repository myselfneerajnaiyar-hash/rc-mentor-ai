"use client";

export default function PassagePanel({ passage }) {
  if (!passage) return null;

  return (
    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
      {passage.text}
    </div>
  );
}
