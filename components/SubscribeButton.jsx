"use client"



export default function SubscribeButton({
  amount,
  label,
  user,
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

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
        }),
      })

      const order = await res.json()

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,

        amount: order.amount,
        currency: "INR",

        name: "AuctorRC",
        description: "RC Intelligence Subscription",

        order_id: order.id,

        handler: async function (response) {

          const verify = await fetch("/api/verify-payment", {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              razorpay_order_id:
                response.razorpay_order_id,

              razorpay_payment_id:
                response.razorpay_payment_id,

              razorpay_signature:
                response.razorpay_signature,

              user_id: user.id,

              plan:
                amount === 399
                  ? "monthly"
                  : "yearly",
            }),
          })

          const result = await verify.json()

          if (result.success) {

            alert("Payment verified 🎉 Premium unlocked")

            window.location.href =
              "/payment-success"

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
            ? "bg-black text-white hover:bg-gray-900"
            : "bg-indigo-600 text-white hover:bg-indigo-500"
        }`}
      >
        {label}
      </button>
    </>
  )
}