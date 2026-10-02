"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useTenant } from "@/components/providers/TenantProvider"
import { getTrialBannerState, trialBannerDismissalKey } from "@/lib/tenant/trialBanner"

const COUPON = "AUCTOR20"

export default function TrialConversionBanner() {
  const { profile, entitlement, serverTime } = useTenant()
  const [coupon, setCoupon] = useState(null)
  const [now, setNow] = useState(null)
  const [dismissal, setDismissal] = useState({ key: null, dismissed: false, ready: false })

  useEffect(() => {
    const anchor = Date.parse(serverTime || "")
    const clientAnchor = Date.now()
    if (!Number.isFinite(anchor)) return
    const update = () => setNow(anchor + (Date.now() - clientAnchor))
    update()
    const timer = window.setInterval(update, 60_000)
    return () => window.clearInterval(timer)
  }, [serverTime])

  const state = useMemo(() => getTrialBannerState({
    entitlement,
    trialStartedAt: profile?.trial_started_at,
    trialExpiresAt: profile?.trial_expires_at,
    now: now === null ? serverTime : new Date(now),
  }), [entitlement, profile?.trial_started_at, profile?.trial_expires_at, now, serverTime])
  const dismissalKey = trialBannerDismissalKey(state)

  useEffect(() => {
    if (state.type === "none") {
      setDismissal({ key: null, dismissed: false, ready: true })
      return
    }
    let dismissed = false
    try { dismissed = window.sessionStorage.getItem(dismissalKey) === "1" } catch {}
    setDismissal({ key: dismissalKey, dismissed, ready: true })
  }, [dismissalKey, state.type])

  useEffect(() => {
    if (state.type === "none") {
      setCoupon(null)
      return
    }
    let cancelled = false
    fetch("/api/validate-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couponCode: COUPON }),
      cache: "no-store",
    }).then(response => response.json().then(result => ({ ok: response.ok, result })))
      .then(({ ok, result }) => {
        if (!cancelled) setCoupon(ok && result.valid ? { code: result.code, discountPercent: result.discountPercent } : null)
      })
      .catch(() => { if (!cancelled) setCoupon(null) })
    return () => { cancelled = true }
  }, [state.type])

  if (state.type === "none" || !dismissal.ready || dismissal.key !== dismissalKey || dismissal.dismissed) return null

  const messages = {
    offer: {
      headline: "Keep your VARC momentum going.",
      body: coupon
        ? `Unlock your complete practice journey. Get ${coupon.discountPercent}% off with ${coupon.code}.`
        : "Unlock your complete practice journey with Premium.",
      cta: "Unlock Premium",
    },
    ending: {
      headline: "Your free trial ends soon.",
      body: coupon
        ? `Continue your CAT VARC preparation without interruption. Use ${coupon.code} for ${coupon.discountPercent}% off.`
        : "Continue your CAT VARC preparation without interruption with Premium.",
      cta: "Continue with Premium",
    },
    expired: {
      headline: "Your free trial has ended.",
      body: coupon
        ? `Ready to continue your CAT VARC preparation? Use ${coupon.code} for ${coupon.discountPercent}% off Premium.`
        : "Ready to continue your CAT VARC preparation? Explore Premium.",
      cta: "Reactivate Premium",
    },
  }
  const message = messages[state.type]
  const pricingHref = coupon ? `/pricing?coupon=${encodeURIComponent(coupon.code)}` : "/pricing"

  function dismiss() {
    try { window.sessionStorage.setItem(dismissalKey, "1") } catch {}
    setDismissal({ key: dismissalKey, dismissed: true, ready: true })
  }

  return (
    <aside className={`relative rounded-2xl border px-4 py-3 pr-11 sm:px-5 sm:py-4 ${state.type === "expired" ? "border-amber-400/40 bg-amber-400/10" : state.type === "ending" ? "border-orange-400/40 bg-orange-400/10" : "border-indigo-400/35 bg-indigo-400/10"}`} aria-label="Premium subscription offer">
      <button type="button" onClick={dismiss} className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Dismiss offer">×</button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white sm:text-base">{message.headline}</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">{message.body}</p>
        </div>
        <Link href={pricingHref} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
          {message.cta}
        </Link>
      </div>
    </aside>
  )
}
