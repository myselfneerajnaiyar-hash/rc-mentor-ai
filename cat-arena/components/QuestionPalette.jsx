"use client";

export default function QuestionPalette({
  totalQuestions,
  currentIndex,
  questionStatus,
  onJump,
}) {
  function getStyle(status, isCurrent) {
    let bg = "#e5e7eb"; // unvisited
    let color = "#1f2937";

    if (status === "visited") bg = "#ffffff";
    if (status === "answered") bg = "#22c55e";
    if (status === "review") bg = "#7c3aed";

    return {
      width: 40,
      height: 40,
      borderRadius: 6,
      border: isCurrent ? "3px solid #2563eb" : "1px solid #cbd5e1",
      background: bg,
      color: status === "review" ? "#fff" : color,
      fontWeight: 700,
      cursor: "pointer",
    };
  }

  return (
    <div
      style={{
        padding: 16,
        borderLeft: "1px solid #e5e7eb",
        height: "calc(100vh - 120px)",
        overflowY: "auto",
      }}
    >
      <h4 style={{ marginBottom: 12 }}>Question Palette</h4>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
        }}
      >
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <button
            key={i}
            onClick={() => onJump(i)}
            style={getStyle(
              questionStatus[i],
              i === currentIndex
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 20, fontSize: 13, color: "#475569" }}>
        <p><b>Legend</b></p>
        <p>⬜ Visited</p>
        <p style={{ color: "#22c55e" }}>🟩 Answered</p>
        <p style={{ color: "#7c3aed" }}>🟪 Marked for Review</p>
      </div>
    </div>
  );
}
