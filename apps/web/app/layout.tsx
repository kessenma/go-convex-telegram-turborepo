import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import Navigation from "../components/Navigation";
import { HealthCheckProvider } from "../components/providers/health-check-provider";
import { SessionProvider } from "../components/SessionProvider";
import { CookieConsentProvider } from "../components/ui/cookie-consent-modal";
import { NotificationsProvider } from "../contexts/NotificationsContext";
import { ConvexClientProvider } from "../providers/ConvexClientProvider";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Telegram Bot Dashboard",
  description: "Monitor and manage your Telegram bot messages",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable} bg-slate-950 text-white`}>
        <ConvexClientProvider>
          <CookieConsentProvider>
            <NotificationsProvider>
              <SessionProvider>
                <HealthCheckProvider>
                  <Navigation />
                  <main style={{ minHeight: "calc(100vh - 64px)" }}>
                    {children}
                  </main>
                  <Toaster position="bottom-left" theme="dark" />
                </HealthCheckProvider>
              </SessionProvider>
            </NotificationsProvider>
          </CookieConsentProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
