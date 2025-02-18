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
    sitemap: "https://www.audentic.io/sitemap.xml",
    host: "https://www.audentic.io",
  };
}
