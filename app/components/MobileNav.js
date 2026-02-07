"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/practice-rc", label: "Practice", icon: "📘" },
    { href: "/vocabulary", label: "Vocab", icon: "📚" },
    { href: "/speedgym", label: "Speed", icon: "⚡" },
    { href: "/cat-arena", label: "Tests", icon: "🧠" },
  ];

  return (
    <nav className="mobile-nav">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={pathname === tab.href ? "active" : ""}
        >
          <span className="icon">{tab.icon}</span>
          <span className="label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
