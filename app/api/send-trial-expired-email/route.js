import { Resend } from "resend"

const resend = new Resend(
  process.env.RESEND_API_KEY
)

export async function POST(req) {

  try {

    const body = await req.json()

    const { email, name } = body

    const data = await resend.emails.send({

      from: "AuctorRC <hello@auctorlabs.in>",

      to: email,

      subject: "Your AuctorRC Trial Has Ended",

      html: `
        <div style="font-family: Arial, sans-serif; background:#f5f7fb; padding:40px;">

          <div style="max-width:600px; margin:auto; background:white; border-radius:18px; padding:40px;">

            <h1 style="font-size:34px; color:#111827;">
              Your Trial Has Ended ⏳
            </h1>

            <p style="font-size:18px; color:#374151;">
              Hey ${name},
            </p>

            <p style="font-size:18px; line-height:1.8; color:#374151;">
              Your AuctorRC free trial has officially ended.
            </p>

            <p style="font-size:18px; line-height:1.8; color:#374151;">
              Which means you've now lost access to:
            </p>

            <ul style="font-size:18px; line-height:2; color:#374151; padding-left:20px;">
              <li>Birbal AI Mentor</li>
              <li>Unlimited RC Practice</li>
              <li>Speed Drills</li>
              <li>Editorial Decoder</li>
              <li>Advanced RC Analytics</li>
            </ul>

            <p style="font-size:18px; line-height:1.8; color:#374151; margin-top:30px;">
              Most students improve RC only when they stay consistent for weeks — not days.
            </p>

            <p style="font-size:18px; line-height:1.8; color:#374151;">
              Don’t break the momentum you already started building.
            </p>

            <div style="margin-top:40px; text-align:center;">

              <a
                href="https://rc.auctorlabs.in/pricing"
                style="
                  background:#111827;
                  color:white;
                  padding:16px 28px;
                  border-radius:12px;
                  text-decoration:none;
                  font-weight:bold;
                  display:inline-block;
                "
              >
                Reactivate Premium →
              </a>

            </div>

            <p style="margin-top:40px; font-size:16px; color:#6b7280; line-height:1.8;">
              Reading intelligence compounds slowly.
              The students who stay consistent usually dominate CAT RC.
            </p>

            <p style="font-size:16px; color:#6b7280;">
              See you back inside 🚀
            </p>

          </div>

        </div>
      `,
    })

    return Response.json({
      success: true,
      data,
    })

  } catch (error) {

    console.error(error)

    return Response.json({
      success: false,
      error: error.message,
    })
  }
}