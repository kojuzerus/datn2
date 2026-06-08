import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Local dev backend
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/**",
      },
      // Render production backend (set NEXT_PUBLIC_API_URL to your Render URL)
      {
        protocol: "https",
        hostname: "*.onrender.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
