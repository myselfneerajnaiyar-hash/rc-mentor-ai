import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getExamCapabilities } from "./capabilities.js"

export async function getAuthenticatedProfile(request) {
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return { user: null, profile: null, error: "unauthorized" }
  const token = authorization.slice("Bearer ".length)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return { user: null, profile: null, error: "unauthorized" }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id,institute_id,exam,role,name")
    .eq("user_id", user.id)
    .maybeSingle()
  if (error) throw error
  if (!profile) return { user, profile: null, error: "profile_not_found" }
  return { user, profile, capabilities: getExamCapabilities(profile.exam), error: null }
}
