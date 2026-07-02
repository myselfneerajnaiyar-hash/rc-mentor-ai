import "./globals.css"
import Script from "next/script"
import PostHogProvider from "../components/PostHogProvider"

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Auctor RC – CAT VARC Practice Platform",
  description:
    "Auctor RC is an AI-powered CAT VARC practice platform for reading comprehension and reasoning.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Google Ads Global Site Tag */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18259887177"
          strategy="afterInteractive"
        />

        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18259887177');
          `}
        </Script>

        <PostHogProvider />
        {children}
      </body>
    </html>
  );
}