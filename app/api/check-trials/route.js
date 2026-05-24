import { Resend } from "resend"

const resend = new Resend(
  process.env.RESEND_API_KEY
)

export async function POST(req) {

  try {

    const body = await req.json()

    const { email, name } = body

    const data = await resend.emails.send({

      from: "Auctor <hello@auctorlabs.in>",

      to: email,

      subject: "Your AuctorRC trial ends tomorrow ⏳",

      html: `
      
      <div style="
        font-family: Arial;
        padding: 32px;
        background: #f8fafc;
      ">

        <div style="
          max-width: 600px;
          margin: auto;
          background: white;
          border-radius: 16px;
          padding: 40px;
        ">

          <h1 style="
            font-size: 32px;
            margin-bottom: 20px;
          ">
            Your Trial Ends Tomorrow ⏳
          </h1>

          <p style="font-size:18px;">
            Hey ${name},
          </p>

          <p style="
            font-size:16px;
            line-height:1.8;
          ">
            Your AuctorRC free trial will expire tomorrow.
          </p>

          <p style="
            font-size:16px;
            line-height:1.8;
          ">
            You've already unlocked:
          </p>

          <ul style="
            line-height:2;
            font-size:16px;
          ">
            <li>🧠 Birbal AI RC Mentor</li>
            <li>⚡ Speed Drills</li>
            <li>📊 RC Analytics</li>
            <li>📚 Vocabulary Workflows</li>
            <li>🏆 Streaks & Leaderboards</li>
          </ul>

          <p style="
            font-size:16px;
            line-height:1.8;
          ">
            Continue building elite RC intelligence.
          </p>

          <a
            href="https://rc.auctorlabs.in/pricing"
            style="
              display:inline-block;
              margin-top:24px;
              background:#7c3aed;
              color:white;
              padding:14px 24px;
              border-radius:10px;
              text-decoration:none;
              font-weight:bold;
            "
          >
            Upgrade Now 🚀
          </a>

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