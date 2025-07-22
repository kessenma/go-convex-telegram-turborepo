import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { HealthCheckProvider } from "../components/providers/health-check-provider";
import { SessionProvider } from "../components/providers/SessionProvider";
import { CookieConsentProvider } from "../components/ui/cookie-consent-modal";
import { NotificationsProvider } from "../contexts/NotificationsContext";
import { DynamicConvexProvider, DynamicNavigation } from "../components/providers/ClientOnlyProvider";
import { GlobalErrorBoundary } from "../components/providers/GlobalErrorBoundary";

// Force dynamic rendering to prevent SSR context issues
export const dynamic = "force-dynamic";

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
        <GlobalErrorBoundary>
          <DynamicConvexProvider>
            <CookieConsentProvider>
              <NotificationsProvider>
                <SessionProvider>
                  <HealthCheckProvider>
                    <DynamicNavigation />
                    <main style={{ minHeight: "calc(100vh - 64px)" }}>
                      {children}
                    </main>
                    <Toaster position="bottom-left" theme="dark" />
                  </HealthCheckProvider>
                </SessionProvider>
              </NotificationsProvider>
            </CookieConsentProvider>
          </DynamicConvexProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
