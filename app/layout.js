export const metadata = {
  title: "RC Mentor AI",
  description: "Your personal RC mentor for CAT",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
