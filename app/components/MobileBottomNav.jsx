import {
  Home,
  BookOpen,
  Timer,
  BookText,
  GraduationCap
} from "lucide-react";

const tabs = [
  { key: "home", label: "Home", icon: Home },
  { key: "rc", label: "RC", icon: BookOpen },
  { key: "speed", label: "Speed", icon: Timer },
  { key: "vocab", label: "Vocab", icon: BookText },
  { key: "cat", label: "CAT", icon: GraduationCap },
];

export default function MobileBottomNav({ view, setView }) {
  return (
    <nav className="mobile-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = view === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={active ? "active" : ""}
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
