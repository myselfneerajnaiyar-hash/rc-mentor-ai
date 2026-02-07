"use client";

import { Home, BookOpen, BarChart2, Zap, ClipboardList } from "lucide-react";

export default function MobileBottomNav({ view, setView }) {
  const tabs = [
    { key: "home", label: "Home", icon: Home },
    { key: "rc", label: "Practice", icon: BookOpen },
    { key: "vocab", label: "Vocab", icon: ClipboardList },
    { key: "speed", label: "Speed", icon: Zap },
    { key: "analytics", label: "Stats", icon: BarChart2 },
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
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setView(key)}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 12,
            color: view === key ? "#2563eb" : "#6b7280",
          }}
        >
          <Icon size={22} />
          {label}
        </button>
      ))}
    </nav>
  );
}
