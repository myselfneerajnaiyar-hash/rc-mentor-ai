import { isAuthorizedInboxCron } from "@/lib/inbox/auth"
import { runInboxGenerator } from "@/lib/inbox/generator"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
export const dynamic = "force-dynamic"
export const maxDuration = 300
export async function GET(request) {
  if (!isAuthorizedInboxCron(request)) return Response.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const result = await runInboxGenerator(supabaseAdmin)
    return Response.json(result, { status: result.status === "complete" ? 200 : 503, headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Inbox generation failed", { message: error?.message || String(error), code: error?.code })
    return Response.json({ error: "Inbox generation failed" }, { status: 500 })
  }
}
