"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import SubscribeButton from "@/components/SubscribeButton"
import PreviewNavbar from "@/components/PreviewNavbar"
import StudentDesktopSidebar from "@/components/StudentDesktopSidebar"
import TenantLogo from "@/components/tenant/TenantLogo"
import { TrialStatusChip } from "@/components/TrialPromotions"
import { useTenant } from "@/components/providers/TenantProvider"
import { FEATURES } from "@/lib/mobile/features.mjs"
import { getSubscriptionFeatures, getSubscriptionPlans, getSubscriptionPrice } from "@/lib/pricing/subscriptionPlans.mjs"
import { captureLearningEvent } from "@/lib/learningAnalytics"
import { getPricingLogoDestination } from "@/lib/navigation/pricingLogoDestination.mjs"

const PLAN_ORDER = ["quarterly", "monthly", "half_yearly", "yearly"]
const PLANS = [...getSubscriptionPlans()].sort((a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id))

export default function Pricing() {
  const [couponInput, setCouponInput] = useState("AUCTOR30")
  const [appliedCoupon, setAppliedCoupon] = useState("")
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0)
  const [couponMessage, setCouponMessage] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState("quarterly")
  const lastPricingView = useRef(null)
  const lastAutoCoupon = useRef(null)

  const { capabilities, user, branding, entitlement } = useTenant()
  const isCatStudent = capabilities?.isCAT === true
  const router = useRouter()
  const searchParams = useSearchParams()
  const couponFromUrl = searchParams.get("coupon") || ""
  const dashboardOrigin = searchParams.get("source") === "dashboard_nav"
  const pricingLogoHref = getPricingLogoDestination({ authenticated: Boolean(user), dashboardOrigin })
  const isBootcampOfferEntry = searchParams.get("offer") === "bootcamp"
  const returnTo = isBootcampOfferEntry || searchParams.get("returnTo") === "/boot-camp" ? "/boot-camp" : ""

  useEffect(() => {
    const requestedPlan = searchParams.get("plan")
    if (requestedPlan && PLANS.some((plan) => plan.id === requestedPlan)) {
      setSelectedPlanId(requestedPlan)
    }
  }, [searchParams])

  useEffect(() => {
    const source = searchParams.get("source") || (searchParams.get("offer") === "bootcamp" ? "bootcamp_offer" : "direct")
    const viewKey = `${source}:${couponFromUrl}:${searchParams.get("offer") || ""}:${searchParams.get("returnTo") || ""}`
    if (lastPricingView.current === viewKey) return
    lastPricingView.current = viewKey
    captureLearningEvent("pricing_viewed", { source, pricing_source: source })
  }, [couponFromUrl, searchParams])

  const applyCoupon = useCallback(async (value) => {
    const code = value.trim()
    if (!code) {
      setAppliedCoupon("")
      setAppliedCouponDiscount(0)
      setCouponMessage("Enter a coupon code to apply it.")
      return false
    }

    setCouponLoading(true)
    try {
      const response = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: code }),
      })
      const result = await response.json()
      if (!response.ok || !result.valid) {
        setAppliedCoupon("")
        setAppliedCouponDiscount(0)
        setCouponMessage("Invalid or expired coupon code.")
        return false
      }
      setAppliedCoupon(result.code)
      setAppliedCouponDiscount(result.discountPercent)
      setCouponInput(result.code)
      setCouponMessage(`${result.code} applied — ${result.discountPercent}% off`)
      captureLearningEvent("coupon_applied", { coupon_code: result.code, discount_percent: result.discountPercent })
      return true
    } catch {
      setAppliedCoupon("")
      setAppliedCouponDiscount(0)
      setCouponMessage("Coupon validation is temporarily unavailable. Please try again.")
      return false
    } finally {
      setCouponLoading(false)
    }
  }, [])

  useEffect(() => {
    const code = couponFromUrl || "AUCTOR30"
    setCouponInput(code)
    if (lastAutoCoupon.current === code) return
    lastAutoCoupon.current = code
    void applyCoupon(code)
  }, [applyCoupon, couponFromUrl])

  return (
    <div data-pricing-layout={user ? "authenticated" : "public"} className={user ? "flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white md:flex-row" : "min-h-screen"}>
      {user && (
        <StudentDesktopSidebar
          branding={branding}
          capabilities={capabilities}
          entitlement={entitlement}
          activeView="premium"
          hasPremiumAccess={Boolean(entitlement?.hasAccess)}
          onNavigate={(item, locked) => {
            if (item.id === "premium") return
            if (item.id === "bootcamp") { router.push("/boot-camp"); return }
            if (locked) {
              const feature = FEATURES.find((candidate) => candidate.id === item.id)
              router.push(`/pricing?source=dashboard_locked_feature&returnTo=${encodeURIComponent(feature?.href || "/")}`)
              return
            }
            router.push(`/?view=${encodeURIComponent(item.id)}`)
          }}
        />
      )}
      <div className="min-w-0 flex-1">
      {user ? (
        <div className="dashboard-mobile-header mb-3 flex min-w-0 items-center gap-3 px-4 pt-4 md:hidden">
          <Link href="/" aria-label="Back to dashboard"><TenantLogo className="h-9 w-9 shrink-0 rounded-lg object-contain" /></Link>
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{branding?.brandName || "Auctor RC"}</p><p className="text-xs text-slate-400">Pricing</p></div>
          <TrialStatusChip />
        </div>
      ) : <PreviewNavbar homeHref={pricingLogoHref} />}
      <main className={`relative min-h-screen overflow-hidden text-white ${user ? "bg-slate-900/30" : "bg-[#0b0f2a]"}`}>
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-250px] h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[180px]" />
        <div aria-hidden="true" className="pointer-events-none absolute right-[-100px] top-[500px] h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[160px]" />

        <section style={{ marginTop: user ? 0 : "clamp(5rem, 8vw, 8rem)" }} className={`relative mx-auto max-w-7xl px-4 pb-12 text-center sm:px-6 ${user ? "pt-8" : "pt-20 sm:pt-24"}`}>
          <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Train Like a <span className="text-orange-400">99 Percentiler</span>
          </h1>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-gray-300 sm:text-lg md:text-xl">
            Choose a plan for structured training, AI mentorship, analytics, and unlimited practice.
          </p>
        </section>

        <section aria-label="Apply a coupon" className="relative mx-auto mb-10 max-w-md px-4 sm:px-6">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 sm:p-6">
            <label htmlFor="pricing-coupon" className="mb-2 block text-left text-sm font-semibold text-slate-200">Coupon Code</label>
            <div className="flex gap-2">
              <input
                id="pricing-coupon"
                type="text"
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
              <Button type="button" disabled={couponLoading} onClick={() => applyCoupon(couponInput)}>
                {couponLoading ? "Checking…" : "Apply"}
              </Button>
            </div>
            {couponMessage && (
              <p role="status" className={`mt-3 rounded-xl border px-3 py-2 text-sm font-medium ${appliedCoupon ? "border-green-500/50 bg-green-500/10 text-green-300" : "border-red-500/50 bg-red-500/10 text-red-300"}`}>
                {couponMessage}
              </p>
            )}
          </div>
        </section>

        <section aria-label="Subscription plans" data-selected-plan={selectedPlanId} className="relative mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4 xl:gap-4">
            {PLANS.map((plan) => {
              const price = getSubscriptionPrice(plan.id, appliedCoupon, appliedCouponDiscount)
              const amount = price.finalPaise / 100
              const originalAmount = price.basePaise / 100
              const monthlyEquivalent = amount / plan.durationMonths
              const features = getSubscriptionFeatures(plan, isCatStudent)
              const isOfferPlan = isBootcampOfferEntry && plan.id === "quarterly"
              const isSelected = selectedPlanId === plan.id
              const planName = plan.id === "quarterly" ? "3 Month" : plan.name

              return (
                <article
                  key={plan.id}
                  data-plan={plan.id}
                  data-selected={isSelected ? "true" : "false"}
                  className={`relative flex min-w-0 flex-col rounded-3xl border bg-gradient-to-b from-slate-800/95 to-slate-950 p-5 shadow-xl transition sm:p-6 ${isSelected ? "border-orange-300 ring-2 ring-orange-400/70 shadow-orange-950/40" : isOfferPlan ? "border-emerald-400/70 ring-2 ring-emerald-500/20" : "border-slate-700/80"}`}
                >
                  {plan.badge && <span className="absolute right-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">{plan.badge}</span>}
                  {isOfferPlan && <span className="absolute right-4 top-4 rounded-full bg-emerald-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-950">Bootcamp offer</span>}

                  <header className="mb-5 min-h-[4.5rem] pr-20">
                    <h2 className="text-2xl font-bold text-white">{planName}</h2>
                    <p className="mt-1 text-sm leading-5 text-slate-400">{plan.description}</p>
                  </header>

                  <Button
                    type="button"
                    variant="outline"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`mb-5 h-11 w-full rounded-xl text-sm font-semibold ${isSelected ? "border-orange-300 bg-orange-400/15 text-orange-100 hover:bg-orange-400/20" : "border-slate-600 bg-slate-900/70 text-slate-200 hover:bg-slate-800"}`}
                  >
                    {isSelected ? `Selected: ${planName}` : `Select ${planName}`}
                  </Button>

                  <div className="mb-5 border-b border-slate-700/80 pb-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{appliedCoupon ? "You pay" : "Plan price"}</p>
                    <p className="mt-1 whitespace-nowrap text-4xl font-black tracking-tight text-white sm:text-5xl">{formatRupees(amount)}</p>
                    <p className="mt-2 text-sm text-slate-400">{formatRupees(monthlyEquivalent)} / month</p>
                    {appliedCoupon && (
                      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <del className="text-slate-500">{formatRupees(originalAmount)}</del>
                        <span className="font-semibold text-emerald-300">{appliedCouponDiscount}% coupon applied</span>
                      </div>
                    )}
                    {!appliedCoupon && <p className="mt-3 text-sm text-slate-400">Billed {plan.durationMonths === 1 ? "monthly" : `every ${plan.durationMonths} months`}</p>}
                  </div>

                  {isSelected && (
                    <div className="mb-6">
                      <SubscribeButton
                        plan={plan.id}
                        label={`Continue with ${planName} · ${formatRupees(amount)}`}
                        user={user}
                        couponCode={appliedCoupon}
                        returnTo={returnTo}
                        variant="premium"
                        source="pricing_plan"
                      />
                    </div>
                  )}

                  <ul className="mb-7 flex-1 space-y-3 text-sm leading-5 text-slate-200">
                    {features.map((feature) => (
                      <li key={feature} className="flex gap-2"><span aria-hidden="true" className="text-emerald-400">✓</span><span>{feature}</span></li>
                    ))}
                  </ul>

                </article>
              )
            })}
          </div>

          <div className="mt-12 text-center text-sm text-gray-400">
            <p className="mb-2">Secure payments powered by Razorpay</p>
            <p>No hidden charges</p>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="h-12 rounded-2xl border border-slate-700 bg-slate-900/60 px-8 text-slate-200 transition-all duration-300 hover:bg-slate-800 hover:text-white"
            >
              ← Back to Dashboard
            </Button>
          </div>
        </section>
      </main>
      </div>
    </div>
  )
}

function formatRupees(value) {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 })}`
}
