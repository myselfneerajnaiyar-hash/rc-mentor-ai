import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {

  const { searchParams } =
    new URL(req.url)

  const id = searchParams.get("id")

  if (!id) {

    return Response.json({
      error: "Missing id"
    })
  }

  const { data, error } =
    await supabase
      .from("editorial_history")
      .select("*")
      .eq("id", id)
      .single()

  if (error || !data) {

    return Response.json({
      error: "Session not found"
    })
  }

  return Response.json(data)
}