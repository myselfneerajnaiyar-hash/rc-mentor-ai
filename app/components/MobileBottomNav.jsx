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
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          onClick={() => setView(tab.key)}
          className={view === tab.key ? "active" : ""}
        >
          <span className="icon">{tab.icon}</span>
          <span className="label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
