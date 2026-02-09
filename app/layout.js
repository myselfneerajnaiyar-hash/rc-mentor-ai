import "./globals.css";

export const metadata = {
  title: "AuctorRC",
  description: "CAT Reading Comprehension Mentor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme color for Android status bar */}
        <meta name="theme-color" content="#2563eb" />

        {/* Mobile viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </head>
      <body>
        {children}
            <script
  dangerouslySetInnerHTML={{
    __html: `
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
      }
    `,
  }}
/>
      </body>
    </html>
  );
}
