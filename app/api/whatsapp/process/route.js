import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { isWhatsAppAutomationEnabled, isWhatsAppSenderReady } from "@/lib/whatsapp/events/config"
import { claimDueEvents, createEvent, markEventCancelled, markEventFailed, markEventSent, recoverStaleEvents } from "@/lib/whatsapp/events"
import { isAuthorizedCronRequest } from "@/lib/whatsapp/events/auth"
import { processClaimedEvents } from "@/lib/whatsapp/processor"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { buildDayOneEvent, getQualifyingActivitySummary } from "@/lib/whatsapp/events/activity"

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
  if (process.env.WHATSAPP_TEST_MODE === "true") {
    return NextResponse.json({ enabled: true, senderReady: true, testMode: true, recovered: 0, claimed: 0 })
  }

  const processorId = `vercel-cron:${randomUUID()}`
  try {
    const staleBefore = new Date(Date.now() - STALE_LOCK_MS)
    const recovered = await recoverStaleEvents({ staleBefore })
    const dayOneEnrolled = await reconcileDayOneEvents(request)
    const events = await claimDueEvents({ processorId, batchSize: BATCH_SIZE })
    const processed = await processClaimedEvents(events, {
      hasWhatsAppConsent: async (userId) => {
        const { data, error } = await supabaseAdmin
          .from("profiles")
          .select("whatsapp_opt_in,whatsapp_opt_in_at")
          .eq("user_id", userId)
          .single()
        if (error) throw error
        return data.whatsapp_opt_in === true && Boolean(data.whatsapp_opt_in_at)
      },
      hasPurchased: async (userId) => {
        const { data, error } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle()
        if (error) throw error
        return Boolean(data)
      },
      hasCompletedActivity: async (userId, event) => {
        const summary = await getQualifyingActivitySummary(supabaseAdmin, userId, trialStart(event.lifecycle_key))
        return summary.hasActivity
      },
      markSent: markEventSent,
      markFailed: markEventFailed,
      markCancelled: markEventCancelled,
    })

    return NextResponse.json({ enabled: true, senderReady: true, processorId, recovered, dayOneEnrolled, claimed: events.length, ...processed })
  } catch (error) {
    console.error("WhatsApp queue processor failed", { processorId, message: error instanceof Error ? error.message : "Unknown error" })
    return NextResponse.json({ error: "WhatsApp queue processing failed", processorId }, { status: 500 })
  }
}

async function reconcileDayOneEvents(request) {
  const recentTrialStart = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  const [{ data: welcomeRows, error: welcomeError }, { data: dayOneRows, error: dayOneError }] = await Promise.all([
    supabaseAdmin.from("whatsapp_automation_events").select("user_id,lifecycle_key").eq("event_type", "trial_welcome").gte("created_at", recentTrialStart).order("created_at", { ascending: false }).limit(1000),
    supabaseAdmin.from("whatsapp_automation_events").select("user_id,lifecycle_key").eq("event_type", "trial_day1").gte("created_at", recentTrialStart).order("created_at", { ascending: false }).limit(1000),
  ])
  if (welcomeError || dayOneError) throw welcomeError || dayOneError
  const existing = new Set((dayOneRows || []).map((row) => `${row.user_id}:${row.lifecycle_key}`))
  let enrolled = 0
  for (const row of welcomeRows || []) {
    if (existing.has(`${row.user_id}:${row.lifecycle_key}`)) continue
    const { data: profile, error } = await supabaseAdmin.from("profiles").select("user_id,name,phone,is_premium,whatsapp_opt_in,whatsapp_opt_in_at").eq("user_id", row.user_id).single()
    if (error) throw error
    if (profile.is_premium || !profile.whatsapp_opt_in || !profile.whatsapp_opt_in_at) continue
    const summary = await getQualifyingActivitySummary(supabaseAdmin, row.user_id, trialStart(row.lifecycle_key))
    if (!summary.hasDayOneMetrics) continue
    const created = await createEvent(buildDayOneEvent({ profile: { ...profile, siteUrl: new URL(request.url).origin }, lifecycleKey: row.lifecycle_key, summary }))
    if (created) enrolled += 1
  }
  return enrolled
}

function trialStart(lifecycleKey) {
  const expiry = new Date(String(lifecycleKey).replace(/^trial:/, ""))
  if (Number.isNaN(expiry.getTime())) throw new Error("Invalid WhatsApp trial lifecycle key")
  return new Date(expiry.getTime() - 3 * 24 * 60 * 60 * 1000)
}
