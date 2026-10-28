"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import SubscribeButton from "@/components/SubscribeButton"
import PreviewNavbar from "@/components/PreviewNavbar"
import { useTenant } from "@/components/providers/TenantProvider"
import { getSubscriptionFeatures, getSubscriptionPlans, getSubscriptionPrice } from "@/lib/pricing/subscriptionPlans.mjs"
import { supabase } from "@/lib/supabase"

const PLANS = getSubscriptionPlans()

export default function Pricing() {
  const [user, setUser] = useState(null)
  const [couponInput, setCouponInput] = useState("AUCTOR30")
  const [appliedCoupon, setAppliedCoupon] = useState("")
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0)
  const [couponMessage, setCouponMessage] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)

  const { capabilities } = useTenant()
  const isCatStudent = capabilities?.isCAT === true
  const router = useRouter()
  const searchParams = useSearchParams()
  const couponFromUrl = searchParams.get("coupon") || ""
  const isBootcampOfferEntry = searchParams.get("offer") === "bootcamp"
  const returnTo = isBootcampOfferEntry || searchParams.get("returnTo") === "/boot-camp" ? "/boot-camp" : ""

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
    if (couponFromUrl) setCouponInput(couponFromUrl)
  }, [couponFromUrl])

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUser(data?.user || null)
    }).catch(() => {
      if (!cancelled) setUser(null)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <PreviewNavbar />
      <main className="relative min-h-screen overflow-hidden bg-[#0b0f2a] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-250px] h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[180px]" />
        <div aria-hidden="true" className="pointer-events-none absolute right-[-100px] top-[500px] h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[160px]" />

        <section style={{ marginTop: "clamp(5rem, 8vw, 8rem)" }} className="relative mx-auto max-w-7xl px-4 pb-12 pt-20 text-center sm:px-6 sm:pt-24">
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

        <section aria-label="Subscription plans" className="relative mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4 xl:gap-4">
            {PLANS.map((plan) => {
              const price = getSubscriptionPrice(plan.id, appliedCoupon, appliedCouponDiscount)
              const amount = price.finalPaise / 100
              const originalAmount = price.basePaise / 100
              const monthlyEquivalent = amount / plan.durationMonths
              const features = getSubscriptionFeatures(plan, isCatStudent)
              const isOfferPlan = isBootcampOfferEntry && plan.id === "quarterly"

              return (
                <article
                  key={plan.id}
                  data-plan={plan.id}
                  className={`relative flex min-w-0 flex-col rounded-3xl border bg-gradient-to-b from-slate-800/95 to-slate-950 p-5 shadow-xl transition sm:p-6 ${plan.featured ? "border-orange-400/70 ring-2 ring-orange-500/30" : isOfferPlan ? "border-emerald-400/70 ring-2 ring-emerald-500/20" : "border-slate-700/80"}`}
                >
                  {plan.badge && <span className="absolute right-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">{plan.badge}</span>}
                  {isOfferPlan && <span className="absolute right-4 top-4 rounded-full bg-emerald-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-950">Bootcamp offer</span>}

                  <header className="mb-5 min-h-[4.5rem] pr-20">
                    <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                    <p className="mt-1 text-sm leading-5 text-slate-400">{plan.description}</p>
                  </header>

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

                  <ul className="mb-7 flex-1 space-y-3 text-sm leading-5 text-slate-200">
                    {features.map((feature) => (
                      <li key={feature} className="flex gap-2"><span aria-hidden="true" className="text-emerald-400">✓</span><span>{feature}</span></li>
                    ))}
                  </ul>

                  <SubscribeButton
                    plan={plan.id}
                    label={`Choose ${plan.name} · ${formatRupees(amount)}`}
                    user={user}
                    couponCode={appliedCoupon}
                    returnTo={returnTo}
                    variant="premium"
                  />
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
    </>
  )
}

function formatRupees(value) {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 })}`
}
