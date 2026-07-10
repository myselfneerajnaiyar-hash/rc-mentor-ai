"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import SubscribeButton from "@/components/SubscribeButton"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"

export default function Pricing() {
const [user, setUser] = useState(null)

const router = useRouter()

const [isCatStudent, setIsCatStudent] = useState(false)

useEffect(() => {
  async function loadUser() {
    const { data } = await supabase.auth.getUser()

    const currentUser = data?.user || null
    setUser(currentUser)

    if (!currentUser) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("exam")
      .eq("user_id", currentUser.id)
      .single()

      if (
      profile?.exam === "CAT" ||
      profile?.exam === "XAT"
    ) {
      setIsCatStudent(true)
    }
  }

  loadUser()
}, [])
return (
<>


<main className="relative min-h-screen bg-[#0b0f2a] text-white overflow-hidden">

  <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-blue-500/10 blur-[180px] rounded-full pointer-events-none"></div>

<div className="absolute top-[500px] right-[-100px] w-[500px] h-[500px] bg-orange-500/10 blur-[160px] rounded-full pointer-events-none"></div>

{/* HERO */}

<section className="max-w-6xl mt-20 mx-auto px-6 pt-28 pb-40 text-center">

<h1 className="text-6xl md:text-7xl font-black leading-tight tracking-tight mb-8">
Train Like a
<span className="text-orange-400"> 99 Percentiler</span>
</h1>

<p className="text-gray-300 text-xl leading-relaxed max-w-3xl mx-auto">
Choose your plan and unlock the complete Auctor RC experience —
structured training, AI mentorship, analytics, and unlimited practice.
</p>

</section>


{/* PRICING */}

<section className="max-w-6xl mt-20 mx-auto px-6 pb-32">

<div className="grid md:grid-cols-2 xl:grid-cols-2 gap-6 items-stretch max-w-[1400px] mx-auto">



{/* TEST SERIES */}
{isCatStudent && (
<Card className="
relative
bg-gradient-to-br
from-sky-400/30
via-cyan-500/20
to-blue-900/70
border-2 border-cyan-300
ring-4 ring-cyan-400/40
shadow-[0_0_60px_rgba(34,211,238,0.45)]
rounded-3xl
overflow-hidden
">

<div className="absolute top-5 left-5 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
🔥 LAUNCH OFFER
</div>

<CardContent className="p-10 text-center">

<h3 className="text-2xl font-semibold text-white mb-6">
CAT VARC Test Series
</h3>

<div className="mb-6 text-center">

  <div
    style={{
      color: "#9ca3af",
      textDecoration: "line-through",
      textDecorationColor: "#ef4444",
      fontSize: "24px",
      fontWeight: 600,
    }}
  >
    ₹1199
  </div>

  <div
    style={{
      fontSize: "72px",
      fontWeight: 800,
      color: "#fff",
      lineHeight: 1,
    }}
  >
    ₹799
  </div>

</div>

<p className="text-cyan-400 mb-8">
One-time purchase
</p>

<ul className="space-y-4 text-slate-300 text-left max-w-[260px] mx-auto mb-10">

<li>✔️ Official CAT PYQs</li>

<li>✔️ 10 Auctor VARC Mocks</li>

<li>✔️ AI Diagnosis</li>

<li>✔️ Detailed Analysis</li>

<li>✔️ Leaderboards</li>

<li>✔️ Valid till CAT 2026</li>

</ul>

<SubscribeButton
amount={799}
plan="cat_test_series"
label="Unlock Test Series"

user={user}
/>

</CardContent>

</Card>

  )}


<Card className="relative bg-gradient-to-b from-orange-500/10 via-slate-800/95 to-slate-900 border border-orange-400/50 rounded-3xl ring-2 ring-orange-500">

<div className="absolute top-5 right-5 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
BEST VALUE
</div>

<CardContent className="p-10 text-center">

<h3 className="text-2xl font-semibold text-white mb-6">
Half Yearly Plan
</h3>

<p className="text-6xl font-bold text-white mb-2">
₹1299
</p>

{isCatStudent && (
<p className="text-green-400 font-semibold mb-2">
🎁 Includes CAT VARC Test Series
</p>
)}

<p className="text-orange-400 font-medium mb-8">
Only ₹216/month
</p>

<ul className="space-y-4 text-slate-300 text-left max-w-[240px] mx-auto mb-10">
<li>✔️ Everything in Monthly</li>
<li>✔️ Unlimited RC practice</li>
<li>✔️ CAT VARC Test Series</li>
<li>✔️ AI RC Generator</li>
<li>✔️ Birbal explanations</li>
<li>✔️ Full analytics dashboard</li>
</ul>

<SubscribeButton
amount={1299}
plan="half_yearly"
label="Start 6 Month Plan"
user={user}
variant="premium"
/>

</CardContent>

</Card>




<Card className="bg-gradient-to-b from-slate-800/90 to-slate-900 border border-indigo-500/40 rounded-3xl">

<CardContent className="p-10 text-center">

<h3 className="text-2xl font-semibold text-white mb-6">
3 Month Plan
</h3>

<p className="text-5xl font-bold text-white mb-3">
₹999
</p>

<p className="text-indigo-400 mb-8">
₹333/month
</p>

<ul className="space-y-4 text-slate-300 text-left max-w-[240px] mx-auto mb-10">
<li>✔️ Daily RC workouts</li>
<li>✔️ Speed reading gym</li>
<li>✔️ Birbal AI mentor</li>
<li>✔️ Performance analytics</li>
<li>✔️ Unlimited RC practice</li>
</ul>

<SubscribeButton
amount={999}
plan="quarterly"
label="Start 3 Month Plan"
user={user}
/>

</CardContent>
</Card>


{/* YEARLY */}

<Card className="relative bg-gradient-to-b from-orange-500/10 via-slate-800/95 to-slate-900 border border-orange-400/50 ring-1 ring-white/10 shadow-2xl shadow-orange-500/10 rounded-3xl hover:border-orange-300 hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl">

  <div className="absolute top-5 right-5 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
    ANNUAL SAVER
  </div>

  <CardContent className="p-10 text-center">

    <h3 className="text-2xl font-semibold text-white mb-6">
      Elite Yearly
    </h3>

    <p className="text-6xl font-bold text-white mb-2">
      ₹1999
    </p>
   {isCatStudent && (
<p className="text-green-400 font-semibold mb-2">
🎁 Includes CAT VARC Test Series
</p>
)}

    <p className="text-orange-400 font-medium mb-8">
      Only ₹166 / month
    </p>

    <ul className="space-y-4 text-slate-300 text-left max-w-[240px] mx-auto mb-10">

      <li>✔️ Everything in Monthly</li>
      <li>✔️ Unlimited RC practice</li>
      <li>✔️ AI RC Generator</li>
      <li>✔️ Birbal reasoning explanations</li>
      <li>✔️ Full analytics dashboard</li>

    </ul>

    <SubscribeButton
  amount={1999}
  plan="yearly"
  label="Unlock Premium"
  user={user}
  variant="premium"
/>

  </CardContent>

</Card>
{/* MONTHLY */}
<Card className="bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/70 ring-1 ring-white/10 shadow-2xl shadow-blue-500/10 rounded-3xl hover:border-indigo-400/60 hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl">

  <CardContent className="p-10 text-center">

    <h3 className="text-2xl font-semibold text-white mb-6">
      Pro Monthly
    </h3>

    <p className="text-6xl font-bold text-white mb-3">
      ₹399
    </p>

    <p className="text-slate-400 mb-8">
      Flexible plan for short term preparation
    </p>

    <ul className="space-y-4 text-slate-300 text-left max-w-[240px] mx-auto mb-10">

      <li>✔️ Daily RC workouts</li>
      <li>✔️ Speed reading gym</li>
      <li>✔️ Birbal AI mentor</li>
      <li>✔️ Performance analytics</li>
      <li>✔️ Unlimited RC practice</li>

    </ul>

   <SubscribeButton
  amount={399}
  plan="monthly"
  label="Start Monthly Plan"
  user={user}
/>

  </CardContent>

</Card>

</div>




{/* TRUST STRIP */}

<div className="text-center mt-16 text-gray-400 text-sm">

<p className="mb-2">
Secure payments powered by Razorpay
</p>

<p>
   No hidden charges
</p>

</div>

<div className="flex justify-center mt-10">

  <Button
    variant="outline"
    onClick={() => router.push("/")}
    className="rounded-2xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white px-8 h-12 transition-all duration-300"
  >
    ← Back to Dashboard
  </Button>

</div>

</section>

</main>



</>
)
}