import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navigation from "../components/Navigation";
import { ConvexClientProvider } from "../providers/ConvexClientProvider";
import { NotificationsProvider } from "../contexts/NotificationsContext";
import { Toaster } from "sonner";

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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet" />
      </head>
      <body className={`${geistSans.variable} bg-slate-950 text-white`}>
        <ConvexClientProvider>
          <NotificationsProvider>
            <Navigation />
            <main style={{ minHeight: "calc(100vh - 64px)" }}>
              {children}
            </main>
            <Toaster position="bottom-left" theme="dark" />
          </NotificationsProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
