"use client"

import { BarChart3, BookOpen, BrainCircuit, Sparkles, Trophy, Zap } from "lucide-react"
import TenantLogo from "@/components/tenant/TenantLogo"

const features = [
  [BrainCircuit, "AI Mentor Birbal"],
  [Zap, "Daily RC Workouts"],
  [Trophy, "Leaderboards & Streaks"],
  [BarChart3, "Deep Performance Analytics"],
  [BookOpen, "Unlimited RC Generator"],
  [Sparkles, "CAT RC Sections"],
]

export default function AuthMobileIntro({ branding }) {
  return (
    <section className="auth-mobile-intro" aria-label={`${branding.brandName} introduction`}>
      <div className="auth-mobile-intro-brand">
        <TenantLogo className="auth-mobile-intro-logo" />
        <div>
          <p>{branding.brandName}</p>
          {branding.isInstitute && <span>Powered by Auctor Labs</span>}
        </div>
      </div>
      <h2>Train your reading intelligence.</h2>
      <p className="auth-mobile-intro-copy">A focused learning system designed to turn every passage into measurable progress.</p>
      <ul className="auth-mobile-features">
        {features.map(([Icon, label]) => (
          <li key={label}><span><Icon aria-hidden="true" /></span>{label}</li>
        ))}
      </ul>
    </section>
  )
}
