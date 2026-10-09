import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { PGlite } from "@electric-sql/pglite"
import { verifyRazorpayCheckoutSignature, verifyRazorpayWebhookSignature } from "../lib/payments/razorpaySignatures.mjs"
import { calculatePlanPricing } from "../lib/payments/pricing.js"
import crypto from "node:crypto"

const migration = await readFile(new URL("../supabase/migrations/202610040001_razorpay_payment_provisioning.sql", import.meta.url), "utf8")
// The versioned fixture is archived; preserve its version and consume its real path.
const safeAttemptYearMigration = await readFile(new URL("../supabase/migration_archive/202610040002_safe_attempt_year_provisioning.sql", import.meta.url), "utf8")
const bootcampPurchaseMigration = await readFile(new URL("../supabase/migrations/202610080001_bootcamp_purchase_offer.sql", import.meta.url), "utf8")
const bundleMigration = await readFile(new URL("../supabase/migrations/202610090002_bootcamp_platform_bundle.sql", import.meta.url), "utf8")
const callbackSource = await readFile(new URL("../app/api/verify-payment/route.js", import.meta.url), "utf8")
const webhookSource = await readFile(new URL("../app/api/razorpay/webhook/route.js", import.meta.url), "utf8")
const processorSource = await readFile(new URL("../lib/payments/processSuccessfulPayment.js", import.meta.url), "utf8")

