import type { NextConfig } from "next";

module.exports = {
  images: {
    remotePatterns: [new URL("https://placehold.co/300x400/000000/FFFFFF/png")],
  },
};
const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
