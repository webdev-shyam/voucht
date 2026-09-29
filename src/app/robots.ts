import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voucht.tech";

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
