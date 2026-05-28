import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/diagnostics", destination: "/procedures", permanent: true },
      { source: "/career", destination: "/doctors", permanent: true },
      { source: "/scientific-schools", destination: "/history", permanent: true },
      { source: "/lenses", destination: "/equipment", permanent: true },
      { source: "/consumables", destination: "/equipment", permanent: true },
      { source: "/diagnostic-systems", destination: "/equipment", permanent: true },
      { source: "/dissertations", destination: "/publications", permanent: true },
      { source: "/licensing", destination: "/regulations", permanent: true },
      { source: "/standards", destination: "/regulations", permanent: true },
    ];
  },
};

export default nextConfig;
