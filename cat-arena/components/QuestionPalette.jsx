"use client";

export default function QuestionPalette({
  total,
  current,
  states = [],
  onJump,
}) {
  return (
    <div>
      {/* ===== LEGEND ===== */}
      <div style={{ fontSize: 13, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={dot("#16a34a")} /> Answered
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={dot("#7c3aed")} /> Marked for Review
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={dot("#e5e7eb")} /> Not Answered
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={dot("#16a34a", "#7c3aed")} /> Answered & Marked
        </div>
      </div>

      {/* ===== TITLE ===== */}
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Choose a Question
      </div>

      {/* ===== GRID ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
        }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const state = states[i] || 0;

          const bg =
            state === 1
              ? "#16a34a" // answered
              : state === 2
              ? "#7c3aed" // marked
              : state === 3
              ? "#16a34a" // answered + marked
              : "#e5e7eb"; // unattempted

          const color =
            state === 0 ? "#111827" : "#ffffff";

          const border =
            i === current
              ? "2px solid #2563eb" // current question
              : "1px solid #9ca3af";

          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              style={{
                height: 38,
                borderRadius: 4,
                background: bg,
                color,
                border,
                fontWeight: 600,
                cursor: "pointer",
                position: "relative",
              }}
            >
              {i + 1}

              {/* purple dot for answered+marked */}
              {state === 3 && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#7c3aed",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===== helper ===== */
function dot(bg, overlay) {
  return {
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: bg,
    position: "relative",
    display: "inline-block",
    ...(overlay
      ? {
          boxShadow: `inset -4px -4px 0 0 ${overlay}`,
        }
      : {}),
  };
}
