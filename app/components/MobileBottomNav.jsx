"use client";

export default function MobileBottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        background: "#ffffff",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 9999,
        fontSize: "12px",
      }}
    >
      <div style={itemStyle}>
        <span style={iconStyle}>🏠</span>
        <span>Home</span>
      </div>

      <div style={itemStyle}>
        <span style={iconStyle}>📘</span>
        <span>RC</span>
      </div>

      <div style={itemStyle}>
        <span style={iconStyle}>⚡</span>
        <span>Speed</span>
      </div>

      <div style={itemStyle}>
        <span style={iconStyle}>📚</span>
        <span>Vocab</span>
      </div>

      <div style={itemStyle}>
        <span style={iconStyle}>📊</span>
        <span>CAT</span>
      </div>
    </nav>
  );
}

const itemStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  color: "#111827",
};

const iconStyle = {
  fontSize: "20px",
};
