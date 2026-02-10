"use client";

import {
  Home,
  BookOpen,
  Timer,
  ListChecks,
  GraduationCap,
} from "lucide-react";

export default function MobileBottomNav({ view, setView }) {
  const tabs = [
    { key: "home", label: "Home", icon: Home },
    { key: "rc", label: "RC", icon: BookOpen },
    { key: "speed", label: "Speed", icon: Timer },
    { key: "vocab", label: "Vocab", icon: ListChecks },
    { key: "cat", label: "CAT", icon: GraduationCap },
  ];

  return (
    <nav className="mobile-nav mobile-only safe-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = view === tab.key;

        return (
          <button
            key={tab.key}
            className={`mobile-tab ${active ? "active" : ""}`}
            onClick={() => setView(tab.key)}
            aria-label={tab.label}
          >
            <Icon size={22} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
