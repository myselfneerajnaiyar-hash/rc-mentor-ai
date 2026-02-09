import ServiceWorkerRegister from "./components/ServiceWorkerRegister";

const APP_VERSION = "auctorrc-v3"; // 🔥 CHANGE this string on ANY UI change

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-version={APP_VERSION}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta
          httpEquiv="Cache-Control"
          content="no-store, must-revalidate"
        />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
