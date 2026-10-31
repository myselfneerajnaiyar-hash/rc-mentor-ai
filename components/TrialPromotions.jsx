"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { getSubscriptionPrice } from "@/lib/pricing/subscriptionPlans.mjs"
import { useTenant } from "@/components/providers/TenantProvider"
import { supabase } from "@/lib/supabase"
import { captureLearningEvent } from "@/lib/learningAnalytics"
import { captureFirstSessionEvent } from "@/lib/firstSession/analytics"
import {
  claimTrialEndedOffer,
  getTrialPromotionState,
} from "@/lib/tenant/trialPromotions.mjs"
import styles from "./trial-promotions.module.css"

const COUPON = "AUCTOR30"
const OFFERED_PLAN = "quarterly"
const TrialPromotionContext = createContext(null)

export function TrialPromotionProvider({ children }) {
  const pathname = usePathname()
  const tenant = useTenant()
  const [bootcampContext, setBootcampContext] = useState(null)
  const requestedToken = useRef(null)
  const onBootcampRoute = pathname === "/boot-camp" || pathname?.startsWith("/boot-camp/")

  useEffect(() => {
    if (!onBootcampRoute) {
      setBootcampContext(null)
      requestedToken.current = null
      return undefined
    }

    let active = true
    async function loadContext(session) {
      const token = session?.access_token
      if (!token) {
        requestedToken.current = null
        if (active) setBootcampContext(null)
        return
      }
      if (requestedToken.current === token) return
      requestedToken.current = token
      try {
        const response = await fetch("/api/session-context", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
        const context = response.ok ? await response.json().catch(() => null) : null
        if (active && context?.user?.id === session.user?.id) setBootcampContext(context)
      } catch {
        if (active) setBootcampContext(null)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadContext(session)
    })
    supabase.auth.getSession()
      .then(({ data, error }) => loadContext(error ? null : data?.session))
      .catch(() => { if (active) setBootcampContext(null) })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [onBootcampRoute])

  return (
    <TrialPromotionContext.Provider value={onBootcampRoute ? bootcampContext : tenant}>
      {children}
    </TrialPromotionContext.Provider>
  )
}

function useTrialNow(serverTime) {
  const [now, setNow] = useState(null)

  useEffect(() => {
    const serverAnchor = Date.parse(serverTime || "")
    const anchor = Number.isFinite(serverAnchor) ? serverAnchor : Date.now()
    const clientAnchor = Date.now()
    const update = () => setNow(anchor + (Date.now() - clientAnchor))
    update()
    const timer = window.setInterval(update, 60_000)
    return () => window.clearInterval(timer)
  }, [serverTime])

  return now === null ? null : new Date(now)
}

function usePromotionState() {
  const promotionContext = useContext(TrialPromotionContext)
  const tenant = useTenant()
  const context = promotionContext || tenant
  const { user, profile, entitlement, serverTime } = context
  const now = useTrialNow(serverTime)
  const state = useMemo(() => getTrialPromotionState({
    profile,
    entitlement,
    now: now || serverTime,
  }), [entitlement, now, profile, serverTime])
  return { user, profile, entitlement, now: now || serverTime, state }
}

export function TrialStatusChip({ className = "" }) {
  const { user, state } = usePromotionState()
  const trialDay = state.type === "active" ? state.trialDay : null

  useEffect(() => {
    if (!user?.id || !trialDay) return
    captureFirstSessionEvent("trial_tracker_seen", `${user.id}:${trialDay}`, {
      user_id: user.id,
      trial_day: trialDay,
      day_number: trialDay,
    }, `trial_tracker_seen_day_${trialDay}`)
  }, [trialDay, user?.id])

  if (state.type !== "active") return null

  return (
    <Link
      className={`${styles.statusChip} ${className}`.trim()}
      href="/pricing?source=trial_chip"
      data-pricing-source="trial_chip"
      aria-label={`Trial, ${state.daysRemaining} ${state.daysRemaining === 1 ? "day" : "days"} left. See plans`}
    >
      Trial · {state.daysRemaining} {state.daysRemaining === 1 ? "day" : "days"} left
    </Link>
  )
}

export function TrialOfferRibbon({ className = "", screen = "home" }) {
  const { state } = usePromotionState()
  if (state.type !== "active") return null

  return (
    <aside className={`${styles.ribbon} ${className}`.trim()} aria-label="Trial plan offer">
      <span>30% OFF · ENDS IN {state.daysRemaining} {state.daysRemaining === 1 ? "DAY" : "DAYS"}</span>
      <Link
        href={`/pricing?coupon=${COUPON}&source=ribbon`}
        data-pricing-source="ribbon"
        onClick={() => captureLearningEvent("pricing_ribbon_clicked", { screen })}
      >
        See plans <span aria-hidden="true">→</span>
      </Link>
    </aside>
  )
}

function formatPrice(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(paise) / 100)
}

function shouldOfferOnPath(pathname) {
  return ![
    "/pricing", "/login", "/signup", "/welcome", "/payment-success",
    "/checkout", "/first-session",
  ].some(path => pathname === path || pathname?.startsWith(`${path}/`))
}

export function TrialEndedOffer() {
  const pathname = usePathname()
  const { user, profile, entitlement, now, state } = usePromotionState()
  const [visibleKey, setVisibleKey] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [claimedInMemory, setClaimedInMemory] = useState(false)

  useEffect(() => {
    if (state.type !== "expired" || !user?.id || !shouldOfferOnPath(pathname) || claimedInMemory) return
    let dailyStorage
    let sessionStorage
    try {
      dailyStorage = window.localStorage
      sessionStorage = window.sessionStorage
    } catch {}
    const claimed = claimTrialEndedOffer({ userId: user.id, profile, entitlement, now, dailyStorage, sessionStorage })
    if (!claimed) return

    setClaimedInMemory(true)
    setDismissed(false)
    setVisibleKey(`${user.id}:${state.expiresAt}`)
  }, [claimedInMemory, entitlement, now, pathname, profile, state, user?.id])

  if (!visibleKey || dismissed || state.type !== "expired" || !shouldOfferOnPath(pathname)) return null

  const price = getSubscriptionPrice(OFFERED_PLAN, COUPON, 30)
  return (
    <div className={styles.overlay}>
      <section className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="trial-ended-title" data-testid="trial-ended-offer">
        <button type="button" className={styles.close} onClick={() => setDismissed(true)} aria-label="Dismiss offer">×</button>
        <p className={styles.eyebrow}>YOUR TRIAL HAS ENDED</p>
        <h2 id="trial-ended-title">Pick up where you left off.</h2>
        <p className={styles.offerCopy}>Get 30% off with <strong>{COUPON}</strong>.</p>
        <div className={styles.priceRow}>
          <span>3 Month plan</span>
          <strong>{formatPrice(price.finalPaise)}</strong>
          <del>{formatPrice(price.basePaise)}</del>
        </div>
        <Link
          className={styles.cta}
          href={`/pricing?coupon=${COUPON}&source=trial_ended`}
          data-pricing-source="trial_ended"
        >
          See plans <span aria-hidden="true">→</span>
        </Link>
        <button type="button" className={styles.notNow} onClick={() => setDismissed(true)}>Not now</button>
      </section>
    </div>
  )
}

export function ProfilePlanRow() {
  const { profile, entitlement, state } = usePromotionState()
  const planStatus = entitlement?.isInstituteStudent
    ? "Institute access"
    : entitlement?.isPremium || ["subscription", "premium", "cat_test_series"].includes(entitlement?.kind)
      ? "Subscription active"
      : state.type === "active"
        ? `Free trial · ${state.daysRemaining} ${state.daysRemaining === 1 ? "day" : "days"} left`
        : state.type === "expired"
          ? "Trial ended"
          : profile?.trial_expires_at
            ? "Free plan"
            : "No active plan"

  return (
    <section className={styles.profilePlan} aria-label="My plan">
      <div>
        <p className={styles.profileEyebrow}>MY PLAN</p>
        <h2>{planStatus}</h2>
        {state.type === "active" && <p>30% off when you pick a plan today.</p>}
      </div>
      <Link href="/pricing?source=profile_plan" data-pricing-source="profile_plan">
        See plans <span aria-hidden="true">→</span>
      </Link>
    </section>
  )
}
