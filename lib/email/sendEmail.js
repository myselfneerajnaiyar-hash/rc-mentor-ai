import { Resend } from "resend"
import { AUCTOR30_PROMOTION_HTML } from "@/lib/email/promotion"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
}) {
  try {
    const data = await resend.emails.send({
      from: "Auctor <hello@auctorlabs.in>",
      to,
      subject,
      html: `${html}${AUCTOR30_PROMOTION_HTML}`,
    })

    return data
  } catch (error) {
    console.error("Email Error:", error)
    throw error
  }
}
