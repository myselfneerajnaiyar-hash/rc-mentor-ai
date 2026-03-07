"use client";

import {
  Home,
  MessageSquare,
  BookOpen,
  GraduationCap,
  User
} from "lucide-react";
export default function MobileBottomNav({ view, setView }) {
 const tabs = [
  { key: "home", label: "Home", icon: Home },
  { key: "mentor", label: "Birbal", icon: MessageSquare },
  { key: "practice", label: "Practice", icon: BookOpen },
  { key: "cat", label: "CAT", icon: GraduationCap },
  { key: "profile", label: "Profile", icon: User },
];

  return (
    <nav className="mobile-nav mobile-only safe-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
       const active =
  view === tab.key ||
  (tab.key === "practice" &&
    (view === "rc" || view === "vocab" || view === "speed"));

        return (
          <button
            key={tab.key}
            className={`mobile-tab ${active ? "active" : ""}`}
            onClick={() => {
  if (tab.key === "practice") {
    setView("rc"); // default practice entry
  } else {
    setView(tab.key);
  }
}}
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
