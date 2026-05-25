import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {

  const tomorrow = new Date()

  tomorrow.setDate(
    tomorrow.getDate() + 1
  )

  const tomorrowDate =
    tomorrow.toISOString().split("T")[0]

  const { data: users, error } =
    await supabase
      .from("profiles")
      .select("*")

  console.log(users)

  for (const user of users || []) {

    if (!user.trial_expires_at) continue

    const expiry =
      new Date(user.trial_expires_at)

    const expiryDate =
      expiry.toISOString().split("T")[0]

    console.log(
      user.email,
      expiryDate,
      tomorrowDate
    )

    if (expiryDate === tomorrowDate) {

      console.log(
        "SENDING EMAIL TO:",
        user.email
      )

      await fetch(
        "https://rc.auctorlabs.in/api/send-trial-ending-email",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: user.email,
            name:
              user.name || "Champion",
          }),
        }
      )
    }
  }

  return Response.json({
    success: true,
  })
}