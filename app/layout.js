"use client";

import "./globals.css";
import { useState } from "react";
import MobileBottomNav from "./components/MobileBottomNav";

export const metadata = {
  title: "AuctorRC",
  description: "AuctorRC by Auctor Labs — CAT RC mastery platform",
  applicationName: "AuctorRC",
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
  appleWebApp: {
    capable: true,
    title: "AuctorRC",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }) {
  const [view, setView] = useState("home");

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>

      <body
        style={{
          margin: 0,
          paddingBottom: "72px", // 👈 CRITICAL for mobile scroll
          background: "#f8fafc",
        }}
      >
        {/* App Content */}
        <div>{children}</div>

        {/* Mobile Bottom Navigation */}
        <div className="mobile-only">
          <MobileBottomNav view={view} setView={setView} />
        </div>

        {/* Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
