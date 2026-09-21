import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Private appeal files live outside the application bundle and are resolved
  // only after an authenticated request. Prevent NFT from treating their
  // runtime path as a request to copy the entire repository into these routes.
  outputFileTracingExcludes: {
    "/*": [
      "./next.config.ts",
      "./.agents/**/*",
      "./.claude/**/*",
      "./.codex/**/*",
      "./.data/**/*",
      "./.firecrawl/**/*",
      "./.git/**/*",
      "./.github/**/*",
      "./.obsidian/**/*",
      "./.playwright-cli/**/*",
      "./.playwright-mcp/**/*",
      "./.tmp-allegretto-source-review/**/*",
      "./.vscode/**/*",
      "./audit/**/*",
      "./docs/**/*",
      "./data/**/*",
      "./direct-mcp-ai-project/**/*",
      "./free-claude-code/**/*",
      "./public/**/*",
      "./src/**/*",
      "./prisma/**/*",
      "./scripts/**/*",
    ],
  },
  async redirects() {
    return [
      { source: "/contact", destination: "/appeal", permanent: true },
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
