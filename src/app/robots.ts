import { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || SITE_ORIGIN;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The whole dashboard is private, session-scoped data — nothing there
      // should be crawled, even the parts a logged-out visitor cannot reach.
      disallow: ["/api/", "/dashboard"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
