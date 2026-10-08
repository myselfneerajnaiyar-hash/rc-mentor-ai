"use client"

import { supabase } from "@/lib/supabase"


export default function SubscribeButton({
  amount,
  plan,
  label,
  user,
  referralCode = "",
  couponCode = "",
  returnTo = "",
  variant = "primary",
}) {

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

  async function startPayment() {

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
        description: "RC Intelligence Subscription",

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

      alert("Payment failed to start")
    }
  }

  return (
    <>
    
      <button
        onClick={startPayment}
        className={`w-full font-semibold py-4 text-lg rounded-xl transition shadow-lg hover:shadow-xl
        ${
         variant === "premium"
? "bg-indigo-600 text-white hover:bg-indigo-500"
: "bg-indigo-600 text-white hover:bg-indigo-500"
        }`}
      >
        {label}
      </button>
    </>
  )
}
