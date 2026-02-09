import "./globals.css";

export const metadata = {
  title: "AuctorRC",
  description: "CAT Reading Comprehension Mentor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* ❌ NO manifest */}
        {/* ❌ NO service worker */}
        {/* ❌ NO install logic */}

        {/* Force browser to NEVER cache HTML */}
        <meta
          httpEquiv="Cache-Control"
          content="no-store, no-cache, must-revalidate, proxy-revalidate"
        />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />

        {/* Theme color is harmless */}
        <meta name="theme-color" content="#2563eb" />
      </head>

      <body>{children}</body>
    </html>
  );
}
