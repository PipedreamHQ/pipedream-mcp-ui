import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import AppDetailHeader from "@/components/app-detail-header"
import InstallationTabs from "@/components/installation-tabs"
import AvailableActions from "@/components/available-actions"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { UserButton } from "@/components/user-button"
import { ThemeToggle } from "@/components/theme-toggle"

async function getAppBySlug(slug: string) {
  try {
    const { data, error } = await supabase.from("apps").select("*").eq("APP_NAME_SLUG", slug).single()

    if (error || !data) {
      console.error("Error fetching app:", error)
      return null
    }

    return {
      id: data.APP_ID.toString(),
      name: data.APP_NAME,
      name_slug: data.APP_NAME_SLUG,
      app_hid: data.APP_HID,
      description: data.APP_DESCRIPTION,
      categories: data.CATEGORY_NAME ? [data.CATEGORY_NAME] : [],
      featured_weight: data.APP_FEATURED_WEIGHT,
      api_docs_url: data.APP_API_DOCS_URL,
      status: data.APP_STATUS,
    }
  } catch (error) {
    console.error("Error fetching app:", error)
    return null
  }
}

async function getAppActions(slug: string) {
  try {
    if (process.env.ENVIRONMENT === "development") {
      console.log(`Fetching actions for app with slug: ${slug}`)
    }

    // First, get the app ID from the slug
    const { data: appData, error: appError } = await supabase
      .from("apps")
      .select("APP_ID")
      .eq("APP_NAME_SLUG", slug)
      .single()

    if (appError || !appData) {
      console.error("Error fetching app ID:", appError)
      return []
    }

    const appId = appData.APP_ID
    if (process.env.ENVIRONMENT === "development") {
      console.log(`Found app ID: ${appId} for slug: ${slug}`)
    }

    // Now fetch components using the app_id
    // Try with APP_ID (uppercase, matching the apps table convention)
    let { data: actions, error } = await supabase.from("published_components").select("*").eq("APP_ID", appId)

    if (error) {
      console.error("Error with APP_ID, trying lowercase app_id:", error)

      // If that fails, try with app_id (lowercase)
      const { data: actionsLowercase, error: errorLowercase } = await supabase
        .from("published_components")
        .select("*")
        .eq("app_id", appId)

      if (errorLowercase) {
        console.error("Error with both APP_ID and app_id:", errorLowercase)

        // As a last resort, let's try to get a sample row to see the structure
        const { data: sampleData, error: sampleError } = await supabase
          .from("published_components")
          .select("*")
          .limit(1)

        if (!sampleError && sampleData && sampleData.length > 0) {
          console.log("Sample published_components columns:", Object.keys(sampleData[0]))
          console.log("Sample published_components data:", JSON.stringify(sampleData[0]))
        } else {
          console.error("Could not fetch sample data:", sampleError)
        }

        return []
      }

      actions = actionsLowercase
    }

    if (process.env.ENVIRONMENT === "development") {
      console.log(`Found ${actions?.length || 0} actions for app ID ${appId}`)
    }

    // Log the first action to see its structure (only in development)
    if (process.env.ENVIRONMENT === "development" && actions && actions.length > 0) {
      console.log("First action structure:", Object.keys(actions[0]))
      // Use JSON.stringify to safely log the object
      console.log("First action data:", JSON.stringify(actions[0]))
    }

    // Ensure we're returning a valid array
    return Array.isArray(actions) ? actions : []
  } catch (error) {
    console.error("Error fetching actions:", error instanceof Error ? error.message : String(error))
    return []
  }
}

export default async function AppDetailPage({ params }: { params: { slug: string } }) {
  const app = await getAppBySlug(params.slug)

  if (!app) {
    notFound()
  }

  // Wrap in try/catch to prevent rendering errors
  let actions = []
  try {
    actions = await getAppActions(params.slug)
  } catch (error) {
    console.error("Error in getAppActions:", error instanceof Error ? error.message : String(error))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to MCP servers
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <UserButton />
            <ThemeToggle />
          </div>
        </div>

        <div className="mb-8">
          <AppDetailHeader app={app} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <InstallationTabs app={app} />
          </div>

          <div>
            <AvailableActions actions={actions} />
          </div>
        </div>
      </main>
    </div>
  )
}

