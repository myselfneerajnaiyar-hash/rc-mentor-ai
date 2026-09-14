import { inboxHandlers } from "@/lib/inbox/api"
import { getAuthenticatedProfile } from "@/lib/tenant/getCurrentProfile"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const dynamic = "force-dynamic"
export const maxDuration = 60
const handlers = inboxHandlers({ db: supabaseAdmin, authenticate: getAuthenticatedProfile })
export const GET = handlers.GET
export const PATCH = handlers.PATCH
