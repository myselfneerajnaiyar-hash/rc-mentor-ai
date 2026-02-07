"use client";

export default function MobileBottomNav({ view, setView }) {
  const tabs = [
    { key: "home", label: "Home", icon: "🏠" },
    { key: "rc", label: "Practice", icon: "📘" },
    { key: "vocab", label: "Vocab", icon: "🧠" },
    { key: "speed", label: "Speed", icon: "⚡" },
    { key: "analytics", label: "Stats", icon: "📊" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: "#ffffff",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setView(tab.key)}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 12,
            color: view === tab.key ? "#2563eb" : "#6b7280",
          }}
        >
          <span style={{ fontSize: 22 }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
