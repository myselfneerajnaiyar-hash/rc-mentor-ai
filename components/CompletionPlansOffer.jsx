import Link from "next/link"
import { useTenant } from "@/components/providers/TenantProvider"
import { getTrialPromotionState } from "@/lib/tenant/trialPromotions.mjs"

export default function CompletionPlansOffer({ className = "" }) {
  const { profile, entitlement } = useTenant()
  const trial = getTrialPromotionState({ profile, entitlement })
  if (trial.type !== "active") return null

  return (
    <aside className={`flex flex-col gap-3 rounded-2xl border border-orange-400/50 bg-gradient-to-r from-orange-950/80 via-slate-900 to-slate-900 p-4 shadow-lg shadow-orange-950/30 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${className}`.trim()} aria-label="Auctor plans offer">
      <p className="text-sm font-bold leading-relaxed text-white">Nice work. 30% off while your trial is on.</p>
      <Link href="/pricing?coupon=AUCTOR30&source=result_strip" data-pricing-source="result_strip" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:self-auto">
        See plans <span aria-hidden="true">→</span>
      </Link>
    </aside>
  )
}
