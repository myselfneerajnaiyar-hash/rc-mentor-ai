import "./globals.css";

export const metadata = {
  title: "AuctorRC",
  description: "AuctorRC by Auctor Labs — CAT RC mastery platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
