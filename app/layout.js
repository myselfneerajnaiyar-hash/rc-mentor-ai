import "./globals.css"
import Script from "next/script"
import PostHogProvider from "../components/PostHogProvider"

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Auctor RC – CAT VARC Practice Platform",
  description:
    "Auctor RC is an AI-powered CAT VARC practice platform for reading comprehension and reasoning.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Google Ads Global Site Tag */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18259887177"
          strategy="afterInteractive"
        />

        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18259887177');
          `}
        </Script>
        <Script id="meta-pixel" strategy="afterInteractive">
  {`
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', '1724851152297636');
    fbq('track', 'PageView');
  `}
</Script>

        <PostHogProvider />
        {children}
        <noscript>
  <img
    height="1"
    width="1"
    style={{ display: "none" }}
    src="https://www.facebook.com/tr?id=1724851152297636&ev=PageView&noscript=1"
    alt=""
  />
</noscript>
      </body>
    </html>
  );
}