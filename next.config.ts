import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Opt jspdf and fflate out of server bundling — they use dynamic Worker()
  // calls that Turbopack can't statically resolve during SSR.
  serverExternalPackages: ["jspdf", "fflate"],

  // Suppress the known "Can't resolve <dynamic>" issue in fflate/node.cjs —
  // it's a feature-detected Worker() fallback that we never hit (we run in
  // the browser where Web Workers are native). The code still works; the
  // static resolver just can't see it. Safe to ignore.
  turbopack: {
    ignoreIssue: [
      {
        path: "**/node_modules/fflate/**",
      },
      {
        path: "**/node_modules/jspdf/**",
      },
    ],
  },
};

export default nextConfig;
