"use client";

export default function QuestionPalette({
  total,
  current,
  states = [],
  onJump,
}) {
  return (
    <div>
      <h4 style={{ marginBottom: 12 }}>Questions</h4>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
        }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const state = states[i] || 0;

          let bg = "#e5e7eb"; // unattempted
          if (state === 1) bg = "#22c55e"; // answered
          if (state === 2) bg = "#a855f7"; // marked
          if (state === 3) bg = "#16a34a"; // answered + marked

          const isCurrent = i === current;

          return (
            <button
              key={i}
              onClick={() => onJump(i)}   // ✅ THIS IS THE FIX
              style={{
                padding: "10px 0",
                borderRadius: 6,
                border: isCurrent
                  ? "2px solid #2563eb"
                  : "1px solid #cbd5e1",
                background: bg,
                color: "#000",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, fontSize: 13 }}>
        <p>⬜ Unattempted</p>
        <p>🟢 Answered</p>
        <p>🟣 Marked for Review</p>
        <p>🟢🟣 Answered + Marked</p>
      </div>
    </div>
  );
}
