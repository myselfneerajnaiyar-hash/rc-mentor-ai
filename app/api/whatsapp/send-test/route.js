import { NextResponse } from "next/server"
import { isAuthorizedCronRequest } from "@/lib/whatsapp/events/auth"
import { sendTemplateMessage } from "@/lib/whatsapp/client"
import { buildTemplateComponents, WHATSAPP_TEMPLATES } from "@/lib/whatsapp/templates"

export const dynamic = "force-dynamic"

export async function POST(request) {
  if (!isAuthorizedCronRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (process.env.WHATSAPP_TEST_MODE !== "true" || !process.env.WHATSAPP_TEST_PHONE) {
    return NextResponse.json({ error: "WhatsApp test mode is not configured" }, { status: 403 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const definition = WHATSAPP_TEMPLATES[body?.eventType]
  if (!definition) return NextResponse.json({ error: "Unsupported template event" }, { status: 400 })

  try {
    const components = buildTemplateComponents(body.eventType, body.values)
    const result = await sendTemplateMessage({
      phone: process.env.WHATSAPP_TEST_PHONE,
      templateName: definition.metaTemplateName,
      languageCode: definition.languageCode,
      components,
    })
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid template parameters" }, { status: 400 })
  }
}
