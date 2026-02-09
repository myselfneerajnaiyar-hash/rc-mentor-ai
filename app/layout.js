import "./globals.css";
import InstallAppButton from "./components/InstallAppButton";

export const metadata = {
  title: "AuctorRC",
  description: "CAT Reading Comprehension Mentor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body>
        {children}
        <InstallAppButton />

        {/* REQUIRED for PWA install eligibility */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
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
