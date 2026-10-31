import assert from "node:assert/strict"
import test from "node:test"
import { normalizeWhatsAppAppLinks, resolveWhatsAppAppUrl, CANONICAL_PRODUCTION_APP_URL } from "../lib/whatsapp/links.js"
import { buildTrialEnrollment } from "../lib/whatsapp/events/enrollment.js"
import { processClaimedEvents } from "../lib/whatsapp/processor.js"

const productionEnv = { VERCEL_ENV: "production" }

test("trial enrollment uses the canonical Auctor URL in Vercel Production", () => {
  const siteUrl = resolveWhatsAppAppUrl("http://localhost:3002/api/whatsapp/enroll-trial", productionEnv)
  const events = buildTrialEnrollment({
    profile: { user_id: "user-1", name: "Reader", phone: "+919876543210", trial_days: 3, trial_expires_at: "2026-08-15T00:00:00.000Z" },
    siteUrl,
  })
  const discountEvent = events.find(event => event.eventType === "trial_day4_discount")
  assert.equal(discountEvent.payload.discountPaymentLink, `${CANONICAL_PRODUCTION_APP_URL}/pricing?coupon=AUCTOR30`)
})

test("local development keeps its local WhatsApp links", () => {
  const localUrl = resolveWhatsAppAppUrl("http://localhost:3002/api/whatsapp/enroll-trial", { VERCEL_ENV: "development" })
  assert.equal(localUrl, "http://localhost:3002")
  assert.equal(normalizeWhatsAppAppLinks({ discountPaymentLink: `${localUrl}/pricing?coupon=AUCTOR30` }, { VERCEL_ENV: "development" }).discountPaymentLink, "http://localhost:3002/pricing?coupon=AUCTOR30")
})

test("production WhatsApp delivery rebases stored trial links and preserves pricing coupon", async () => {
  let sentMessage
  const event = {
    id: "event-production-url",
    user_id: "user-1",
    event_type: "trial_day4_discount",
    claim_token: "claim-1",
    phone_snapshot: "+919876543210",
    payload: {
      firstName: "Reader",
      discountPercentage: "30%",
      discountWindow: "3 days",
      discountPaymentLink: "http://localhost:3002/pricing?coupon=AUCTOR30",
    },
  }

  const result = await processClaimedEvents([event], {
    env: productionEnv,
    hasWhatsAppConsent: async () => true,
    hasPurchased: async () => false,
    markSent: async () => {},
    markFailed: async () => {},
    markCancelled: async () => {},
    send: async (message) => { sentMessage = message; return { ok: true, messageId: "wamid.test-only" } },
  })

  assert.equal(result.sent, 1)
  const discountUrl = sentMessage.components[0].parameters[3].text
  assert.equal(discountUrl, `${CANONICAL_PRODUCTION_APP_URL}/pricing?coupon=AUCTOR30`)
  assert.doesNotMatch(JSON.stringify(sentMessage), /localhost:3002/)
})
