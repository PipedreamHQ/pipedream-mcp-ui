import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createBackendClient } from "@pipedream/sdk/server"
import { ProjectEnvironment } from "@/lib/utils"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const page = Number.parseInt(searchParams.get("page") || "1")
  const pageSize = 30
  const useBackup = searchParams.get("useBackup") === "true"

  // Try Supabase first unless backup is explicitly requested
  if (!useBackup) {
    try {
      console.log("Attempting to fetch from Supabase apps table...")

      // First, let's check if we can connect to Supabase and the correct table
      const { data: tableInfo, error: tableError } = await supabase.from("apps").select("count").limit(1)

      if (tableError) {
        console.error("Error connecting to Supabase apps table:", tableError)
        throw new Error(`Supabase connection error: ${tableError.message}`)
      }

      console.log("Successfully connected to apps table:", tableInfo)

      // Check if the table has any records
      const { count, error: countError } = await supabase.from("apps").select("*", { count: "exact", head: true })

      if (countError) {
        console.error("Error getting count from apps table:", countError)
        throw new Error(`Supabase count error: ${countError.message}`)
      }

      console.log("Apps table record count:", count)

      // If the table is empty, fall back to Pipedream API
      if (!count || count === 0) {
        console.log("Apps table is empty, falling back to Pipedream API")
        throw new Error("Supabase apps table is empty")
      }

      // Now let's try our actual query
      let supabaseQuery = supabase.from("apps").select("*", { count: "exact" })
        .not('PD_BUILDER_ONLY', 'is', 'true')

      // Log the query details
      const { data: queryPreview, error: previewError } = await supabaseQuery.limit(1)
      console.log("Query preview result:", queryPreview)
      if (previewError) {
        console.error("Query preview error:", previewError)
      }

      console.log("Built Supabase query with PD_BUILDER_ONLY filter")

      // Apply search filter if query exists
      if (query) {
        // Properly sanitize input and use parameterized queries
        const sanitizedQuery = query.replace(/[%_\\]/g, '\\$&'); // Escape special characters
        // Using string format for filter which works with Supabase syntax
        supabaseQuery = supabaseQuery.or(`APP_NAME.ilike.%${sanitizedQuery}%,APP_NAME_SLUG.ilike.%${sanitizedQuery}%,APP_DESCRIPTION.ilike.%${sanitizedQuery}%`)
      }

      // Apply category filter if category exists
      if (category) {
        // Validate category input - categories should only contain alphanumeric and spaces
        if (!/^[a-zA-Z0-9 ]+$/.test(category)) {
          throw new Error("Invalid category format")
        }
        supabaseQuery = supabaseQuery.eq("CATEGORY_NAME", category)
      }

      // Calculate pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      console.log("Fetching apps with range:", from, "to", to)

      try {
        // Order by featured_weight (descending) and then alphabetically
        const {
          data: apps,
          error,
          count: totalCount,
        } = await supabaseQuery
          .order("APP_FEATURED_WEIGHT", { ascending: false })
          .order("APP_NAME", { ascending: true })
          .range(from, to)

        if (error) {
          console.error("Error fetching apps from Supabase:", error)
          throw new Error(`Supabase query error: ${error.message}`)
        }

        console.log("Successfully fetched from Supabase:", apps?.length, "apps")

        // If no apps were returned, fall back to Pipedream API
        if (!apps || apps.length === 0) {
          console.log("No apps returned from Supabase, falling back to Pipedream API")
          throw new Error("No apps returned from Supabase")
        }

        // Log the first app to see its structure
        if (apps && apps.length > 0) {
          console.log("First app structure:", Object.keys(apps[0]))
        }

        // Map the Supabase data to our app structure
        const mappedApps =
          apps?.map((app) => ({
            id: app.APP_ID.toString(),
            name: app.APP_NAME,
            name_slug: app.APP_NAME_SLUG,
            app_hid: app.APP_HID,
            description: app.APP_DESCRIPTION,
            categories: app.CATEGORY_NAME ? [app.CATEGORY_NAME] : [],
            featured_weight: app.APP_FEATURED_WEIGHT, // Already a number (bigint)
            api_docs_url: app.APP_API_DOCS_URL,
            status: app.APP_STATUS,
          })) || []

        return NextResponse.json({
          data: mappedApps,
          page_info: {
            total_count: totalCount || 0,
            current_page: page,
            page_size: pageSize,
            has_more: totalCount ? from + (apps?.length || 0) < totalCount : false,
          },
          source: "supabase",
        })
      } catch (error: unknown) {
        console.error("Error fetching apps from Supabase:", error)
        throw new Error(`Supabase query error: ${error instanceof Error ? error.message : String(error)}`)
      }
    } catch (error: unknown) {
      console.error("Supabase fetch failed, falling back to Pipedream API:", error)
      // Fall through to Pipedream API
    }
  }

  // Fallback to Pipedream API
  try {
    console.log("Fetching from Pipedream API...")
    console.log("Attempting to connect to Pipedream API...")

    // Check required environment variables
    if (!process.env.PIPEDREAM_OAUTH_CLIENT_ID || !process.env.PIPEDREAM_OAUTH_CLIENT_SECRET || !process.env.PIPEDREAM_PROJECT_ID) {
      throw new Error("Missing required Pipedream credentials")
    }

    const pd = createBackendClient({
      environment: (process.env.PIPEDREAM_ENVIRONMENT as ProjectEnvironment) || "development",
      credentials: {
        clientId: process.env.PIPEDREAM_OAUTH_CLIENT_ID,
        clientSecret: process.env.PIPEDREAM_OAUTH_CLIENT_SECRET,
      },
      projectId: process.env.PIPEDREAM_PROJECT_ID,
    })

    const options: any = {}

    if (query) {
      options.q = query
    }

    // Set a reasonable limit
    options.limit = pageSize

    const resp = await pd.getApps(options)

    console.log("Successfully fetched from Pipedream API:", resp.data?.length, "apps")

    // Filter by category if specified
    let filteredApps = resp.data || []

    if (category && filteredApps.length > 0) {
      filteredApps = filteredApps.filter(
        (app) => app.categories && app.categories.some((cat) => cat.toLowerCase() === category.toLowerCase()),
      )
    }

    // Map Pipedream API data to our app structure
    const mappedApps = filteredApps.map((app: any) => ({
      id: app.id,
      name: app.name,
      name_slug: app.name_slug,
      app_hid: app.id, // Use id as app_hid for Pipedream API
      description: app.description || "",
      categories: app.categories || [],
      // No featured_weight for Pipedream API
    }))

    // Sort the apps by name for consistency
    const sortedApps = [...mappedApps].sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      data: sortedApps,
      page_info: {
        total_count: sortedApps.length,
        current_page: 1,
        page_size: pageSize,
        has_more: false, // Simplified pagination for fallback
      },
      source: "pipedream",
    })
  } catch (error) {
    console.error("Both Supabase and Pipedream API failed:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch apps from any source",
        details: String(error),
      },
      { status: 500 },
    )
  }
}

