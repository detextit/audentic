import type { NextConfig } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
let redirectHost: string | undefined;
let redirectDestination: string | undefined;

if (siteUrl) {
  try {
    const parsed = new URL(siteUrl);
    if (parsed.hostname.startsWith("www.")) {
      redirectHost = parsed.hostname.replace(/^www\./, "");
      redirectDestination = parsed.origin;
    }
  } catch {
    redirectHost = undefined;
    redirectDestination = undefined;
  }
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/token",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          { key: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-API-Key, Content-Type, Authorization",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/api/sessions/create",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          { key: "Access-Control-Allow-Methods", value: "POST" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
      {
        source: "/api/sessions/end",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          { key: "Access-Control-Allow-Methods", value: "POST" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
      {
        source: "/api/events/log",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          { key: "Access-Control-Allow-Methods", value: "POST" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "index, follow",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
      };
    }
    return config;
  },
  trailingSlash: false,
  async redirects() {
    if (!redirectHost || !redirectDestination) {
      return [];
    }

    return [
      {
        source: "/",
        has: [
          {
            type: "host",
            value: redirectHost,
          },
        ],
        destination: redirectDestination,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
