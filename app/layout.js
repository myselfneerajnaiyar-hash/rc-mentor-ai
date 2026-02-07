import "./globals.css";

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
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>

      <body>
        {children}

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
