"use client";

import {
  Home,
  MessageSquare,
  BookOpen,
  GraduationCap,
  User,
} from "lucide-react";

import { useRouter } from "next/navigation";

export default function MobileBottomNav({
  view,
  setView,
  hasPremiumAccess,
  exam,
}) {

  const router = useRouter();

  const tabs = [
  {
    key: "home",
    label: "Home",
    icon: Home,
  },

  {
    key: "mentor",
    label: "Birbal",
    icon: MessageSquare,
  },

  {
    key: "practice",
    label: "Practice",
    icon: BookOpen,
  },

  ...(exam === "CAT"
    ? [
        {
          key: "cat",
          label: "CAT",
          icon: GraduationCap,
        },
      ]
    : []),

  {
    key: "profile",
    label: "Profile",
    icon: User,
  },
];

  return (
    <nav className="mobile-nav mobile-only safe-bottom-nav">

      {tabs.map((tab) => {
        const freeViews = ["home", "workout", "hangman", "cat", "profile",];

const locked =
  !freeViews.includes(tab.key) &&
  !hasPremiumAccess

        const Icon = tab.icon;

        const active =
          view === tab.key ||
          (tab.key === "practice" &&
            (view === "rc" ||
              view === "vocab" ||
              view === "speed" ||
              view === "precision"));

        return (
          <button
            key={tab.key}
            className={`mobile-tab ${active ? "active" : ""}`}
            aria-label={tab.label}
           onClick={() => {

  if (locked) {
    window.location.href = "/pricing"
    return
  }

  if (tab.key === "practice") {
    setView("rc")
  } else {
    setView(tab.key)
  }
}}
          >

            <div className="relative">

              <Icon size={22} />

             

            </div>

            <span>{tab.label}</span>

          </button>
        );
      })}
    </nav>
  );
}