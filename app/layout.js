import "./globals.css"
import Script from "next/script"

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AuctorRC",
  description: "CAT Reading Comprehension Mentor"
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>

        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />

        {children}

      </body>
    </html>
  );
}