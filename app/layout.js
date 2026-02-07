import "./globals.css";
import InstallAppButton from "./components/InstallAppButton";

export const metadata = {
  title: "AuctorRC",
  description: "AuctorRC by Auctor Labs — CAT RC mastery platform",
  applicationName: "AuctorRC",

  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/icon-192.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />

        {/* Mobile / iOS support */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* CRITICAL for mobile layout */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </head>

      <body>
        {children}

        {/* Visible Install App button */}
        <InstallAppButton />

        {/* Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
