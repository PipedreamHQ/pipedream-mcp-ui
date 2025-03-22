import type { MetadataRoute } from 'next'
import { supabase } from "@/lib/supabase"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pipedream-mcp-ui.vercel.app'
  
  // Define root route
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    }
  ]

  // Fetch all app slugs from Supabase
  let appRoutes: MetadataRoute.Sitemap = []
  
  try {
    // Query all app slugs from Supabase
    const { data: apps, error } = await supabase
      .from("apps")
      .select("APP_NAME_SLUG, APP_FEATURED_WEIGHT")
      .not('PD_BUILDER_ONLY', 'is', 'true')
      .order("APP_FEATURED_WEIGHT", { ascending: false })
    
    if (error) {
      console.error("Error fetching app slugs for sitemap:", error)
    } else if (apps && apps.length > 0) {
      // Transform app data into sitemap entries
      appRoutes = apps.map(app => {
        // Determine priority based on featured weight (higher weight = higher priority)
        // Featured apps get priority 0.9, others get 0.7
        const priority = app.APP_FEATURED_WEIGHT && app.APP_FEATURED_WEIGHT > 0 ? 0.9 : 0.7
        
        return {
          url: `${baseUrl}/app/${app.APP_NAME_SLUG}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority,
        }
      })
    }
  } catch (error) {
    console.error("Failed to generate dynamic routes for sitemap:", error)
  }

  // Combine static and dynamic routes
  return [...staticRoutes, ...appRoutes]
}