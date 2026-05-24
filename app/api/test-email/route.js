import { resend } from "@/lib/resend"

export async function GET() {

  try {

    const data = await resend.emails.send({
      from: "Auctor <notify@auctorlabs.in>",
      to: "myselfneerajnaiyar@gmail.com",
      subject: "Auctor Email Test",
      html: `
        <h1>Email system working 🚀</h1>
        <p>Auctor transactional infra is live.</p>
      `,
    })

    return Response.json(data)

  } catch (err) {

    return Response.json({
      error: err.message,
    })
  }
}