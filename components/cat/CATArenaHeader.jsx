"use client";

export default function CATArenaHeader({
  title = "CAT RC Sectional",
  timeLeft = "30:00",
  onExit,
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Left: Test title */}
      <div>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          CAT Arena
        </p>
      </div>

      {/* Center: Timer (static for now) */}
      <div
        style={{
          fontWeight: 700,
          fontSize: 18,
          color: "#dc2626",
        }}
      >
        ⏱ {timeLeft}
      </div>

      {/* Right: Exit */}
      <button
        onClick={onExit}
        style={{
          padding: "8px 14px",
          borderRadius: 6,
          border: "1px solid #dc2626",
          background: "#fff",
          color: "#dc2626",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Exit Test
      </button>
    </div>
  );
}
