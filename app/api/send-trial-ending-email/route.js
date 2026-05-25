import { Resend } from "resend"

const resend = new Resend(
  process.env.RESEND_API_KEY
)

export async function POST(req) {

  try {

    const body = await req.json()

    const { email, name } = body

    const data = await resend.emails.send({

      from: "AuctorRC Team <hello@auctorlabs.in>",

      to: email,

      subject: "Your AuctorRC trial ends tomorrow",

      text: `
Hey ${name},

Your AuctorRC free trial ends tomorrow.

You can continue your RC preparation here:

https://rc.auctorlabs.in/pricing

Inside AuctorRC you still have access to:

- Birbal AI Mentor
- RC analytics
- Speed drills
- Editorial Decoder
- Unlimited RC practice

Consistency matters more than motivation in RC preparation.

See you inside,
AuctorRC Team
      `,

      html: `

      <div style="font-family: Arial, sans-serif; padding: 32px; color:#222;">

        <h2>
          Your AuctorRC trial ends tomorrow
        </h2>

        <p>
          Hey ${name},
        </p>

        <p>
          Your AuctorRC free trial ends tomorrow.
        </p>

        <p>
          You can continue your RC preparation here:
        </p>

        <p>
          <a href="https://rc.auctorlabs.in/pricing">
            https://rc.auctorlabs.in/pricing
          </a>
        </p>

        <p>
          Inside AuctorRC you still have access to:
        </p>

        <ul>
          <li>Birbal AI Mentor</li>
          <li>RC analytics</li>
          <li>Speed drills</li>
          <li>Editorial Decoder</li>
          <li>Unlimited RC practice</li>
        </ul>

        <p>
          Consistency matters more than motivation in RC preparation.
        </p>

        <p>
          See you inside,<br/>
          AuctorRC Team
        </p>

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