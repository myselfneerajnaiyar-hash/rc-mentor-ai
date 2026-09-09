import { sendTemplateMessage } from "./client.js"
import { buildTemplateComponents, WHATSAPP_TEMPLATES } from "./templates.js"

export async function processClaimedEvents(events, {
  hasPurchased,
  hasCompletedActivity = async () => false,
  markSent,
  markFailed,
  markCancelled,
  send = sendTemplateMessage,
} = {}) {
  const summary = { processed: 0, sent: 0, failed: 0, cancelled: 0 }

  for (const event of events) {
    summary.processed += 1
    try {
      if (await hasPurchased(event.user_id)) {
        await markCancelled(event.id, event.claim_token, "purchase_completed")
        summary.cancelled += 1
        continue
      }

      if (event.event_type === "trial_no_session" && await hasCompletedActivity(event.user_id, event)) {
        await markCancelled(event.id, event.claim_token, "qualifying_activity_completed")
        summary.cancelled += 1
        continue
      }

      const definition = WHATSAPP_TEMPLATES[event.event_type]
      if (!definition) {
        await markCancelled(event.id, event.claim_token, "unsupported_event_type")
        summary.cancelled += 1
        continue
      }

      const components = buildTemplateComponents(event.event_type, event.payload)
      // Re-check at the last possible point before the external Meta request.
      if (await hasPurchased(event.user_id)) {
        await markCancelled(event.id, event.claim_token, "purchase_completed")
        summary.cancelled += 1
        continue
      }

      const result = await send({
        phone: event.phone_snapshot,
        templateName: definition.metaTemplateName,
        languageCode: definition.languageCode,
        components,
      })

      if (result.ok) {
        await markSent(event.id, event.claim_token, result.messageId)
        summary.sent += 1
      } else if (result.retryable) {
        await markFailed(event.id, event.claim_token, `${result.category}: ${result.message}`)
        summary.failed += 1
      } else {
        await markCancelled(event.id, event.claim_token, `${result.category}: ${result.message}`)
        summary.cancelled += 1
      }
    } catch (error) {
      await markFailed(event.id, event.claim_token, error instanceof Error ? error.message : "Queue processing failed")
      summary.failed += 1
    }
  }

  return summary
}
