import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import crypto from "node:crypto"
import vm from "node:vm"
import ts from "typescript"
import * as pricing from "../lib/payments/pricing.js"
import { calculatePlanPricing, normalizeCouponCode, PLAN_PRICES, validateCouponCode } from "../lib/payments/pricing.js"

const createOrderSource = await readFile(new URL("../app/api/create-order/route.js", import.meta.url), "utf8")
const verifyPaymentSource = await readFile(new URL("../app/api/verify-payment/route.js", import.meta.url), "utf8")

test("normal purchases retain every existing base price", () => {
  assert.deepEqual(Object.fromEntries(Object.keys(PLAN_PRICES).map((plan) => [plan, calculatePlanPricing(plan).finalPaise])), {
    monthly: 39900,
    quarterly: 99900,
    half_yearly: 129900,
    yearly: 199900,
    cat_test_series: 79900,
    bootcamp_full_access: 79900,
  })
})

test("AZADI50 is case-insensitive and applies exactly fifty percent", () => {
  for (const code of ["AZADI50", "azadi50", "Azadi50"]) {
    assert.equal(validateCouponCode(code).valid, true)
    const pricing = calculatePlanPricing("cat_test_series", { couponCode: code })
    assert.equal(pricing.originalPaise, 79900)
    assert.equal(pricing.discountPaise, 39950)
    assert.equal(pricing.finalPaise, 39950)
  }
  assert.equal(normalizeCouponCode("  azadi50 "), "AZADI50")
})

test("invalid coupon is rejected and cannot alter normal pricing", () => {
  assert.equal(validateCouponCode("NOTREAL").valid, false)
  assert.equal(calculatePlanPricing("monthly", { couponCode: "NOTREAL" }).finalPaise, 39900)
})

test("existing referral prices remain unchanged", () => {
  assert.equal(calculatePlanPricing("monthly", { validReferral: true }).finalPaise, 31900)
  assert.equal(calculatePlanPricing("quarterly", { validReferral: true }).finalPaise, 79900)
  assert.equal(calculatePlanPricing("half_yearly", { validReferral: true }).finalPaise, 103900)
  assert.equal(calculatePlanPricing("yearly", { validReferral: true }).finalPaise, 159900)
  assert.equal(calculatePlanPricing("cat_test_series", { validReferral: true }).finalPaise, 63900)
})

test("coupon takes precedence over referral without stacking", () => {
  const pricing = calculatePlanPricing("yearly", { couponCode: "AZADI50", validReferral: true })
  assert.equal(pricing.finalPaise, 99950)
  assert.equal(pricing.discountType, "coupon")
})

test("order creation uses server pricing rather than a browser amount", () => {
  assert.match(createOrderSource, /amount: pricing\.finalPaise/)
  assert.doesNotMatch(createOrderSource, /body\.amount/)
  assert.match(createOrderSource, /discount_type: pricing\.discountType/)
})

test("verification uses authoritative Razorpay order metadata and amount", () => {
  assert.match(createOrderSource, /plan: pricing\.plan/)
  assert.match(verifyPaymentSource, /processSuccessfulPayment\(\{ orderId, paymentId, source: "checkout_callback" \}\)/)
  assert.doesNotMatch(verifyPaymentSource, /199900|PLAN_PRICES|amount.*plan/)
})

const collision = {
  id: "influencer-collision", coupon_code: "AUCTOR30", status: "active",
  student_discount_percent: 20, commission_rate: 30, commission_basis: "original_price",
  name: "Collision", email: "collision@example.test",
}
const legitimateInfluencer = {
  ...collision, id: "influencer-normal", coupon_code: "CREATOR20", name: "Creator",
}
const auctor20Influencer = {
  ...legitimateInfluencer,
  id: "influencer-auctor20",
  coupon_code: "AUCTOR20",
  name: "Auctor Campaign",
  student_discount_percent: 20,
  commission_rate: 20,
}
const suppliedInfluencer = {
  active: true, discountPercent: 20,
  influencer: { name: "Collision", commissionPercent: 30, commissionBasis: "ORIGINAL_PRICE" },
}

