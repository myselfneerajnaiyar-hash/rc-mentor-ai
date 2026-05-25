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

      subject: "Your AuctorRC Trial Ends Soon ⏳",

      html: `
        <div style="font-family: Arial, sans-serif; background:#f5f7fb; padding:40px;">

          <div style="max-width:600px; margin:auto; background:white; border-radius:18px; padding:40px;">

            <h1 style="font-size:34px; color:#111827;">
              Your Trial Ends Soon ⏳
            </h1>

            <p style="font-size:18px; color:#374151;">
              Hey ${name},
            </p>

            <p style="font-size:18px; line-height:1.8; color:#374151;">
              Your AuctorRC free trial is ending soon.
            </p>

            <p style="font-size:18px; line-height:1.8; color:#374151;">
              You've already started improving:
            </p>

            <ul style="font-size:18px; line-height:2; color:#374151; padding-left:20px;">
              <li>Faster reading speed</li>
              <li>Better RC accuracy</li>
              <li>Stronger inference skills</li>
              <li>Structured reading habits</li>
            </ul>

            <p style="font-size:18px; line-height:1.8; color:#374151; margin-top:30px;">
              Continue your momentum with:
            </p>

            <ul style="font-size:18px; line-height:2; color:#374151; padding-left:20px;">
              <li>Birbal AI Mentor</li>
              <li>Speed Drills</li>
              <li>Deep RC Analytics</li>
              <li>Editorial Decoder</li>
              <li>Unlimited RC Practice</li>
            </ul>

            <div style="margin-top:40px; text-align:center;">

              <a
                href="https://rc.auctorlabs.in/pricing"
                style="
                  background:#2563eb;
                  color:white;
                  padding:16px 28px;
                  border-radius:12px;
                  text-decoration:none;
                  font-weight:bold;
                  display:inline-block;
                "
              >
                Upgrade to Premium →
              </a>

            </div>

            <p style="margin-top:40px; font-size:16px; color:#6b7280; line-height:1.8;">
              RC improvement comes from consistency,
              not random bursts of motivation.
            </p>

            <p style="font-size:16px; color:#6b7280;">
              See you inside 🚀
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