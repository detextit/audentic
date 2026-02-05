import { MetadataRoute } from "next";
import { getAbsoluteUrl, getBaseSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/sign-in", "/sign-up", "/agents", "/history"],
      },
    ],
    sitemap: getAbsoluteUrl("/sitemap.xml"),
    host: baseUrl,
  };
}
