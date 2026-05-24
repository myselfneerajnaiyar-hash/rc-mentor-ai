import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req) {

  try {

    const body = await req.json()

    const {
      email,
      name,
      plan,
      amount,
      expiry,
    } = body

    const data = await resend.emails.send({

      from: "AuctorRC <hello@auctorlabs.in>",

      to: email,

      subject: "Your AuctorRC Subscription is Active 🚀",

      html: `

      <div style="font-family: Arial, sans-serif; background:#f5f7fb; padding:40px;">

        <div style="max-width:600px; margin:auto; background:white; border-radius:18px; padding:40px;">

          <h1 style="font-size:34px; margin-bottom:10px;">
            Payment Successful ✅
          </h1>

          <p style="font-size:18px; color:#444;">
            Hey ${name},
          </p>

          <p style="font-size:18px; line-height:1.7; color:#444;">
            Your AuctorRC subscription is now active.
          </p>

          <div style="
            background:#f3f4f6;
            padding:24px;
            border-radius:14px;
            margin-top:30px;
            margin-bottom:30px;
          ">

            <p style="margin:0 0 12px 0;">
              <strong>Plan:</strong> ${plan}
            </p>

            <p style="margin:0 0 12px 0;">
              <strong>Amount Paid:</strong> ₹${amount}
            </p>

            <p style="margin:0;">
              <strong>Access Valid Till:</strong> ${expiry}
            </p>

          </div>

          <p style="font-size:18px; line-height:1.7; color:#444;">
            You now have access to:
          </p>

          <div style="margin-top:20px; line-height:2; color:#333;">

            ✅ Adaptive RC Practice<br/>
            ✅ Birbal AI Mentor<br/>
            ✅ Speed Drills<br/>
            ✅ Editorial Decoder<br/>
            ✅ RC Analytics & History<br/>
            ✅ Vocabulary Workflows

          </div>

          <div style="margin-top:40px; text-align:center;">

            <a
              href="https://rc.auctorlabs.in"
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
              Continue Training →
            </a>

          </div>

          <p style="margin-top:40px; color:#666; line-height:1.7;">
            Consistency compounds.
            Show up daily and your RC ability will transform over time.
          </p>

          <p style="color:#666;">
            Welcome to serious RC training 🚀
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