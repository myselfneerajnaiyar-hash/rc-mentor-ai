import PreviewNavbar from "../../components/PreviewNavbar"
import PreviewFooter from "../../components/PreviewFooter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Pricing() {

return (
<>
<PreviewNavbar />

<main className="relative min-h-screen bg-[#0b0f2a] text-white overflow-hidden">

  <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-blue-500/10 blur-[180px] rounded-full pointer-events-none"></div>

<div className="absolute top-[500px] right-[-100px] w-[500px] h-[500px] bg-orange-500/10 blur-[160px] rounded-full pointer-events-none"></div>

{/* HERO */}

<section className="max-w-6xl mt-20 mx-auto px-6 py-28 text-center">

<h1 className="text-6xl md:text-7xl font-black leading-tight tracking-tight mb-8">
Train Like a
<span className="text-orange-400"> 99 Percentiler</span>
</h1>

<p className="text-gray-300 text-xl leading-relaxed max-w-3xl mx-auto">
Train your reading intelligence with structured RC workouts,
AI mentorship and performance analytics.
</p>

</section>


{/* PRICING */}

<section className="max-w-6xl mx-auto px-6 pb-32">

<div className="grid md:grid-cols-3 gap-8 items-stretch">


{/* FREE TRIAL */}

<Card className="bg-slate-900 border-slate-800 rounded-3xl hover:border-green-500/40 transition-all duration-300">

  <CardContent className="p-10 text-center">

    <h3 className="text-2xl font-semibold text-white mb-6">
      Free Trial
    </h3>

    <p className="text-6xl font-bold text-white mb-3">
      ₹0
    </p>

    <p className="text-slate-400 mb-8">
      Full access for 7 days
    </p>

    <ul className="space-y-4 text-slate-300 text-left max-w-[220px] mx-auto mb-10">

      <li>✔️ Daily RC workouts</li>
      <li>✔️ Speed reading gym</li>
      <li>✔️ Birbal AI mentor</li>
      <li>✔️ Analytics dashboard</li>
      <li>✔️ Unlimited RC practice</li>

    </ul>

    <Button
      className="w-full rounded-2xl bg-green-500 hover:bg-green-600 h-12 text-base font-semibold"
    >
      Start Free Trial
    </Button>

  </CardContent>

</Card>

{/* MONTHLY */}

{/* MONTHLY */}

<Card className="bg-slate-900 border-slate-800 rounded-3xl hover:border-indigo-500/40 transition-all duration-300">

  <CardContent className="p-10 text-center">

    <h3 className="text-2xl font-semibold text-white mb-6">
      Monthly
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

    <a
      href="https://rzp.io/rzp/8dUAksb"
      className="w-full inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-500 h-12 text-base font-semibold transition-all duration-300"
    >
      Start Monthly Plan
    </a>

  </CardContent>

</Card>

{/* YEARLY */}

<Card className="relative bg-gradient-to-b from-orange-500/10 to-slate-900 border-orange-500/40 rounded-3xl hover:border-orange-400 transition-all duration-300 scale-105">

  <div className="absolute top-5 right-5 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
    MOST POPULAR
  </div>

  <CardContent className="p-10 text-center">

    <h3 className="text-2xl font-semibold text-white mb-6">
      Yearly
    </h3>

    <p className="text-6xl font-bold text-white mb-2">
      ₹1999
    </p>

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

    <a
      href="https://rzp.io/rzp/g0Nxkgl"
      className="w-full inline-flex items-center justify-center rounded-2xl bg-orange-500 hover:bg-orange-400 h-12 text-base font-semibold transition-all duration-300"
    >
      Unlock Premium
    </a>

  </CardContent>

</Card>

</div>


{/* TRUST STRIP */}

<div className="text-center mt-16 text-gray-400 text-sm">

<p className="mb-2">
Secure payments powered by Razorpay
</p>

<p>
Cancel anytime • No hidden charges
</p>

</div>

</section>

</main>

<PreviewFooter />

</>
)
}