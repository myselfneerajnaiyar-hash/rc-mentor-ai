import "./globals.css"

export const metadata = {
  title: "AuctorRC",
  description: "CAT Reading Comprehension Mentor",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>

      <body>
        {children}
      </body>

    </html>
  )
}