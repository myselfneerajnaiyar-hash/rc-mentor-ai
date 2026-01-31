"use client";

export default function QuestionPalette({
  total,
  current,
  states,
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
          const state = states[i];

          let bg = "#e5e7eb"; // unattempted
          let color = "#111827";
          let border = "none";

          if (state === 1) bg = "#22c55e"; // answered
          if (state === 2) bg = "#a855f7"; // marked
          if (state === 3) {
            bg = "#22c55e";
            border = "3px solid #a855f7";
          }

          if (i === current) {
            border = "3px solid #2563eb";
          }

          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              style={{
                height: 44,
                borderRadius: 8,
                fontWeight: 700,
                background: bg,
                color,
                border,
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
        <p>⚪ Unattempted</p>
        <p>🟢 Answered</p>
        <p>🟣 Marked for Review</p>
        <p>🟢🟣 Answered + Marked</p>
      </div>
    </div>
  );
}
