import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // static export for capacitor; this will generate an `out` folder
  output: "export",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
