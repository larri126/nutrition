import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next"; // Importamos el tipo para asegurar

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https" as const, // <--- AQUÍ ESTÁ EL ARREGLO
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default withPWA(nextConfig);