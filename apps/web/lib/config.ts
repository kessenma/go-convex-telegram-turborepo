// Create apps/web/lib/config.ts
export const config = {
  convex: {
    url: process.env.NEXT_PUBLIC_CONVEX_URL!,
    serverUrl: process.env.CONVEX_URL!,
    dashboardPort: process.env.NEXT_PUBLIC_CONVEX_DASHBOARD_PORT || "6791",
  },
  telegram: {
    botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
    token: process.env.TELEGRAM_BOT_TOKEN,
  },
};
