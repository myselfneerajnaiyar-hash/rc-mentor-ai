"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { capturePurchasePixel } from "@/lib/analytics/conversionEvents.mjs"
import styles from "./page.module.css"

function formatMoney(value, currency) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value)
}

function formatDate(value, includeTime = false) {
  if (!value || !Number.isFinite(Date.parse(value))) return "—"
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
    timeZone: "Asia/Kolkata",
  }).format(new Date(value))
}

export default function PaymentSuccess() {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [returnTo, setReturnTo] = useState("/")

  useEffect(() => {
    let active = true
    const params = new URLSearchParams(window.location.search)
    setReturnTo(params.get("returnTo") === "/boot-camp" ? "/boot-camp" : "/")
    const orderId = params.get("orderId")
    async function load() {
      try {
        if (!orderId) throw new Error("Open this page from your completed payment to view its confirmation.")
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) throw new Error("Sign in to view your payment confirmation.")
        const response = await fetch(`/api/payment-success?orderId=${encodeURIComponent(orderId)}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || "We couldn't confirm this payment.")
        if (active) setOrder(result)
      } catch (loadError) {
        if (active) setError(loadError.message || "We couldn't confirm this payment.")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!order) return
    let active = true
    let timer
    let attempts = 0
    const fireWhenPixelReady = () => {
      if (!active) return
      if (typeof window.fbq === "function") {
        capturePurchasePixel({
          paymentId: order.paymentId,
          value: order.amountPaid,
          currency: order.currency,
          contentName: order.product.name,
          contentId: order.product.id,
          orderId: order.orderId,
          pixel: window.fbq,
        })
      } else if (++attempts < 25) {
        timer = window.setTimeout(fireWhenPixelReady, 200)
      }
    }
    fireWhenPixelReady()
    return () => { active = false; window.clearTimeout(timer) }
  }, [order])

  if (loading) return <main className={styles.page}><section className={styles.card} role="status"><div className={styles.spinner} /><p>Confirming your payment…</p></section></main>
  if (!order) return <main className={styles.page}><section className={styles.card}>
    <div className={styles.pendingIcon}>!</div><p className={styles.eyebrow}>PAYMENT CONFIRMATION</p>
    <h1>We couldn’t confirm this payment</h1><p className={styles.intro}>{error}</p>
    <a className={styles.secondaryCta} href="/">Return to Auctor</a>
  </section></main>

  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="payment-title">
      <div className={styles.successIcon} aria-hidden="true">✓</div>
      <p className={styles.eyebrow}>PAYMENT CONFIRMED</p>
      <h1 id="payment-title">Payment Successful</h1>
      <p className={styles.intro}>Your payment is complete and your access is now active.</p>

      <div className={styles.summary}>
        <h2>Order summary</h2>
        <div className={styles.row}><span>Product</span><strong>{order.product.name}</strong></div>
        <div className={styles.row}><span>Amount paid</span><strong>{formatMoney(order.amountPaid, order.currency)}</strong></div>
        <div className={styles.row}><span>Payment date</span><strong>{formatDate(order.paidAt, true)}</strong></div>
        <div className={styles.row}><span>Valid until</span><strong>{formatDate(order.validUntil)}</strong></div>
        <div className={styles.identifiers}><span>Order ID <b>{order.orderId}</b></span><span>Payment ID <b>{order.paymentId}</b></span></div>
      </div>

      <div className={styles.unlocked}>
        <h2>You now have access to</h2>
        <ul>{order.product.features.map(feature => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul>
      </div>
      <a className={styles.primaryCta} href={returnTo}>Continue to Dashboard <span aria-hidden="true">→</span></a>
    </section>
  </main>
}
