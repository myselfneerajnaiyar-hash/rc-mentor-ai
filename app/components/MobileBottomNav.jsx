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
        zIndex: 1000,
      }}
    >
      <NavItem label="Home" icon="🏠" />
      <NavItem label="Practice" icon="📘" />
      <NavItem label="Vocab" icon="📚" />
      <NavItem label="Speed" icon="⚡" />
      <NavItem label="Arena" icon="🎯" />
    </nav>
  );
}

function NavItem({ label, icon }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontSize: "12px",
        color: "#374151",
      }}
    >
      <div style={{ fontSize: "20px" }}>{icon}</div>
      {label}
    </div>
  );
}
