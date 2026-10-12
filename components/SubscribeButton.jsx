"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { attributionParams, readBrowserAttribution } from "@/lib/attribution.mjs"


export default function SubscribeButton({
  plan,
  label,
  user,
  couponCode = "",
  returnTo = "",
  variant = "primary",
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [referralInput, setReferralInput] = useState("")
  const [appliedReferralCode, setAppliedReferralCode] = useState("")
  const [referralMessage, setReferralMessage] = useState("")
  const [validatingReferral, setValidatingReferral] = useState(false)

  async function initializeRazorpay() {

  if (window.Razorpay) {
    return true
  }

  return new Promise((resolve) => {

    const script =
      document.createElement("script")

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js"

    script.onload = () => {
      resolve(true)
    }

    script.onerror = () => {
      resolve(false)
    }

    document.body.appendChild(script)

  })
}

  async function startPayment(referralCode = "") {

    try {

      if (!user?.id) {
        alert("Please login first")
        return
      }

      const razorpayLoaded =
  await initializeRazorpay()

if (!razorpayLoaded) {

  alert(
    "Secure payment gateway could not initialize. Please try again."
  )

  return
}

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error("Please sign in again before checkout.")

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan,
          referralCode,
          couponCode,
        }),
      })

      const order = await res.json()
      if (!res.ok) throw new Error(order.error || "Unable to create payment order")

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,

        amount: order.amount,
        currency: "INR",

        name: "AuctorRC",
        description: plan === "bootcamp_full_access"
          ? "45-Day VARC Boot Camp + 3 Months of Full Auctor Access"
          : plan === "quarterly"
            ? "3 Months of Full Auctor Access + VARC Boot Camp"
            : "RC Intelligence Subscription",

        order_id: order.id,

        handler: async function (response) {
          const { data: { session: verificationSession } } = await supabase.auth.getSession()
          if (!verificationSession?.access_token) {
            alert("Payment received. Sign in again to finish confirming access.")
            return
          }

          const verify = await fetch("/api/verify-payment", {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${verificationSession.access_token}`,
            },

         body: JSON.stringify({
  razorpay_order_id: response.razorpay_order_id,
  razorpay_payment_id: response.razorpay_payment_id,
  razorpay_signature: response.razorpay_signature,
}),
          })

          const result = await verify.json()
          console.log(result);
          console.log("VERIFY STATUS", verify.status);

          if (result.success) {
            if (!result.purchase?.orderId) {
              alert("Payment is confirmed, but its summary is still being prepared. Please contact support if it does not appear shortly.")
              return
            }

            const successParams = new URLSearchParams({ orderId: result.purchase.orderId })
            for (const [key, value] of attributionParams(readBrowserAttribution())) successParams.set(key, value)
            if (returnTo === "/boot-camp") successParams.set("returnTo", "/boot-camp")
            window.location.href = `/payment-success?${successParams.toString()}`

          } else {

            alert("Payment verification failed")
          }
        },

        theme: {
          color: "#7c3aed",
        },
      }

      const rzp = new window.Razorpay(options)

      rzp.open()

    } catch (err) {

      console.error(err)

      alert(err?.message || "Payment failed to start")
    }
  }

  async function applyReferralCode() {
    const normalizedCode = referralInput.trim().toUpperCase()
    if (!normalizedCode) {
      setReferralMessage("Enter a referral code to apply it.")
      setAppliedReferralCode("")
      return
    }

    setValidatingReferral(true)
    setReferralMessage("")
    try {
      const { data, error } = await supabase
        .from("campus_ambassadors")
        .select("referral_code")
        .eq("referral_code", normalizedCode)
        .eq("status", "active")
        .maybeSingle()

      if (error || !data) {
        setAppliedReferralCode("")
        setReferralMessage("Invalid referral code.")
        return
      }

      setAppliedReferralCode(data.referral_code)
      setReferralInput(data.referral_code)
      setReferralMessage("Referral code applied. The final price will be confirmed at checkout.")
    } catch {
      setAppliedReferralCode("")
      setReferralMessage("Referral validation is temporarily unavailable. Please try again.")
    } finally {
      setValidatingReferral(false)
    }
  }

  function openCheckout() {
    if (!user?.id) {
      alert("Please login first")
      return
    }
    if (couponCode) {
      startPayment()
      return
    }
    setCheckoutOpen(true)
  }

  function continueToPayment() {
    if (referralInput.trim() && !appliedReferralCode) {
      setReferralMessage("Apply a valid referral code or clear the field to continue.")
      return
    }
    setCheckoutOpen(false)
    startPayment(appliedReferralCode)
  }

  return (
    <>
      <button
        onClick={openCheckout}
        className={`w-full font-semibold py-4 text-lg rounded-xl transition shadow-lg hover:shadow-xl
        ${
         variant === "premium"
? "bg-indigo-600 text-white hover:bg-indigo-500"
: "bg-indigo-600 text-white hover:bg-indigo-500"
        }`}
      >
        {label}
      </button>
      {checkoutOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCheckoutOpen(false)
        }}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-referral-title"
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl"
          >
            <h2 id="checkout-referral-title" className="text-xl font-bold">Checkout</h2>
            <p className="mt-2 text-sm text-slate-300">Add an optional referral code before continuing to secure payment.</p>
            <label htmlFor="checkout-referral-code" className="mb-2 mt-5 block text-sm font-semibold text-slate-200">Referral Code (Optional)</label>
            <div className="flex gap-2">
              <input
                id="checkout-referral-code"
                type="text"
                value={referralInput}
                onChange={(event) => {
                  setReferralInput(event.target.value.toUpperCase())
                  setAppliedReferralCode("")
                  setReferralMessage("")
                }}
                className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
              />
              <button
                type="button"
                onClick={applyReferralCode}
                disabled={validatingReferral || !referralInput.trim()}
                className="rounded-xl border border-slate-600 px-4 py-2 font-semibold disabled:opacity-50"
              >
                {validatingReferral ? "Checking…" : appliedReferralCode ? "Applied" : "Apply"}
              </button>
            </div>
            {referralMessage && <p role="status" className="mt-3 text-sm text-slate-300">{referralMessage}</p>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <button type="button" onClick={continueToPayment} disabled={validatingReferral} className="min-h-11 flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                Continue to secure payment
              </button>
              <button type="button" onClick={() => setCheckoutOpen(false)} className="min-h-11 rounded-xl border border-slate-600 px-4 py-3 font-semibold text-slate-200">
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
