"use client"

import { useRouter } from "next/navigation"
import SubscribeButton from "@/components/SubscribeButton"

export default function PricingPage() {

  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">

      <div className="max-w-5xl mx-auto">

        {/* HEADER */}

        <h1 className="text-5xl font-bold text-center">
💪 Train Like a 99 Percentiler
</h1>

        <p className="text-slate-400 text-center mt-5 max-w-2xl mx-auto">
Most CAT aspirants lose RC marks not because they can't read —
but because they fall for *trap options*.
<br /><br />
Birbal trains you to detect author intention, avoid traps,
and build *elite reading intelligence.*
</p>
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500 rounded-xl p-5 text-center mt-8">
<span className="text-indigo-400 font-semibold">
🔥 7 Day Free Trial
</span>

<span className="text-slate-300 ml-2">
* Cancel Anytime
</span>
</div>
        {/* FEATURES */}

        <div className="grid md:grid-cols-2 gap-6 mt-12">

          <Feature text="Identify trap options instantly" />
<Feature text="Understand author intention clearly" />
<Feature text="Diagnose your RC weaknesses automatically" />
<Feature text="Build elite reading speed" />
<Feature text="AI mentor for every mistake" />
<Feature text="Structured daily RC training system" />
        </div>


        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 mt-16 max-w-3xl mx-auto text-center">

<div className="text-indigo-400 font-semibold mb-2">
💬 Birbal says
</div>

<p className="text-slate-300 leading-relaxed">
Most students read passages.
Top scorers read the *author's mind*.
</p>

<p className="text-slate-400 mt-3">
I'll teach you to see what trap options are trying to hide.
</p>

</div>

<div className="h-px bg-slate-800 my-16"></div>

        {/* PRICING */}

        <div className="grid md:grid-cols-2 gap-8 mt-16">

          {/* MONTHLY */}

         <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 hover:border-indigo-500 transition">

           <h3 className="text-xl font-semibold">
📅 Monthly
</h3>

            <p className="text-4xl font-bold mt-4">
              ₹399
              <span className="text-sm text-slate-400">
                /month
              </span>
            </p>

            <p className="text-slate-400 mt-2">
              Flexible plan for short-term prep
            </p>

            <div className="mt-6">
             <SubscribeButton
  amount={399}
  label="Start Monthly"
  variant="primary"
/>
            </div>

          </div>

          {/* YEARLY */}

         <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-10 relative shadow-2xl scale-105 border border-indigo-400/40">

           <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
🔥 MOST POPULAR
</div>

            <h3 className="text-xl font-bold">
              Yearly
            </h3>

            <p className="mt-3 text-sm line-through text-indigo-200">
              ₹399 × 12 = ₹4788
            </p>

            <p className="text-5xl font-bold mt-2">
              ₹1999
              <span className="text-sm">
                /year
              </span>
            </p>

           <p className="text-indigo-100 mt-2">
💰 Only ₹166 / month
</p>

           <p className="text-orange-300 mt-2 font-medium">
🔥 Save ₹2789
</p>
            <div className="mt-6">
             <SubscribeButton
  amount={1999}
  label="🚀 Unlock Birbal Premium"
  variant="premium"
/>
<p className="text-xs text-slate-400 text-center mt-2">
🔒 Secure payment powered by Razorpay
</p>
            </div>

          </div>

        </div>

        <div className="text-center mt-16">

<p className="text-slate-400">
Students using Birbal improve RC accuracy by
<span className="text-green-400 font-semibold"> 18–32% </span>
within the first 30 days.
</p>

</div>





<div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center mt-14">

<h3 className="text-xl font-semibold text-white">
💡 Why Students Choose Birbal
</h3>

<p className="text-slate-400 mt-4">
Most CAT aspirants spend thousands on mock tests and coaching.
</p>

<div className="grid md:grid-cols-3 gap-6 mt-8 text-sm">

<div className="bg-slate-800 p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition">
<p className="text-slate-400">1 Mock Test</p>
<p className="text-lg font-semibold">₹500 – ₹1000</p>
</div>

<div className="bg-slate-800 p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition">
<p className="text-slate-400">Coaching RC Module</p>
<p className="text-lg font-semibold">₹5,000+</p>
</div>

<div className="bg-indigo-600 p-5 rounded-xl">
<p className="text-indigo-100">Birbal Premium</p>
<p className="text-2xl font-bold">₹1999 / year</p>
</div>

</div>

<p className="text-emerald-400 mt-6 font-semibold">
🎯 Less than the cost of 2 mock tests.
</p>

</div>
        {/* BACK BUTTON */}

        <div className="text-center mt-4">

          <button
            onClick={() => router.push("/")}
            className="text-indigo-400"
          >
            ← Back to Dashboard
          </button>

        </div>

      </div>

    </div>
  )
}

function Feature({ text }) {
  return (
    <div className="flex items-center gap-3 text-slate-300">
    <span>✅</span>
      {text}
    </div>
  )
}