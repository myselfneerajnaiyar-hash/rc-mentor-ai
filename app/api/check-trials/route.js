import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {

  try {

    // -----------------------------
    // TOMORROW DATE
    // -----------------------------

    const tomorrow = new Date()

    tomorrow.setDate(
      tomorrow.getDate() + 1
    )

    const tomorrowISO =
      tomorrow.toISOString().split("T")[0]

    // -----------------------------
    // FETCH USERS
    // -----------------------------

    const { data: users, error } =
      await supabase
        .from("profiles")
        .select("*")

    if (error) {

      console.error(error)

      return Response.json({
        success: false,
        error: error.message,
      })
    }

    // -----------------------------
    // LOOP USERS
    // -----------------------------

    for (const user of users || []) {

      // skip premium users
      if (user.is_premium === true) {
        continue
      }

      // skip missing trial
      if (!user.trial_expires_at) {
        continue
      }

      const expiryDate =
        new Date(user.trial_expires_at)
          .toISOString()
          .split("T")[0]

      // -----------------------------
      // IF TRIAL ENDS TOMORROW
      // -----------------------------

      if (expiryDate === tomorrowISO) {

        console.log(
          "Sending trial ending email to:",
          user.email
        )

        // -----------------------------
        // SEND EMAIL
        // -----------------------------

        await fetch(
          "https://rc.auctorlabs.in/api/send-trial-ending-email",
          {

            method: "POST",

            headers: {
              "Content-Type": "application/json",
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

  } catch (error) {

    console.error(error)

    return Response.json({
      success: false,
      error: error.message,
    })
  }
}