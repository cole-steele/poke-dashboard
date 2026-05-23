import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/PokeAPI/sprites/**",
      },
    ],
    formats: ["image/webp"],
    minimumCacheTTL: 31536000,
    imageSizes: [36, 52, 64, 72, 96],
    deviceSizes: [640, 1080, 1920],
    qualities: [75],
  },
};

export default nextConfig;
