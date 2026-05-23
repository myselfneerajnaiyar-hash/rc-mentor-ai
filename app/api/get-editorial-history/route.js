import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {

  try {

    const { data, error } = await supabase
      .from("editorial_history")
      .select("*")
      .order("created_at", {
        ascending: false
      })

    if (error) {
      return Response.json({
        error: error.message
      })
    }

    return Response.json({
      history: data
    })

  } catch (err) {

    return Response.json({
      error: "Failed to load history"
    })
  }
}