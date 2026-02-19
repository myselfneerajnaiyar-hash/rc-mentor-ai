import "./globals.css";
import Navbar from "../components/Navbar"; // adjust path if needed

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
        <Navbar />   {/* 🔥 ADD THIS */}
        {children}
      </body>
    </html>
  );
}