"use client";

export default function Navbar({ view, setView }) {
  const tabs = [
    { key: "home", label: "Home" },
    { key: "rc", label: "Practice RC" },
    { key: "vocab", label: "VocabularyLab" },
    { key: "speed", label: "SpeedGym" },
    { key: "cat", label: "CAT Arena" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "12px 20px",
        borderBottom: "1px solid #e5e7eb",
        background: "#ffffff",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => setView(t.key)}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: view === t.key ? "#2563eb" : "#f9fafb",
            color: view === t.key ? "#fff" : "#111",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
