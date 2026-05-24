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

          <h1 style="font-size:34px; margin-bottom:20px;">
            Your Trial Ends Soon ⏳
          </h1>

          <p style="font-size:18px; color:#444;">
            Hey ${name},
          </p>

          <p style="font-size:18px; line-height:1.7; color:#444;">
            Your AuctorRC free trial is ending soon.
          </p>

          <p style="font-size:18px; line-height:1.7; color:#444;">
            Over the past few days, you’ve already started building:
          </p>

          <div style="margin-top:20px; line-height:2; color:#333;">

            ✅ Faster reading speed<br/>
            ✅ Better RC accuracy<br/>
            ✅ Stronger inference skills<br/>
            ✅ Structured reading habits

          </div>

          <p style="margin-top:30px; font-size:18px; line-height:1.7; color:#444;">
            Don’t let the momentum break now.
          </p>

          <div style="margin-top:30px; line-height:2; color:#333;">

            🧠 Birbal AI Mentor<br/>
            ⚡ Speed Drills<br/>
            📊 Deep RC Analytics<br/>
            📰 Editorial Decoder<br/>
            📚 Unlimited RC Practice

          </div>

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

          <p style="margin-top:40px; color:#666; line-height:1.7;">
            CAT RC improvement comes from consistency,
            not random bursts of motivation.
          </p>

          <p style="color:#666;">
            See you inside 🚀
          </p>

        </div>

      </div>

      `,
    })

    return Response.json(data)

  } catch (error) {

    console.error(error)

    return Response.json({
      error: error.message,
    })

  }

}