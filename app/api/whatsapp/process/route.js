import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { isWhatsAppAutomationEnabled, isWhatsAppSenderReady } from "@/lib/whatsapp/events/config"
import { claimDueEvents, recoverStaleEvents } from "@/lib/whatsapp/events"
import { isAuthorizedCronRequest } from "@/lib/whatsapp/events/auth"

export const dynamic = "force-dynamic"

const BATCH_SIZE = 20
const STALE_LOCK_MS = 15 * 60 * 1000

export async function GET(request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const enabled = isWhatsAppAutomationEnabled()
  const senderReady = isWhatsAppSenderReady()
  if (!enabled || !senderReady) {
    return NextResponse.json({ enabled, senderReady, recovered: 0, claimed: 0 })
  }

  const processorId = `vercel-cron:${randomUUID()}`
  try {
    const staleBefore = new Date(Date.now() - STALE_LOCK_MS)
    const recovered = await recoverStaleEvents({ staleBefore })
    const events = await claimDueEvents({ processorId, batchSize: BATCH_SIZE })

    // This branch is reserved for Phase 2. WHATSAPP_SENDER_READY must remain
    // false until a real sender consumes and completes claimed events.
    return NextResponse.json({ enabled: true, senderReady: true, processorId, recovered, claimed: events.length })
  } catch (error) {
    console.error("WhatsApp queue processor failed", { processorId, message: error instanceof Error ? error.message : "Unknown error" })
    return NextResponse.json({ error: "WhatsApp queue processing failed", processorId }, { status: 500 })
  }
}
