export default function WelcomeEmail({ name }) {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h1>Welcome to AuctorRC 🚀</h1>

      <p>Hey ${name},</p>

      <p>
        Your CAT preparation system is now live.
      </p>

      <p>
        Let's crack CAT together.
      </p>
    </div>
  `
}