import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req) {

  try {

    const body = await req.json()

    const { email, name } = body

    const data = await resend.emails.send({
      from: "Auctor <hello@auctorlabs.in>",
      to: email,
      subject: "Welcome to AuctorRC 🚀",

     html: `
<div style="font-family: Arial, sans-serif; background:#f5f7fb; padding:40px;">

  <div style="max-width:600px; margin:auto; background:white; border-radius:18px; padding:40px;">

    <h1 style="font-size:36px; margin-bottom:10px;">
      Welcome to AuctorRC 🚀
    </h1>

    <p style="font-size:18px; color:#444;">
      Hey ${name},
    </p>

    <p style="font-size:18px; line-height:1.7; color:#444;">
      You’re not joining another random RC practice platform.
    </p>

    <p style="font-size:18px; line-height:1.7; color:#444;">
      AuctorRC is built to train reading intelligence for exams like CAT, XAT, GMAT & SNAP through adaptive practice, analytics, and AI-powered mentoring.
    </p>

    <div style="margin-top:30px;">

      <div style="margin-bottom:20px;">
        🧠 <strong>Birbal AI Mentor</strong><br/>
        Understand inference traps, close options, tone, elimination logic & author intent.
      </div>

      <div style="margin-bottom:20px;">
        ⚡ <strong>Daily Workouts, RC practice & Speed Drils</strong><br/>
        Improve reading speed, focus & retention under pressure.
      </div>

      <div style="margin-bottom:20px;">
        📊 <strong>Performance Analytics</strong><br/>
        Track accuracy, weak areas, reading behavior & RC growth over time.
      </div>

      <div style="margin-bottom:20px;">
        📰 <strong>Editorial Decoder</strong><br/>
        Upload screenshots of editorials directly from your phone and let Birbal break them down instantly.
      </div>

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
        Start Your First RC →
      </a>

    </div>

    <p style="margin-top:40px; color:#666; line-height:1.7;">
      The goal is simple:
      make RC preparation smarter, measurable, and systematic.
    </p>

    <p style="color:#666;">
      Glad to have you onboard 🙌
    </p>

  </div>

</div>
`
    })

    return Response.json(data)

  } catch (error) {

    console.error(error)

    return Response.json({
      error: error.message,
    })

  }

}