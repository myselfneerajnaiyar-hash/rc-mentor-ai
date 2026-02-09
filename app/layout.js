const APP_VERSION = "auctorrc-v3"; // 🔥 bump this on ANY UI change

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-version={APP_VERSION}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta httpEquiv="Cache-Control" content="no-store" />
      </head>

      <body>
        {children}

        {/* ✅ SW REGISTER — ONLY PLACE */}
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
