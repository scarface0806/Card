import type { NextConfig } from "next";

import { CANONICAL_ORIGIN, LEGACY_VERCEL_HOST } from "./src/lib/site-config";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async redirects() {
    return [
      // /order and /create-card were two live routes running near-identical
      // five-step checkout forms, reached from different CTAs. /create-card is
      // canonical: it is the target of nearly every CTA and it is the only one
      // that supports ?template=. /order carried no functionality of its own.
      { source: "/order", destination: "/create-card", permanent: true },

      // ---------------------------------------------------------------------
      // DOMAIN MIGRATION -> tapvyo.in
      //
      // One origin, or Google splits ranking signals across three hosts and
      // treats the same page on each as duplicate content. Both rules below
      // are 308 (permanent: true), which is what transfers link equity.
      //
      // `:path*` preserves the full path, and Next carries the query string
      // across a redirect automatically - no need to restate it.
      //
      // These match the HOST, so they only fire for the hosts named. Vercel
      // preview deployments get their own per-deploy hostnames and are not
      // matched, so previews keep working normally.
      // ---------------------------------------------------------------------

      // The pre-migration Vercel alias. Keep this rule for as long as the old
      // host has inbound links or Search Console history - it is what carries
      // the old URLs' equity to the new domain. Removing it early strands them.
      {
        source: "/:path*",
        has: [{ type: "host", value: LEGACY_VERCEL_HOST }],
        destination: `${CANONICAL_ORIGIN}/:path*`,
        permanent: true,
      },

      // www -> apex. Apex is the canonical form, matching CANONICAL_ORIGIN.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.tapvyo.in" }],
        destination: `${CANONICAL_ORIGIN}/:path*`,
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@heroicons/react", "framer-motion"],
  },
};

export default nextConfig;
