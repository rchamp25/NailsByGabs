import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "nails-by-gabs.vercel.app" }],
        destination: "https://nailsbygabs.org/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
