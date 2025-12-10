import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Empty turbopack config to acknowledge Next.js 16+ Turbopack default
  // Keep webpack config for backwards compatibility
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias.canvas = false;
    } else {
      // Exclude geoip-lite from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
