"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Crown,
  Check,
  Sparkles,
  ArrowRight,
  Calendar,
  CalendarDays,
  Gem,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PremiumCTA() {
    const router = useRouter();

    const scrollRef = useRef(null);
const [activeIndex, setActiveIndex] = useState(0);

const handleScroll = () => {
  if (!scrollRef.current) return;

  const cardWidth = scrollRef.current.firstChild.offsetWidth + 16; // 16 = gap-4
  const index = Math.round(scrollRef.current.scrollLeft / cardWidth);

  setActiveIndex(index);
};
  const plans = [
    {
      name: "Monthly",
      price: "₹399",
      subtitle: "Perfect to get started",
      icon: Calendar,
      border: "border-slate-700",
      iconBg: "bg-slate-700/40",
      iconColor: "text-slate-200",
    },
    {
      name: "Quarterly",
      price: "₹999",
      subtitle: "Most Popular",
      icon: CalendarDays,
      featured: true,
      border: "border-violet-500",
      iconBg: "bg-violet-500/20",
      iconColor: "text-violet-300",
    },
    {
      name: "Half-Yearly",
      price: "₹1299",
      subtitle: "Best Value",
      icon: Gem,
      border: "border-emerald-500/40",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-300",
    },
    {
      name: "Yearly",
      price: "₹1999",
      subtitle: "Maximum Savings",
      icon: Trophy,
      border: "border-amber-500/40",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-300",
    },
  ];

  return (
    <section className="relative overflow-hidden py-14">

      {/* Background Glow */}

      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="relative">

        {/* Heading */}

        <div className="mx-auto mb-8 max-w-3xl text-center">

          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-300">

            <Crown className="h-4 w-4" />

            Premium Membership

          </div>

          <h2 className="mt-3 text-3xl font-bold text-white md:text-5xl">
            Choose Your Learning Journey
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-400">
            Unlock every AI-powered feature, unlimited practice and detailed
            performance insights with one Premium subscription.
          </p>

        </div>

        {/* Pricing Cards */}

      <div
  ref={scrollRef}
  onScroll={handleScroll}
  className="md:hidden -mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
>
  {plans.map((plan) => {
    const Icon = plan.icon;

    return (
      <div
        key={plan.name}
        className={`snap-center shrink-0 w-[85%] relative overflow-hidden rounded-3xl border bg-gradient-to-b from-slate-900 to-slate-800 p-5 ${plan.border} ${
          plan.featured
            ? "scale-[1.03] shadow-xl shadow-violet-500/20"
            : ""
        }`}
      >
        {plan.featured && (
          <div className="absolute right-4 top-4 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
            POPULAR
          </div>
        )}

        <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${plan.iconBg}`}>
          <Icon className={`h-7 w-7 ${plan.iconColor}`} />
        </div>

        <h3 className="text-2xl font-bold text-white">
          {plan.name}
        </h3>

        <p className="mt-2 text-sm text-slate-400">
          {plan.subtitle}
        </p>

        <div className="mt-5">
          <span className="text-4xl font-extrabold text-white">
            {plan.price}
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          One subscription. Full access.
        </p>
      </div>
    );
  })}
</div>

<div className="md:hidden mt-5 flex justify-center gap-2">
  {plans.map((_, index) => (
    <div
      key={index}
      className={`transition-all duration-300 rounded-full ${
        activeIndex === index
          ? "w-8 h-2 bg-orange-400"
          : "w-2 h-2 bg-orange-400/30"
      }`}
    />
  ))}
</div>

<div className="hidden md:grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          {plans.map((plan) => {
            const Icon = plan.icon;

            return (

              <div
                key={plan.name}
                className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-b from-slate-900 to-slate-800 p-5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${plan.border} ${
                  plan.featured
                    ? "scale-[1.03] shadow-xl shadow-violet-500/20"
                    : ""
                }`}
              >

                {plan.featured && (
                  <div className="absolute right-4 top-4 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
                    POPULAR
                  </div>
                )}

                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${plan.iconBg}`}
                >
                  <Icon className={`h-7 w-7 ${plan.iconColor}`} />
                </div>

                <h3 className="text-2xl font-bold text-white">
                  {plan.name}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  {plan.subtitle}
                </p>

                <div className="mt-5 flex items-end gap-1">

                  <span className="text-4xl font-extrabold text-white">
                    {plan.price}
                  </span>

                </div>

                <p className="mt-2 text-sm text-slate-500">
                  One subscription. Full access.
                </p>

              </div>

            );
          })}
        </div>
       
          {/* CTA */}

          <div className="mt-8 rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-900/30 via-slate-900 to-slate-900 p-6 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/20">

              <Crown className="h-8 w-8 text-violet-300" />

            </div>

            <h3 className="mt-4 text-2xl font-bold text-white">
              Ready to Unlock Premium?
            </h3>

            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-400">
              Join thousands of aspirants using AI-powered practice to improve
              faster, build consistency and maximize their VARC score.
            </p>

          <Button
  size="lg"
  onClick={() => router.push("/pricing")}
  className="mt-8 h-14 rounded-2xl bg-violet-600 px-10 text-base font-semibold hover:bg-violet-500"
>
              Explore Premium Plans

              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">

              <span>✓ Secure Payments</span>

              <span>✓ Instant Access</span>

              <span>✓ Cancel Anytime</span>

            </div>

          </div>

        </div>

      

    </section>
  );
}