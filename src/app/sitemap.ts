import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface SitemapProfile {
  username: string;
  created_at: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voucht.tech";

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Only real accounts: a sitemap may not advertise proof pages that do not
  // exist, and inventing usernames would also leak which handles we tried.
  let dynamicProfiles: MetadataRoute.Sitemap = [];
  try {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("public_profiles")
        .select("username, created_at")
        .limit(5000);

      const profiles = data as SitemapProfile[] | null;

      if (profiles && profiles.length > 0) {
        dynamicProfiles = profiles.map((p) => ({
          url: `${baseUrl}/profile/${p.username}`,
          lastModified: p.created_at ? new Date(p.created_at) : new Date(),
          changeFrequency: "daily" as const,
          priority: 0.9,
        }));
      }
    }
  } catch {
    // A database that is unreachable simply yields a sitemap of core pages.
  }

  return [...staticRoutes, ...dynamicProfiles];
}

