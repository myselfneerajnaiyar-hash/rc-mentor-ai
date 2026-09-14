"use client";

import {
  Home,
  MessageSquare,
  BookOpen,
  GraduationCap,
  User,
  Inbox,
} from "lucide-react";

import { useRouter } from "next/navigation";

export default function MobileBottomNav({
  view,
  setView,
  hasPremiumAccess,
  exam,
  capabilities,
  chatOpen,
  inboxUnreadCount = 0,
}) {

  if (chatOpen) return null;

  const router = useRouter();

  const tabs = [
  {
    key: "home",
    label: "Home",
    icon: Home,
  },
  {
    key: "inbox",
    label: "Inbox",
    icon: Inbox,
  },

  

  {
    key: "practice",
    label: "Practice",
    icon: BookOpen,
  },

  ...(capabilities?.showCATSectionals
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
   <nav
  className={`mobile-nav mobile-only safe-bottom-nav ${
    chatOpen ? "hidden" : ""
  }`}
>

      {tabs.map((tab) => {
        const freeViews = ["home", "inbox", "workout", "hangman", "cat", "profile",];

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

  if (tab.key === "inbox") {
    router.push("/inbox")
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

              {tab.key === "inbox" && inboxUnreadCount > 0 && (
                <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-indigo-500 px-1 py-px text-center text-[9px] font-bold text-white">
                  {inboxUnreadCount > 99 ? "99+" : inboxUnreadCount}
                </span>
              )}

             

            </div>

            <span>{tab.label}</span>

          </button>
        );
      })}
    </nav>
  );
}
