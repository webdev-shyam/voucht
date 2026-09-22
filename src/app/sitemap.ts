import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface SitemapProfile {
  username: string;
  updated_at: string | null;
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
      url: `${baseUrl}/verify`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamic user profiles
  let dynamicProfiles: MetadataRoute.Sitemap = [];
  try {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("profiles")
        .select("username, updated_at")
        .limit(100);

      const profiles = data as SitemapProfile[] | null;

      if (profiles && profiles.length > 0) {
        dynamicProfiles = profiles.map((p) => ({
          url: `${baseUrl}/profile/${p.username}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: "daily",
          priority: 0.9,
        }));
      }
    }
  } catch {
    // If Supabase is offline/not configured, provide seed profiles
  }

  // Fallback seed profiles if none loaded
  if (dynamicProfiles.length === 0) {
    const defaultUsernames = ["alexrivera", "sarahtaylor", "devmarcus", "elena_craft"];
    dynamicProfiles = defaultUsernames.map((username) => ({
      url: `${baseUrl}/profile/${username}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    }));
  }

  return [...staticRoutes, ...dynamicProfiles];
}

