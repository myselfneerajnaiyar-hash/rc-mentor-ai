import { calculatePlanPricing, PLAN_PRICES } from "../payments/pricing.js"

export const SUBSCRIPTION_PLANS = Object.freeze([
  Object.freeze({
    id: "monthly",
    name: "Monthly",
    durationMonths: 1,
    description: "Flexible access, billed monthly.",
    badge: "Flexible",
    features: Object.freeze([
      "Daily RC workouts",
      "Speed reading practice",
      "Birbal AI mentor",
      "Performance analytics",
      "Unlimited RC practice",
    ]),
    catFeatures: Object.freeze(["45-Day VARC Bootcamp"]),
    featured: false,
  }),
  Object.freeze({
    id: "quarterly",
    name: "Quarterly",
    durationMonths: 3,
    description: "Three months of focused preparation.",
    badge: "",
    features: Object.freeze([
      "Daily RC workouts",
      "Speed reading practice",
      "Birbal AI mentor",
      "Performance analytics and leaderboards",
      "Unlimited RC practice",
    ]),
    catFeatures: Object.freeze(["45-Day VARC Bootcamp", "CAT VARC Test Series"]),
    featured: false,
  }),
  Object.freeze({
    id: "half_yearly",
    name: "Half Yearly",
    durationMonths: 6,
    description: "Six months to build consistency and improve.",
    badge: "Popular",
    features: Object.freeze([
      "Everything in Monthly",
      "AI RC Generator",
      "Birbal reasoning explanations",
      "Full analytics dashboard",
      "Unlimited RC practice",
    ]),
    catFeatures: Object.freeze(["45-Day VARC Bootcamp", "CAT VARC Test Series"]),
    featured: true,
  }),
  Object.freeze({
    id: "yearly",
    name: "Annual",
    durationMonths: 12,
    description: "Best value for a full year of preparation.",
    badge: "Best Value",
    features: Object.freeze([
      "Everything in Monthly",
      "AI RC Generator",
      "Birbal reasoning explanations",
      "Full analytics dashboard",
      "Unlimited RC practice",
    ]),
    catFeatures: Object.freeze(["45-Day VARC Bootcamp", "CAT VARC Test Series"]),
    featured: false,
  }),
])

export function getSubscriptionPrice(planId, couponCode = "", discountPercent = 0) {
  const suppliedCoupon = couponCode
    ? { active: true, discountPercent }
    : null
  return calculatePlanPricing(planId, { couponCode, coupon: suppliedCoupon })
}

export function getSubscriptionFeatures(plan, isCatStudent) {
  return [
    ...plan.features,
    ...(isCatStudent ? plan.catFeatures : []),
  ]
}

export function getSubscriptionPlans() {
  return SUBSCRIPTION_PLANS.map((plan) => {
    if (!PLAN_PRICES[plan.id]) throw new Error(`Missing price for plan: ${plan.id}`)
    return plan
  })
}
