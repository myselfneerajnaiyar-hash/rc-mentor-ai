import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { PGlite } from "@electric-sql/pglite"
import { verifyRazorpayCheckoutSignature, verifyRazorpayWebhookSignature } from "../lib/payments/razorpaySignatures.mjs"
import { calculatePlanPricing } from "../lib/payments/pricing.js"
import crypto from "node:crypto"

const migration = await readFile(new URL("../supabase/migrations/202610040001_razorpay_payment_provisioning.sql", import.meta.url), "utf8")
const safeAttemptYearMigration = await readFile(new URL("../supabase/migrations/202610040002_safe_attempt_year_provisioning.sql", import.meta.url), "utf8")
const callbackSource = await readFile(new URL("../app/api/verify-payment/route.js", import.meta.url), "utf8")
const webhookSource = await readFile(new URL("../app/api/razorpay/webhook/route.js", import.meta.url), "utf8")
const processorSource = await readFile(new URL("../lib/payments/processSuccessfulPayment.js", import.meta.url), "utf8")

async function database() {
  const db = new PGlite()
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create schema auth;
    create table auth.users(id uuid primary key);
    create table public.profiles(
      user_id uuid primary key references auth.users(id), name text, email text, phone text,
      exam text, attempt_year text, is_premium boolean default false, premium_expires_at timestamptz
    );
    create table public.subscriptions(
      id uuid primary key default gen_random_uuid(), user_id uuid, name text, email text, phone text,
      exam text, attempt_year integer, plan text, expires_at timestamptz, referral_code text,
      razorpay_payment_id text unique
    );
    create table public.campus_ambassadors(
      id uuid primary key, referral_code text unique, status text,
      total_referrals integer default 0, total_commission numeric default 0
    );
  `)
  await db.exec(migration)
  await db.exec(safeAttemptYearMigration)
  return db
}

async function addPurchase(db, { userId, orderId, plan = "yearly", referralCode = null, couponCode = "AUCTOR30", attemptYear = "2026" }) {
  const pricing = calculatePlanPricing(plan, { couponCode: couponCode || "" })
  await db.exec(`insert into auth.users(id) values ('${userId}');
    insert into public.profiles(user_id,name,email,phone,exam,attempt_year) values
    ('${userId}','Student','student@example.test','','CAT',${attemptYear === null ? "null" : `'${attemptYear.replaceAll("'", "''")}'`});
    insert into public.razorpay_payment_orders(user_id,razorpay_order_id,plan,
      original_amount_paise,discount_amount_paise,amount_paid_paise,coupon_code,referral_code,status)
    values ('${userId}','${orderId}','${plan}',${pricing.originalPaise},${pricing.discountPaise},${pricing.finalPaise},
      ${couponCode ? `'${couponCode}'` : "null"},${referralCode ? `'${referralCode}'` : "null"},'created');`)
}

async function provision(db, { orderId = "order_1", paymentId = "pay_1", amount = 139930, paidAt = "2026-10-01T12:00:00Z" } = {}) {
  return db.query(`select public.provision_razorpay_payment($1,$2,$3,'INR',$4::timestamptz) as result`, [orderId, paymentId, amount, paidAt])
}

test("AUCTOR30 yearly price is saved as the exact server-calculated paise amount", () => {
  const price = calculatePlanPricing("yearly", { couponCode: "AUCTOR30" })
  assert.equal(price.originalPaise, 199900)
  assert.equal(price.discountPaise, 59970)
  assert.equal(price.finalPaise, 139930)
})

test("discounted, other-coupon, and normal yearly orders provision yearly entitlements", async () => {
  const db = await database()
  const cases = [
    { couponCode: "AUCTOR30", amount: 139930 },
    { couponCode: "AZADI50", amount: 99950 },
    { couponCode: null, amount: 199900 },
  ]
  const paidAt = "2030-10-01T12:00:00Z"
  for (const [index, scenario] of cases.entries()) {
    const userId = `00000000-0000-0000-0000-00000000001${index}`
    const orderId = `yearly_${index}`
    const paymentId = `yearly_pay_${index}`
    await addPurchase(db, { userId, orderId, plan: "yearly", couponCode: scenario.couponCode })
    const result = (await provision(db, { orderId, paymentId, amount: scenario.amount, paidAt })).rows[0].result
    assert.equal(result.status, "provisioned")
    assert.equal(result.plan, "yearly")
    assert.equal(Number(result.amount_paid_paise), scenario.amount)
    const state = await db.query(`select p.plan, p.amount_paid_paise, s.plan as subscription_plan,
      s.expires_at, pr.is_premium, pr.premium_expires_at
      from public.razorpay_payment_orders p
      join public.subscriptions s on s.razorpay_payment_id=p.razorpay_payment_id
      join public.profiles pr on pr.user_id=p.user_id
      where p.razorpay_order_id='${orderId}'`)
    assert.equal(state.rows.length, 1)
    assert.equal(state.rows[0].plan, "yearly")
    assert.equal(state.rows[0].subscription_plan, "yearly")
    assert.equal(Number(state.rows[0].amount_paid_paise), scenario.amount)
    assert.equal(state.rows[0].is_premium, true)
    assert.equal(new Date(state.rows[0].expires_at).toISOString(), "2031-10-01T12:00:00.000Z")
    assert.equal(new Date(state.rows[0].premium_expires_at).toISOString(), new Date(state.rows[0].expires_at).toISOString())
  }
  await db.close()
})

test("attempt_year numeric text is trimmed and safely converted to integer", async () => {
  const db = await database()
  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000020", orderId: "attempt_numeric", attemptYear: " 2026 " })
  const result = (await provision(db, { orderId: "attempt_numeric", paymentId: "attempt_numeric_pay" })).rows[0].result
  assert.equal(result.status, "provisioned")
  const subscription = await db.query(`select attempt_year from public.subscriptions where razorpay_payment_id='attempt_numeric_pay'`)
  assert.equal(subscription.rows[0].attempt_year, 2026)
  await db.close()
})

test("empty, nonnumeric, and out-of-range attempt_year values provision with NULL", async () => {
  const db = await database()
  for (const [index, attemptYear] of ["", "CAT 2026", "999999999999999999999999999"].entries()) {
    const userId = `00000000-0000-0000-0000-00000000002${index + 1}`
    const orderId = `attempt_invalid_${index}`
    const paymentId = `attempt_invalid_pay_${index}`
    await addPurchase(db, { userId, orderId, attemptYear })
    const result = (await provision(db, { orderId, paymentId })).rows[0].result
    assert.equal(result.status, "provisioned")
    const subscription = await db.query(`select attempt_year from public.subscriptions where razorpay_payment_id='${paymentId}'`)
    assert.equal(subscription.rows[0].attempt_year, null)
  }
  await db.close()
})

test("provisioned-order reconciliation also safely converts attempt_year", async () => {
  const db = await database()
  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000023", orderId: "attempt_reconcile", attemptYear: "CAT 2026" })
  await db.exec(`update public.razorpay_payment_orders set status='provisioned', razorpay_payment_id='attempt_reconcile_pay',
    entitlement_expires_at='2031-10-01T12:00:00Z', provisioned_at=now() where razorpay_order_id='attempt_reconcile';`)
  const result = (await provision(db, { orderId: "attempt_reconcile", paymentId: "attempt_reconcile_pay" })).rows[0].result
  assert.equal(result.status, "reconciled")
  const subscription = await db.query(`select attempt_year from public.subscriptions where razorpay_payment_id='attempt_reconcile_pay'`)
  assert.equal(subscription.rows[0].attempt_year, null)
  await db.close()
})

test("checkout and webhook signatures validate only their correct signed payload", () => {
  const secret = "unit-test-secret"
  const checkout = crypto.createHmac("sha256", secret).update("order_1|pay_1").digest("hex")
  const raw = '{"event":"payment.captured"}'
  const webhook = crypto.createHmac("sha256", secret).update(raw).digest("hex")
  assert.equal(verifyRazorpayCheckoutSignature("order_1", "pay_1", checkout, secret), true)
  assert.equal(verifyRazorpayCheckoutSignature("order_other", "pay_1", checkout, secret), false)
  assert.equal(verifyRazorpayWebhookSignature(raw, webhook, secret), true)
  assert.equal(verifyRazorpayWebhookSignature(`${raw} `, webhook, secret), false)
})

test("callback and both successful webhook events use the same server-side processor", () => {
  assert.match(callbackSource, /processSuccessfulPayment\(\{ orderId, paymentId, source: "checkout_callback" \}\)/)
  assert.match(webhookSource, /verifyRazorpayWebhookSignature\(rawBody, signature, process\.env\.RAZORPAY_WEBHOOK_SECRET\)/)
  assert.match(webhookSource, /event\.event !== "payment\.captured" && event\.event !== "order\.paid"/)
  assert.match(webhookSource, /processSuccessfulPayment\(\{ orderId, paymentId, source: "razorpay_webhook" \}\)/)
  assert.match(processorSource, /provision_razorpay_payment/)
  assert.match(processorSource, /razorpay\.payments\.fetch\(paymentId\)/)
})

test("captured registered payment provisions entitlement once; duplicate callback/webhook do not extend it", async () => {
  const db = await database()
  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000001", orderId: "order_1" })
  const first = (await provision(db)).rows[0].result
  const expiresAt = first.expires_at
  assert.equal(first.status, "provisioned")
  assert.equal((await provision(db)).rows[0].result.status, "reconciled")
  const rows = await db.query(`select count(*)::int as n from public.subscriptions where razorpay_payment_id='pay_1'`)
  assert.equal(rows.rows[0].n, 1)
  const order = await db.query(`select entitlement_expires_at::text from public.razorpay_payment_orders where razorpay_order_id='order_1'`)
  assert.equal(new Date(order.rows[0].entitlement_expires_at).toISOString(), new Date(expiresAt).toISOString())
  await db.close()
})

test("replay repairs a recorded payment whose subscription and profile entitlement are missing", async () => {
  const db = await database()
  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000002", orderId: "order_2" })
  const original = (await provision(db, { orderId: "order_2", paymentId: "pay_2" })).rows[0].result
  await db.exec(`delete from public.subscriptions where razorpay_payment_id='pay_2';
    update public.profiles set is_premium=false,premium_expires_at=null where user_id='00000000-0000-0000-0000-000000000002';`)
  const repaired = (await provision(db, { orderId: "order_2", paymentId: "pay_2" })).rows[0].result
  assert.equal(repaired.status, "reconciled")
  assert.equal(new Date(repaired.expires_at).toISOString(), new Date(original.expires_at).toISOString())
  const rows = await db.query(`select s.expires_at=p.entitlement_expires_at as subscription_ok,
    pr.is_premium and pr.premium_expires_at>=p.entitlement_expires_at as profile_ok
    from public.razorpay_payment_orders p join public.subscriptions s on s.razorpay_payment_id=p.razorpay_payment_id
    join public.profiles pr on pr.user_id=p.user_id where p.razorpay_order_id='order_2'`)
  assert.deepEqual(rows.rows[0], { subscription_ok: true, profile_ok: true })
  await db.close()
})

test("failed subscription insert rolls back, then retry provisions cleanly", async () => {
  const db = await database()
  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000003", orderId: "order_3" })
  await db.exec(`create function public.fail_subscription_insert() returns trigger language plpgsql as $$
    begin raise exception 'transient insert failure'; end $$;
    create trigger fail_subscription before insert on public.subscriptions
    for each row execute function public.fail_subscription_insert();`)
  await assert.rejects(provision(db, { orderId: "order_3", paymentId: "pay_3" }), /transient insert failure/)
  const rolledBack = await db.query(`select status,razorpay_payment_id from public.razorpay_payment_orders where razorpay_order_id='order_3'`)
  assert.equal(rolledBack.rows[0].status, "created")
  assert.equal(rolledBack.rows[0].razorpay_payment_id, null)
  await db.exec("drop trigger fail_subscription on public.subscriptions")
  assert.equal((await provision(db, { orderId: "order_3", paymentId: "pay_3" })).rows[0].result.status, "provisioned")
  await db.close()
})

test("exact amount and currency mismatches are rejected", async () => {
  const db = await database()
  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000004", orderId: "order_4" })
  await assert.rejects(db.query(`select public.provision_razorpay_payment('order_4','pay_4',139929,'INR',now())`), /does not match/)
  await assert.rejects(db.query(`select public.provision_razorpay_payment('order_4','pay_4',139930,'USD',now())`), /does not match/)
  await db.close()
})

test("missing user profile fails closed without recording a provisioned payment", async () => {
  const db = await database()
  const userId = "00000000-0000-0000-0000-000000000008"
  await db.exec(`insert into auth.users(id) values ('${userId}');
    insert into public.razorpay_payment_orders(user_id,razorpay_order_id,plan,
      original_amount_paise,discount_amount_paise,amount_paid_paise,status)
    values ('${userId}','order_missing_profile','yearly',199900,59970,139930,'created');`)
  await assert.rejects(provision(db, { orderId: "order_missing_profile", paymentId: "pay_missing_profile" }), /profile is missing/)
  const order = await db.query(`select status,razorpay_payment_id from public.razorpay_payment_orders where razorpay_order_id='order_missing_profile'`)
  assert.equal(order.rows[0].status, "created")
  assert.equal(order.rows[0].razorpay_payment_id, null)
  await db.close()
})

test("a new purchase extends from the later existing premium expiry", async () => {
  const db = await database()
  const userId = "00000000-0000-0000-0000-000000000010"
  await addPurchase(db, { userId, orderId: "order_10" })
  await db.exec(`update public.profiles set is_premium=true,
    premium_expires_at='2027-10-01T12:00:00Z' where user_id='${userId}';
    insert into public.subscriptions(user_id,plan,expires_at,razorpay_payment_id)
    values ('${userId}','monthly','2027-10-01T12:00:00Z','old_pay');`)
  const result = (await provision(db, { orderId: "order_10", paymentId: "pay_10" })).rows[0].result
  assert.equal(new Date(result.expires_at).toISOString(), "2028-10-01T12:00:00.000Z")
  await db.close()
})

test("referral commission ledger applies a duplicate callback only once", async () => {
  const db = await database()
  await db.exec(`insert into public.campus_ambassadors(id,referral_code,status) values ('00000000-0000-0000-0000-000000000009','REFER','active')`)
  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000005", orderId: "order_5", referralCode: "REFER" })
  await provision(db, { orderId: "order_5", paymentId: "pay_5" })
  await db.query(`select public.apply_razorpay_referral_commission('order_5')`)
  await db.query(`select public.apply_razorpay_referral_commission('order_5')`)
  const result = await db.query(`select total_referrals,total_commission from public.campus_ambassadors where referral_code='REFER'`)
  assert.equal(result.rows[0].total_referrals, 1)
  assert.equal(Number(result.rows[0].total_commission), 200)
  await db.close()
})

test("concurrent processing of one payment cannot create duplicate subscriptions", async () => {
  const db = await database()
  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000006", orderId: "order_6" })
  const outcomes = await Promise.all([
    provision(db, { orderId: "order_6", paymentId: "pay_6" }),
    provision(db, { orderId: "order_6", paymentId: "pay_6" }),
  ])
  assert.deepEqual(outcomes.map(({ rows }) => rows[0].result.status).sort(), ["provisioned", "reconciled"])
  const count = await db.query(`select count(*)::int as n from public.subscriptions where razorpay_payment_id='pay_6'`)
  assert.equal(count.rows[0].n, 1)
  await db.close()
})

test("reconciliation batch claims unpaid created orders for later webhook or payment discovery", async () => {
  const db = await database()
  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000007", orderId: "order_7" })
  const result = await db.query(`select * from public.claim_razorpay_reconciliation_batch(20)`)
  assert.equal(result.rows.length, 1)
  assert.equal(result.rows[0].razorpay_order_id, "order_7")
  await db.close()
})
