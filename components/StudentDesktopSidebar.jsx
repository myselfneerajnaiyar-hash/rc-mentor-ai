"use client"

import { BookOpen, Brain, Flame, GraduationCap, Home, MessageSquare, Puzzle, SpellCheck, Target, Timer, Trophy, User } from "lucide-react"
import { TrialStatusChip } from "@/components/TrialPromotions"
import TenantLogo from "@/components/tenant/TenantLogo"
import { GRAMMAR_ENABLED } from "@/lib/mobile/features.mjs"
import usePricingVisibility from "@/components/usePricingVisibility"

const FREE_VIEWS = new Set(["home", "bootcamp", "workout", "hangman", "profile", "cat"])

export function getStudentNavigationItems({ capabilities = {}, entitlement = {}, showPricing = true } = {}) {
  return [
    { id: "home", label: "Home", icon: Home },
    ...(capabilities.isCAT ? [{ id: "bootcamp", label: "Boot Camp", icon: Target }] : []),
    { id: "workout", label: "Daily Workout", icon: Flame },
    { id: "rc", label: "RC", icon: Brain },
    { id: "precision", label: "Precision Training", icon: Target },
    ...(capabilities.showCATSectionals ? [{ id: "cat", label: "CAT", icon: GraduationCap }] : []),
    { id: "vocab", label: "Vocab", icon: BookOpen },
    ...(GRAMMAR_ENABLED ? [{ id: "grammar", label: "Grammar", icon: SpellCheck }] : []),
    { id: "speed", label: "Speed", icon: Timer },
    { id: "hangman", label: "Word Hunt", icon: Puzzle },
    { id: "mentor", label: "Ask Birbal", icon: MessageSquare },
    ...(showPricing && !entitlement.isInstituteStudent ? [{ id: "premium", label: "See plans", icon: Trophy }] : []),
    { id: "profile", label: "Profile", icon: User },
  ]
}

export default function StudentDesktopSidebar({
  branding,
  capabilities,
  entitlement,
  activeView = "home",
  hasPremiumAccess = false,
  onNavigate,
  navItems: providedNavItems,
}) {
  const showPricing = usePricingVisibility()
  const navItems = providedNavItems || getStudentNavigationItems({ capabilities, entitlement, showPricing })

  return (
    <aside
      aria-label="Student navigation"
      data-testid="student-desktop-sidebar"
      className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/90 p-6 backdrop-blur-md md:flex"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <TenantLogo className="h-10 w-10 rounded-xl object-contain" />
          <h2 className="text-xl font-semibold tracking-tight text-white">{branding?.brandName || "Auctor RC"}</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">{branding?.isInstitute ? "Powered by Auctor Labs" : "Powered by Birbal"}</p>
        <TrialStatusChip className="mt-4 self-start" />
        <div className="mt-6 h-px bg-slate-800" />
      </div>

      <p className="mb-3 mt-6 text-xs uppercase tracking-wider text-slate-500">Navigation</p>
      <nav className="mt-6 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const locked = !FREE_VIEWS.has(item.id) && !hasPremiumAccess
          const active = activeView === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate?.(item, locked)}
              className={`flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${active
                ? item.id === "mentor" ? "border border-purple-500/30 bg-purple-600/20 text-purple-400" : "brand-nav-active border"
                : locked ? "text-slate-500 opacity-70 hover:bg-slate-800/40" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              <span className="flex min-w-0 flex-1 items-center gap-2 leading-tight">
                <span>{item.label}</span>
                {item.unreadCount > 0 && <span className="ml-auto min-w-5 rounded-full bg-indigo-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">{item.unreadCount > 99 ? "99+" : item.unreadCount}</span>}
                {locked && <span className="ml-1 text-[10px] opacity-50" aria-label="Premium feature">🔒</span>}
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
