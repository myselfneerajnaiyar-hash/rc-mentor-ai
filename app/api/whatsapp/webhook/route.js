import { NextResponse } from "next/server"
import { dispatchWhatsAppEvents, parseWhatsAppWebhook, verifyMetaWebhookSignature } from "@/lib/whatsapp/webhook"
import { storeIncomingWhatsAppMessage, storeWhatsAppMessageStatus } from "@/lib/whatsapp/webhookStore"

export const dynamic = "force-dynamic"

export async function GET(request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")

  if (mode === "subscribe" && token && token === process.env.META_WHATSAPP_VERIFY_TOKEN && challenge !== null) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } })
  }
  return NextResponse.json({ error: "Webhook verification failed" }, { status: 403 })
}

export async function POST(request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-hub-signature-256")
  if (!verifyMetaWebhookSignature(rawBody, signature, process.env.META_WHATSAPP_APP_SECRET)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
  }

  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Malformed webhook payload" }, { status: 400 })
  }

  const events = parseWhatsAppWebhook(payload)
  const results = await dispatchWhatsAppEvents(events, {
    onMessage: storeIncomingWhatsAppMessage,
    onStatus: storeWhatsAppMessageStatus,
  })
  const failed = results.filter((result) => !result.ok)
  console.info("Meta WhatsApp webhook handled", { received: events.length, failed: failed.length })
  return NextResponse.json({ received: true })
}
