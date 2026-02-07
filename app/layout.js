export const metadata = {
  title: "AuctorRC",
  description: "AuctorRC by Auctor Labs – CAT RC mastery platform",

  manifest: "/manifest.json",

  themeColor: "#2563eb",

  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
