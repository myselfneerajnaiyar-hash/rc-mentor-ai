import "./globals.css";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import InstallAppButton from "./components/InstallAppButton";

export const metadata = {
  title: "AuctorRC",
  description: "AuctorRC by Auctor Labs – CAT RC mastery platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Register Service Worker */}
        <ServiceWorkerRegister />

        {/* App Content */}
        {children}

        {/* Guaranteed PWA Install Button */}
        <InstallAppButton />
      </body>
    </html>
  );
}
