import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { HealthCheckProvider } from "../components/providers/health-check-provider";
import { SessionProvider } from "../components/providers/SessionProvider";
import { CookieConsentProvider } from "../components/ui/cookie-consent-modal";
import { NotificationsProvider } from "../contexts/NotificationsContext";
import { NavigationLoadingProvider } from "../contexts/NavigationLoadingContext";
import { DynamicConvexProvider, DynamicNavigation } from "../components/providers/ClientOnlyProvider";
import { GlobalErrorBoundary } from "../components/providers/GlobalErrorBoundary";
import { PageLoadingProvider } from "../components/providers/PageLoadingProvider";

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
        {/* Google Fonts preconnect links removed - now using Next.js font system */}
      </head>
      <body className={`${geistSans.variable} bg-slate-950 text-white`}>
        <GlobalErrorBoundary>
          <DynamicConvexProvider>
            <CookieConsentProvider>
              <NotificationsProvider>
                <NavigationLoadingProvider>
                  <SessionProvider>
                    <HealthCheckProvider>
                      <DynamicNavigation />
                      <main style={{ minHeight: "calc(100vh - 64px)" }}>
                        {children}
                      </main>
                      <PageLoadingProvider />
                      <Toaster position="bottom-left" theme="dark" />
                    </HealthCheckProvider>
                  </SessionProvider>
                </NavigationLoadingProvider>
              </NotificationsProvider>
            </CookieConsentProvider>
          </DynamicConvexProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
