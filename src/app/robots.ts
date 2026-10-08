import { MetadataRoute } from "next";
import { APP_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The whole dashboard is private, session-scoped data — nothing there
      // should be crawled, even the parts a logged-out visitor cannot reach.
      disallow: ["/api/", "/dashboard"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
