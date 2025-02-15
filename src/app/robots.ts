import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/sign-in", "/sign-up", "/agents", "/history"],
      },
    ],
    sitemap: "https://audentic.io/sitemap.xml",
    host: "https://audentic.io",
  };
}
