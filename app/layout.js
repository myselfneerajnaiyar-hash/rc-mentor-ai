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
  </head>
  <body>{children}</body>
</html>
  );
}
