"use client";

export default function MobileBottomNav({ view, setView }) {
  const tabs = [
    { key: "home", label: "Home", icon: "🏠" },
    { key: "rc", label: "RC", icon: "📘" },
    { key: "speed", label: "Speed", icon: "⚡" },
    { key: "vocab", label: "Vocab", icon: "📚" },
    { key: "cat", label: "CAT", icon: "📊" },
  ];

  return (
    <nav className="mobile-nav">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setView(tab.key)}
          className={view === tab.key ? "active" : ""}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 20 }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
