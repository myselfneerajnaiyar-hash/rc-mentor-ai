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
        <a
          key={tab.key}
          className={view === tab.key ? "active" : ""}
          onClick={() => setView(tab.key)}
        >
          <span className="icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </a>
      ))}
    </nav>
  );
}
