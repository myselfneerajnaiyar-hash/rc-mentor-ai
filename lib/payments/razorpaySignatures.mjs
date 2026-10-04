import { createHmac, timingSafeEqual } from "node:crypto"

function matchesHmac(raw, signature, secret) {
  if (typeof raw !== "string" || typeof signature !== "string" || typeof secret !== "string" || !secret) return false
  if (!/^[a-f\d]{64}$/i.test(signature)) return false
  const expected = createHmac("sha256", secret).update(raw, "utf8").digest()
  const received = Buffer.from(signature, "hex")
  return received.length === expected.length && timingSafeEqual(expected, received)
}

export function verifyRazorpayCheckoutSignature(orderId, paymentId, signature, keySecret) {
  if (typeof orderId !== "string" || typeof paymentId !== "string" || !orderId || !paymentId) return false
  return matchesHmac(`${orderId}|${paymentId}`, signature, keySecret)
}

export function verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret) {
  return matchesHmac(rawBody, signature, webhookSecret)
}