test("AUCTOR30 has one authoritative 30 percent definition, even with a supplied 20 percent coupon", () => {
  for (const code of ["AUCTOR30", "auctor30", "  AuCtOr30  "]) {
    assert.equal(validateCouponCode(code, suppliedInfluencer).coupon.discountPercent, 30)
    const result = calculatePlanPricing("half_yearly", { couponCode: code, coupon: suppliedInfluencer })
    assert.equal(result.originalPaise, 129900)
    assert.equal(result.finalPaise, 90930)
    assert.equal(result.discountPaise, 38970)
    assert.notEqual(result.finalPaise, 103920)
    assert.equal(pricing.calculateCouponAttribution({
      originalPaise: 129900, amountPaidPaise: 90930, couponCode: code, coupon: suppliedInfluencer,
    }), null)
  }
})

test("other built-in coupons cannot be shadowed either", () => {
  assert.equal(calculatePlanPricing("half_yearly", { couponCode: "AZADI50", coupon: suppliedInfluencer }).finalPaise, 64950)
})

// Execute the actual modules; replace only network/database/email boundaries.
// No production environment or API is used by these tests.
async function loadModule(file, dependencies, globals = {}) {
  const source = await readFile(new URL(file, import.meta.url), "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  })
  const exports = {}
  vm.runInNewContext(compiled.outputText, {
    exports, Response, console: { log() {}, info() {}, warn() {}, error() {} }, ...globals,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`)
      return dependencies[name]
    },
  }, { filename: file })
  return exports
}

async function checkoutHarness() {
  const rows = {
    instagram_influencers: [collision, legitimateInfluencer, auctor20Influencer],
    profiles: [{ user_id: "test-user", name: "Student", email: "student@example.test", phone: "", exam: "CAT", attempt_year: 2026, is_premium: false }],
    razorpay_payment_orders: [],
    subscriptions: [], bootcamp_access: [], influencer_coupon_conversions: [],
    campus_ambassadors: [{ id: "ambassador", referral_code: "REFERRAL", status: "active", total_referrals: 0, total_commission: 0 }],
  }
  const calls = []
  const db = { from(table) {
    assert.ok(Object.hasOwn(rows, table), `Unexpected table: ${table}`)
    calls.push(table)
    const filters = []
    let operation = "read", payload, result
    const execute = () => {
      if (result) return result
      const matching = rows[table].filter(row => filters.every(([key, value]) => row[key] === value))
      let data = matching
      if (operation === "insert" || operation === "upsert") {
        const duplicate = operation === "upsert" && rows[table].some(row => row.payment_id === payload.payment_id)
        data = duplicate ? [] : [{ id: `${table}-${rows[table].length + 1}`, ...payload }]
        rows[table].push(...data)
      } else if (operation === "update") {
        matching.forEach(row => Object.assign(row, payload))
      }
      return result = { data, error: null }
    }
    const query = {
      select: () => query,
      eq: (key, value) => { filters.push([key, value]); return query },
      insert: value => { operation = "insert"; payload = value; return query },
      upsert: value => { operation = "upsert"; payload = value; return query },
      update: value => { operation = "update"; payload = value; return query },
      single: async () => ({ ...execute(), data: execute().data[0] || null }),
      maybeSingle: async () => ({ ...execute(), data: execute().data[0] || null }),
      then: (resolve, reject) => Promise.resolve(execute()).then(resolve, reject),
    }
    return query
  } }
  const coupons = await loadModule("../lib/payments/influencerCoupons.js", {
    "@/lib/supabaseAdmin": { supabaseAdmin: db }, "@/lib/payments/pricing": pricing,
  })
  let order, payment
  class Razorpay {
    orders = {
      create: async options => (order = { id: "order_test", status: "created", ...options }),
      fetch: async id => { assert.equal(id, order.id); return order },
    }
    payments = { fetch: async id => { assert.equal(id, payment.id); return payment } }
  }
  const processSuccessfulPayment = async ({ orderId, paymentId }) => {
    assert.equal(orderId, order.id)
    assert.equal(paymentId, payment.id)
    const purchase = rows.razorpay_payment_orders.find(row => row.razorpay_order_id === orderId)
    assert.ok(purchase)
    assert.equal(purchase.plan, order.notes.plan)
    if (Number(purchase.amount_paid_paise) !== Number(payment.amount) || payment.status !== "captured") {
      throw new Error("Captured payment does not match registered purchase")
    }
    const existing = purchase.plan === "bootcamp_full_access"
      ? rows.bootcamp_access.find(row => row.razorpay_payment_id === paymentId)
      : rows.subscriptions.find(row => row.razorpay_payment_id === paymentId)
    if (existing) return { status: "reconciled" }
    if (purchase.plan === "bootcamp_full_access") {
      rows.bootcamp_access.push({ user_id: purchase.user_id, source: "purchase", amount_paid_paise: purchase.amount_paid_paise, razorpay_payment_id: paymentId })
      purchase.razorpay_payment_id = paymentId
      purchase.status = "provisioned"
      return { status: "provisioned" }
    }
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + ({ monthly: 1, quarterly: 3, half_yearly: 6, yearly: 12, cat_test_series: 12 }[purchase.plan]))
    const subscription = { user_id: purchase.user_id, plan: purchase.plan, expires_at: expiresAt.toISOString(), razorpay_payment_id: paymentId, referral_code: purchase.referral_code }
    rows.subscriptions.push(subscription)
    purchase.razorpay_payment_id = paymentId
    purchase.status = "provisioned"
    const profile = rows.profiles.find(row => row.user_id === purchase.user_id)
    if (purchase.plan !== "cat_test_series") {
      profile.is_premium = true
      profile.premium_expires_at = subscription.expires_at
    }
    if (purchase.influencer_attribution) {
      rows.influencer_coupon_conversions.push({
        coupon_code: purchase.influencer_attribution.couponCode,
        amount_paid: purchase.influencer_attribution.amountPaidPaise,
        commission_amount: purchase.influencer_attribution.commissionPaise,
      })
    }
    return { status: "provisioned" }
  }
  const deps = {
    razorpay: Razorpay, crypto,
    "@supabase/supabase-js": { createClient: () => db },
    "@/lib/supabaseAdmin": { supabaseAdmin: db },
    "@/lib/tenant/getCurrentProfile": { getAuthenticatedProfile: async () => ({ user: { id: "test-user" } }) },
    "@/lib/payments/razorpaySignatures.mjs": { verifyRazorpayCheckoutSignature: () => true },
    "@/lib/payments/processSuccessfulPayment": { processSuccessfulPayment },
    "@/lib/payments/influencerCoupons": coupons,
    "@/lib/payments/pricing": pricing,
    "@/lib/email/sendInfluencerConversionEmail": { sendInfluencerConversionEmail: async () => {} },
    "@/lib/whatsapp/events": { cancelUserEvents: async () => {} },
  }
  const globals = {
    process: { env: { RAZORPAY_KEY_SECRET: "test-only-secret" } },
    fetch: async url => {
      assert.equal(url, "https://rc.auctorlabs.in/api/send-payment-email")
      return Response.json({ success: true })
    },
  }
  const create = await loadModule("../app/api/create-order/route.js", deps, globals)
  const verify = await loadModule("../app/api/verify-payment/route.js", deps, globals)
  const validate = await loadModule("../app/api/validate-coupon/route.js", deps, globals)
  return {
    rows, calls, coupons,
    validate: couponCode => validate.POST({ json: async () => ({ couponCode }) }),
    async create(input) {
      const response = await create.POST({ json: async () => input })
      assert.equal(response.status, 200)
      return response.json()
    },
    verify({ amount = order.amount, plan = order.notes.plan, client = {} } = {}) {
      order.status = "paid"
      payment = { id: "pay_test", order_id: order.id, amount, currency: "INR", status: "captured" }
      const body = {
        razorpay_order_id: order.id, razorpay_payment_id: payment.id,
        razorpay_signature: crypto.createHmac("sha256", "test-only-secret").update(`${order.id}|${payment.id}`).digest("hex"),
        user_id: "test-user", plan, ...client,
      }
      return verify.POST({ json: async () => body })
    },
  }
}

test("database AUCTOR30 collision is ignored by lookup and validation", async () => {
  const h = await checkoutHarness()
  for (const code of ["AUCTOR30", "auctor30", " AUCTOR30 "]) {
    assert.equal(await h.coupons.findInfluencerCoupon(code), null)
    assert.equal((await h.coupons.resolveCoupon(code)).coupon.discountPercent, 30)
    const response = await h.validate(code)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { valid: true, code: "AUCTOR30", discountPercent: 30 })
  }
  assert.equal(h.calls.includes("instagram_influencers"), false)
})

test("AUCTOR30 order and verification agree on 90930 and fulfill the six-month purchase", async () => {
  const h = await checkoutHarness()
  const order = await h.create({ plan: "half_yearly", couponCode: " auctor30 ", referralCode: "REFERRAL", amount: 1 })
  assert.equal(order.amount, 90930)
  assert.equal(order.pricing.finalPaise, 90930)
  assert.equal(order.notes.plan, "half_yearly")
  assert.equal(order.notes.coupon_code, "AUCTOR30")
  assert.equal(order.notes.discount_type, "coupon")
  assert.equal(order.notes.original_price, "129900")
  assert.equal(order.notes.discount_amount, "38970")
  assert.equal(order.notes.influencer_id, "")
  assert.equal(order.notes.referral_code, "")
  const before = new Date(); before.setMonth(before.getMonth() + 6)
  const response = await h.verify({ client: { couponCode: "CREATOR20", referralCode: "REFERRAL" } })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).success, true)
  assert.equal(h.rows.subscriptions.length, 1)
  const subscription = h.rows.subscriptions[0]
  assert.equal(subscription.plan, "half_yearly")
  assert.equal(subscription.user_id, "test-user")
  assert.equal(subscription.razorpay_payment_id, "pay_test")
  assert.ok(new Date(subscription.expires_at).getTime() >= before.getTime())
  const after = new Date(); after.setMonth(after.getMonth() + 6)
  assert.ok(new Date(subscription.expires_at).getTime() <= after.getTime())
  assert.equal(h.rows.profiles[0].is_premium, true)
  assert.equal(h.rows.profiles[0].premium_expires_at, subscription.expires_at)
  assert.equal(h.calls.includes("instagram_influencers"), false)
  assert.equal(h.rows.influencer_coupon_conversions.length, 0)
})

test("AUCTOR30 yearly checkout provisions the yearly plan at 139930 paise", async () => {
  const h = await checkoutHarness()
  const order = await h.create({ plan: "yearly", couponCode: "AUCTOR30" })
  assert.equal(order.amount, 139930)
  assert.equal(order.notes.plan, "yearly")
  assert.equal(order.notes.original_price, "199900")
  assert.equal(order.notes.discount_amount, "59970")
  assert.equal(order.notes.amount_paid, "139930")

  const response = await h.verify()
  assert.equal(response.status, 200)
  assert.equal(h.rows.subscriptions[0].plan, "yearly")
  assert.equal(h.rows.subscriptions[0].user_id, "test-user")
  assert.equal(h.rows.profiles[0].is_premium, true)
  assert.equal(h.rows.profiles[0].premium_expires_at, h.rows.subscriptions[0].expires_at)
})

test("yearly purchase provisions with another coupon and with no coupon", async () => {
  for (const couponCode of ["AZADI50", ""]) {
    const h = await checkoutHarness()
    const order = await h.create({ plan: "yearly", couponCode })
    assert.equal(order.notes.plan, "yearly")
    assert.equal(order.amount, couponCode ? 99950 : 199900)
    const response = await h.verify()
    assert.equal(response.status, 200)
    assert.equal(h.rows.subscriptions[0].plan, "yearly")
    assert.equal(h.rows.profiles[0].is_premium, true)
  }
})

test("AUCTOR30 verification cannot accept the colliding 103920 price", async () => {
  const h = await checkoutHarness()
  await h.create({ plan: "half_yearly", couponCode: "AUCTOR30" })
  const response = await h.verify({ amount: 103920 })
  assert.equal(response.status, 503)
  assert.match((await response.json()).error, /still processing/)
  assert.equal(h.rows.subscriptions.length, 0)
  assert.equal(h.rows.profiles[0].is_premium, false)
})

test("client plan input cannot change the plan recorded on a six-month order", async () => {
  const h = await checkoutHarness()
  await h.create({ plan: "half_yearly", couponCode: "AUCTOR30" })
  const response = await h.verify({ plan: "yearly" })
  assert.equal(response.status, 200)
  assert.equal(h.rows.subscriptions.length, 1)
  assert.equal(h.rows.subscriptions[0].plan, "half_yearly")
})

test("legitimate influencer coupon retains validation, pricing, fulfillment and attribution", async () => {
  const h = await checkoutHarness()
  assert.equal((await (await h.validate("creator20")).json()).discountPercent, 20)
  const order = await h.create({ plan: "half_yearly", couponCode: "CREATOR20" })
  assert.equal(order.amount, 103920)
  assert.equal(order.notes.influencer_id, "influencer-normal")
  const response = await h.verify()
  assert.equal(response.status, 200)
  assert.equal((await response.json()).success, true)
  assert.equal(h.rows.subscriptions.length, 1)
  assert.equal(h.rows.profiles[0].is_premium, true)
  assert.equal(h.rows.influencer_coupon_conversions.length, 1)
  assert.equal(h.rows.influencer_coupon_conversions[0].coupon_code, "CREATOR20")
  assert.equal(h.rows.influencer_coupon_conversions[0].amount_paid, 103920)
  assert.equal(h.rows.influencer_coupon_conversions[0].commission_amount, 38970)
})

test("AUCTOR20 uses the influencer record on every discountable plan, including CAT test series", async () => {
  for (const plan of Object.keys(PLAN_PRICES).filter(plan => plan !== "bootcamp_full_access")) {
    const h = await checkoutHarness()
    const couponResponse = await h.validate("auctor20")
    assert.equal(couponResponse.status, 200)
    assert.deepEqual(await couponResponse.json(), { valid: true, code: "AUCTOR20", discountPercent: 20 })

    const order = await h.create({ plan, couponCode: "AUCTOR20" })
    assert.equal(order.amount, Math.round(PLAN_PRICES[plan].basePaise * 0.8))
    assert.equal(order.notes.influencer_id, "influencer-auctor20")
    assert.equal(order.notes.discount_type, "coupon")
    const verified = await h.verify()
    assert.equal(verified.status, 200)
    assert.equal((await verified.json()).success, true)
    assert.equal(h.rows.influencer_coupon_conversions.length, 1)
    assert.equal(h.rows.influencer_coupon_conversions[0].coupon_code, "AUCTOR20")
    assert.equal(h.rows.influencer_coupon_conversions[0].commission_amount, Math.round(PLAN_PRICES[plan].basePaise * 0.2))
  }
})

test("fixed-price Bootcamp orders reject subscription coupon and referral discounts", () => {
  assert.match(createOrderSource, /body\.plan === "bootcamp_full_access" && \(couponInput\.trim\(\) \|\|/)
})

test("Boot Camp order and verified payment use ₹799; an incorrect capture grants no access", async () => {
  const h = await checkoutHarness()
  const order = await h.create({ plan: "bootcamp_full_access", amount: 99900 })
  assert.equal(order.amount, 79900)
  assert.equal(order.pricing.originalPaise, 99900)
  assert.equal(order.notes.original_price, "99900")
  assert.equal(order.notes.amount_paid, "79900")
  const rejected = await h.verify({ amount: 99900 })
  assert.equal(rejected.status, 503)
  assert.equal(h.rows.bootcamp_access.length, 0)
  assert.equal(h.rows.razorpay_payment_orders[0].status, "created")

  const verified = await h.verify({ amount: 79900 })
  assert.equal(verified.status, 200)
  assert.equal((await verified.json()).purchase.value, 799)
  assert.deepEqual(h.rows.bootcamp_access.map(row => row.amount_paid_paise), [79900])
})

test("pricing page supports validated coupon query prefill", async () => {
  const pricingSource = await readFile(new URL("../app/pricing/page.jsx", import.meta.url), "utf8")
  assert.match(pricingSource, /searchParams\.get\("coupon"\)/)
  assert.match(pricingSource, /applyCoupon\(couponFromUrl\)/)
  assert.match(pricingSource, /couponCode=\{appliedCoupon\}/)
})

test("server-validated referral pricing is also identical at creation and verification", async () => {
  const h = await checkoutHarness()
  const order = await h.create({ plan: "half_yearly", referralCode: "REFERRAL" })
  assert.equal(order.amount, 103900)
  assert.equal(order.notes.discount_type, "referral")
  assert.equal(order.notes.referral_code, "REFERRAL")
  assert.equal(order.notes.coupon_code, "")
  const response = await h.verify()
  assert.equal(response.status, 200)
  assert.equal((await response.json()).success, true)
  assert.equal(h.rows.subscriptions[0].referral_code, "REFERRAL")
})
