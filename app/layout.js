import "./globals.css"
import Script from "next/script"

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
        {children}
      </body>
    </html>
  );
}