async function database() {
  const db = new PGlite()
  // Match the connected production project's UTC session timezone.
  await db.exec("set time zone 'UTC'")
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
      exam text, attempt_year integer, plan text, expires_at timestamp without time zone, referral_code text,
      razorpay_payment_id text unique
    );
    create table public.campus_ambassadors(
      id uuid primary key, referral_code text unique, status text,
      total_referrals integer default 0, total_commission numeric default 0
    );
    create table public.bootcamp_access(
      user_id uuid not null, program_key text not null, source text not null,
      claimed_at timestamptz, expires_at timestamptz, updated_at timestamptz default now(),
      primary key(user_id,program_key), constraint bootcamp_access_source_check check(source in ('first_free','purchase'))
    );
  `)
  await db.exec(migration)
  await db.exec(safeAttemptYearMigration)
  await db.exec(bootcampPurchaseMigration)
  await db.exec(bundleMigration)
  return db
}

async function addPurchase(db, { userId, orderId, plan = "yearly", referralCode = null, couponCode = "AUCTOR30", attemptYear = "2026", bundleVersion = null }) {
  const pricing = calculatePlanPricing(plan, { couponCode: couponCode || "" })
  await db.exec(`insert into auth.users(id) values ('${userId}');
    insert into public.profiles(user_id,name,email,phone,exam,attempt_year) values
    ('${userId}','Student','student@example.test','','CAT',${attemptYear === null ? "null" : `'${attemptYear.replaceAll("'", "''")}'`});
    insert into public.razorpay_payment_orders(user_id,razorpay_order_id,plan,entitlement_bundle_version,
      original_amount_paise,discount_amount_paise,amount_paid_paise,coupon_code,referral_code,status)
    values ('${userId}','${orderId}','${plan}',${bundleVersion === null ? "null" : bundleVersion},${pricing.originalPaise},${pricing.discountPaise},${pricing.finalPaise},
      ${couponCode ? `'${couponCode}'` : "null"},${referralCode ? `'${referralCode}'` : "null"},'created');`)
}

async function provision(db, { orderId = "order_1", paymentId = "pay_1", amount = 139930, paidAt = "2026-10-01T12:00:00Z" } = {}) {
  return db.query(`select public.provision_razorpay_payment($1,$2,$3,'INR',$4::timestamptz) as result`, [orderId, paymentId, amount, paidAt])
}

async function provisionBootcamp(db, { orderId, paymentId, amount = 79900, currency = "INR", paidAt = "2026-10-01T12:00:00Z" }) {
  return db.query(`select public.provision_bootcamp_payment($1,$2,$3,$4,$5::timestamptz) as result`, [orderId, paymentId, amount, currency, paidAt])
}

async function provisionBundle(db, rpc, { orderId, paymentId, amount = 79900, currency = "INR", paidAt = "2026-10-01T12:00:00Z" }) {
  return db.query(`select public.${rpc}($1,$2,$3,$4,$5::timestamptz) as result`, [orderId, paymentId, amount, currency, paidAt])
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
      s.expires_at at time zone 'UTC' as expires_at, pr.is_premium, pr.premium_expires_at
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

test("bundled Boot Camp purchase grants three months of premium without shortening later paid expiry and retries idempotently", async () => {
  const db = await database()
  const firstUserId = "00000000-0000-0000-0000-000000000035"
  const firstPaidAt = "2030-10-01T12:00:00Z"
  await addPurchase(db, { userId: firstUserId, orderId: "bundle_bootcamp_first", plan: "bootcamp_full_access", couponCode: null, bundleVersion: 1 })
  const firstPurchase = (await provisionBundle(db, "provision_bootcamp_platform_bundle", {
    orderId: "bundle_bootcamp_first", paymentId: "bundle_bootcamp_first_pay", paidAt: firstPaidAt,
  })).rows[0].result
  assert.equal(new Date(firstPurchase.expires_at).toISOString(), "2031-01-01T12:00:00.000Z")

  const userId = "00000000-0000-0000-0000-000000000030"
  const paidAt = "2030-10-01T12:00:00Z"
  await addPurchase(db, { userId, orderId: "bundle_bootcamp", plan: "bootcamp_full_access", couponCode: null, bundleVersion: 1 })
  await db.exec(`update public.profiles set is_premium=true,premium_expires_at='2032-10-01T12:00:00Z' where user_id='${userId}';
    insert into public.subscriptions(user_id,plan,expires_at,razorpay_payment_id)
    values ('${userId}','yearly','2032-10-01T12:00:00Z','prior_paid_expiry');`)
  const first = (await provisionBundle(db, "provision_bootcamp_platform_bundle", {
    orderId: "bundle_bootcamp", paymentId: "bundle_bootcamp_pay", paidAt,
  })).rows[0].result
  assert.equal(first.status, "provisioned")
  assert.equal(new Date(first.expires_at).toISOString(), "2033-01-01T12:00:00.000Z")
  await assert.rejects(provisionBundle(db, "provision_bootcamp_platform_bundle", {
    orderId: "bundle_bootcamp", paymentId: "bundle_bootcamp_pay", paidAt: "2030-10-02T12:00:00Z",
  }), /does not match the bundled Boot Camp order/, "a changed captured timestamp must be rejected")
  const repeated = (await provisionBundle(db, "provision_bootcamp_platform_bundle", {
    orderId: "bundle_bootcamp", paymentId: "bundle_bootcamp_pay", paidAt,
  })).rows[0].result
  assert.equal(new Date(repeated.expires_at).toISOString(), new Date(first.expires_at).toISOString())
  await db.exec(`update public.bootcamp_access set expires_at='2034-10-01T12:00:00Z'
    where user_id='${userId}' and program_key='bootcamp'`)
  await provisionBundle(db, "provision_bootcamp_platform_bundle", {
    orderId: "bundle_bootcamp", paymentId: "bundle_bootcamp_pay", paidAt,
  })
  const state = await db.query(`select p.is_premium,p.premium_expires_at,s.plan,
      s.expires_at at time zone 'UTC' as subscription_expires_at,a.expires_at as bootcamp_expires_at,
      o.status,o.entitlement_expires_at,o.bundle_entitlement_expires_at,a.source
    from public.profiles p join public.subscriptions s on s.razorpay_payment_id='bundle_bootcamp_pay'
    join public.razorpay_payment_orders o on o.razorpay_order_id='bundle_bootcamp'
    join public.bootcamp_access a on a.user_id=p.user_id and a.program_key='bootcamp'
    where p.user_id='${userId}'`)
  assert.equal(state.rows[0].is_premium, true)
  assert.equal(state.rows[0].plan, "quarterly")
  assert.equal(new Date(state.rows[0].premium_expires_at).toISOString(), "2033-01-01T12:00:00.000Z")
  assert.equal(new Date(state.rows[0].subscription_expires_at).toISOString(), new Date(first.expires_at).toISOString())
  assert.equal(new Date(state.rows[0].bootcamp_expires_at).toISOString(), "2034-10-01T12:00:00.000Z")
  assert.equal(state.rows[0].source, "purchase")
  assert.equal(state.rows[0].status, "provisioned")
  assert.notEqual(new Date(state.rows[0].entitlement_expires_at).toISOString(), new Date(first.expires_at).toISOString())
  const subscriptionCount = await db.query(`select count(*)::int as count from public.subscriptions where razorpay_payment_id='bundle_bootcamp_pay'`)
  assert.equal(subscriptionCount.rows[0].count, 1)
  await db.close()
})

test("concurrent bundled Boot Camp callbacks provision one subscription and preserve the saved expiry", async () => {
  const db = await database()
  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000039", orderId: "concurrent_bundle", plan: "bootcamp_full_access", couponCode: null, bundleVersion: 1 })
  const args = { orderId: "concurrent_bundle", paymentId: "concurrent_bundle_pay", paidAt: "2030-10-01T12:00:00Z" }
  const results = await Promise.all([
    provisionBundle(db, "provision_bootcamp_platform_bundle", args),
    provisionBundle(db, "provision_bootcamp_platform_bundle", args),
  ])
  assert.deepEqual(results.map(result => result.rows[0].result.status).sort(), ["provisioned", "reconciled"])
  const rows = await db.query(`select count(*)::int as count,min(expires_at) at time zone 'UTC' as expiry
    from public.subscriptions where razorpay_payment_id='concurrent_bundle_pay'`)
  assert.equal(rows.rows[0].count, 1)
  assert.equal(new Date(rows.rows[0].expiry).toISOString(), "2031-01-01T12:00:00.000Z")
  await db.close()
})

test("new quarterly bundle keeps its standard three-month expiry and adds Boot Camp access", async () => {
  const db = await database()
  const userId = "00000000-0000-0000-0000-000000000031"
  const paidAt = "2030-10-01T12:00:00Z"
  await addPurchase(db, { userId, orderId: "bundle_quarterly", plan: "quarterly", couponCode: null, bundleVersion: 1 })
  const standard = (await provision(db, { orderId: "bundle_quarterly", paymentId: "bundle_quarterly_pay", amount: 79900, paidAt })).rows[0].result
  const standardRows = await db.query(`select o.entitlement_expires_at::text as order_expiry,
      s.expires_at::text as subscription_expiry,
      s.expires_at = (o.entitlement_expires_at at time zone 'UTC') as expiry_matches,
      s.plan,s.user_id=o.user_id as user_matches
    from public.razorpay_payment_orders o join public.subscriptions s
      on s.razorpay_payment_id=o.razorpay_payment_id where o.razorpay_order_id='bundle_quarterly'`)
  assert.equal(standardRows.rows[0].expiry_matches, true, JSON.stringify(standardRows.rows[0]))
  assert.equal(standardRows.rows[0].user_matches, true)
  const bundle = (await provisionBundle(db, "provision_quarterly_bootcamp_bundle", {
    orderId: "bundle_quarterly", paymentId: "bundle_quarterly_pay", paidAt,
  })).rows[0].result
  assert.equal(new Date(bundle.expires_at).toISOString(), new Date(standard.expires_at).toISOString())
  const state = await db.query(`select a.source,a.expires_at,o.entitlement_expires_at,o.bundle_entitlement_expires_at
    from public.bootcamp_access a join public.razorpay_payment_orders o on o.user_id=a.user_id
    where o.razorpay_order_id='bundle_quarterly'`)
  assert.equal(state.rows[0].source, "purchase")
  assert.equal(new Date(state.rows[0].expires_at).toISOString(), new Date(standard.expires_at).toISOString())
  assert.equal(new Date(state.rows[0].bundle_entitlement_expires_at).toISOString(), new Date(standard.expires_at).toISOString())
  await db.close()
})

test("historical Boot Camp and quarterly orders keep old entitlements and cannot gain bundle benefits", async () => {
  const db = await database()
  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000032", orderId: "historical_bootcamp", plan: "bootcamp_full_access", couponCode: null })
  await provisionBootcamp(db, { orderId: "historical_bootcamp", paymentId: "historical_bootcamp_pay" })
  await assert.rejects(provisionBundle(db, "provision_bootcamp_platform_bundle", {
    orderId: "historical_bootcamp", paymentId: "historical_bootcamp_pay",
  }), /not a bundled Boot Camp purchase/)
  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000033", orderId: "historical_quarterly", plan: "quarterly", couponCode: null })
  await provision(db, { orderId: "historical_quarterly", paymentId: "historical_quarterly_pay", amount: 79900 })
  await assert.rejects(provisionBundle(db, "provision_quarterly_bootcamp_bundle", {
    orderId: "historical_quarterly", paymentId: "historical_quarterly_pay",
  }), /not a bundled quarterly purchase/)
  const state = await db.query(`select count(*)::int as bootcamp_rows from public.bootcamp_access
    where user_id in ('00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000033')`)
  assert.equal(state.rows[0].bootcamp_rows, 1, "only the historical Boot Camp purchase has Boot Camp access")
  const historical = await db.query(`select entitlement_bundle_version,bundle_entitlement_expires_at
    from public.razorpay_payment_orders where razorpay_order_id in ('historical_bootcamp','historical_quarterly')`)
  assert.deepEqual(historical.rows, [
    { entitlement_bundle_version: null, bundle_entitlement_expires_at: null },
    { entitlement_bundle_version: null, bundle_entitlement_expires_at: null },
  ])
  await db.close()
})

test("bundle RPCs reject unprovisioned, mismatched, and wrong-currency payment records", async () => {
  const db = await database()
  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000034", orderId: "failed_bundle", plan: "quarterly", couponCode: null, bundleVersion: 1 })
  await assert.rejects(provisionBundle(db, "provision_quarterly_bootcamp_bundle", {
    orderId: "failed_bundle", paymentId: "failed_bundle_pay",
  }), /Provisioned payment order is missing/)
  await assert.rejects(db.query(`select public.provision_razorpay_payment('failed_bundle','failed_bundle_pay',79899,'INR',now())`), /does not match/)
  await assert.rejects(db.query(`select public.provision_razorpay_payment('failed_bundle','failed_bundle_pay',79900,'USD',now())`), /does not match/)
  const untouched = await db.query(`select status,razorpay_payment_id from public.razorpay_payment_orders where razorpay_order_id='failed_bundle'`)
  assert.equal(untouched.rows[0].status, "created")
  assert.equal(untouched.rows[0].razorpay_payment_id, null)

  await addPurchase(db, { userId: "00000000-0000-0000-0000-000000000036", orderId: "failed_bootcamp_bundle", plan: "bootcamp_full_access", couponCode: null, bundleVersion: 1 })
  await assert.rejects(provisionBundle(db, "provision_bootcamp_platform_bundle", {
    orderId: "failed_bootcamp_bundle", paymentId: "failed_bootcamp_pay", amount: 79899,
  }), /does not match the bundled Boot Camp order/)
  await assert.rejects(provisionBundle(db, "provision_bootcamp_platform_bundle", {
    orderId: "failed_bootcamp_bundle", paymentId: "failed_bootcamp_pay", currency: "USD",
  }), /does not match the bundled Boot Camp order/)
  const bootcampUntouched = await db.query(`select status,razorpay_payment_id from public.razorpay_payment_orders where razorpay_order_id='failed_bootcamp_bundle'`)
  assert.equal(bootcampUntouched.rows[0].status, "created")
  assert.equal(bootcampUntouched.rows[0].razorpay_payment_id, null)
  await db.close()
})

test("Boot Camp bundle rejects a payment ID already linked to another student's subscription", async () => {
  const db = await database()
  const orderUser = "00000000-0000-0000-0000-000000000037"
  const otherUser = "00000000-0000-0000-0000-000000000038"
  await addPurchase(db, { userId: orderUser, orderId: "payment_collision", plan: "bootcamp_full_access", couponCode: null, bundleVersion: 1 })
  await db.exec(`insert into auth.users(id) values ('${otherUser}');
    insert into public.profiles(user_id,name,email,phone,exam,attempt_year) values
      ('${otherUser}','Other','other@example.test','','CAT','2026');
    insert into public.subscriptions(user_id,plan,expires_at,razorpay_payment_id)
      values ('${otherUser}','quarterly','2032-10-01T12:00:00Z','collision_payment');`)
  await assert.rejects(provisionBundle(db, "provision_bootcamp_platform_bundle", {
    orderId: "payment_collision", paymentId: "collision_payment",
  }), /already linked to a different subscription/)
  const state = await db.query(`select o.status,o.razorpay_payment_id,p.is_premium,
      (select count(*)::int from public.bootcamp_access a where a.user_id=o.user_id) as access_rows
    from public.razorpay_payment_orders o join public.profiles p on p.user_id=o.user_id
    where o.razorpay_order_id='payment_collision'`)
  assert.deepEqual(state.rows[0], { status: "created", razorpay_payment_id: null, is_premium: false, access_rows: 0 })
  await db.close()
})

test("only verified tagged orders receive combined payment success benefits", async () => {
  const source = await readFile(new URL("../app/api/payment-success/route.js", import.meta.url), "utf8")
  assert.match(source, /order\.status !== "provisioned"/)
  assert.match(source, /order\.entitlement_bundle_version === 1/)
  assert.match(source, /order\.bundle_entitlement_expires_at/)
  assert.match(source, /quarterly_bootcamp_bundle/)
  assert.match(source, /select\("source,expires_at"\)/)
  assert.match(processorSource, /provision_bootcamp_platform_bundle/)
  assert.match(processorSource, /provision_quarterly_bootcamp_bundle/)
  assert.match(processorSource, /purchase\.entitlement_bundle_version === 1 && purchase\.plan === "bootcamp_full_access"[\s\S]*?else \{[\s\S]*?provision_bootcamp_payment/)
  assert.match(bundleMigration, /revoke all on function public\.provision_bootcamp_platform_bundle[\s\S]*from public, anon, authenticated/)
  assert.match(bundleMigration, /grant execute on function public\.provision_bootcamp_platform_bundle[\s\S]*to service_role/)
  assert.doesNotMatch(bundleMigration, /enable row level security|create policy/i)

  const db = await database()
  const permissions = await db.query(`select
    has_function_privilege('service_role','public.provision_bootcamp_platform_bundle(text,text,bigint,text,timestamptz)','execute') as service_role,
    has_function_privilege('authenticated','public.provision_bootcamp_platform_bundle(text,text,bigint,text,timestamptz)','execute') as authenticated,
    has_function_privilege('anon','public.provision_bootcamp_platform_bundle(text,text,bigint,text,timestamptz)','execute') as anon`)
  assert.deepEqual(permissions.rows[0], { service_role: true, authenticated: false, anon: false })
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
