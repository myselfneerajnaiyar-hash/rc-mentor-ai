import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {

  try {

    const today = new Date()

    const todayISO =
      today.toISOString().split("T")[0]

    const { data: users } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_premium", false)

    for (const user of users || []) {

      if (!user.trial_expires_at) continue

      const expiryDate =
        new Date(user.trial_expires_at)
          .toISOString()
          .split("T")[0]

      if (expiryDate === todayISO) {

        await fetch(
          "https://rc.auctorlabs.in/api/send-trial-expired-email",
          {

            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              email: user.email,
              name: user.name || "Champion",
            }),
          }
        )
      }
    }

    return Response.json({
      success: true,
    })

  } catch (error) {

    console.error(error)

    return Response.json({
      success: false,
      error: error.message,
    })
  }
}