"use client";

import {
  Home,
  BookOpen,
  Gauge,
  GraduationCap,
  Timer
} from "lucide-react";

export default function MobileBottomNav({ view, setView }) {
  const tabs = [
    { key: "home", label: "Home", icon: Home },
    { key: "rc", label: "RC", icon: BookOpen },
    { key: "speed", label: "Speed", icon: Timer },
    { key: "vocab", label: "Vocab", icon: Gauge },
    { key: "cat", label: "CAT", icon: GraduationCap }
  ];

  return (
    <nav className="mobile-nav">
      {tabs.map((tab) => {
        const active = view === tab.key;
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`mobile-tab ${active ? "active" : ""}`}
            aria-label={tab.label}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
