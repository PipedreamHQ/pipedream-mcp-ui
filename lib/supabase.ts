import { createClient } from "@supabase/supabase-js"

// Log the environment variables (without exposing secrets)
console.log("Supabase URL available:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log("Supabase Anon Key available:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Create a single supabase client for the entire app
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: {
      persistSession: false,
    },
  },
)

// Let's add a simple test function to check connectivity
export async function testSupabaseConnection() {
  try {
    const { data: appsData, error: appsError } = await supabase.from("apps").select("count")

    if (appsError) {
      console.error("Error connecting to apps table:", appsError)
      return {
        success: false,
        error: appsError,
        message: "Failed to connect to apps table",
      }
    }

    // Get the count of records
    const { count, error: countError } = await supabase.from("apps").select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error getting count from apps:", countError)
      return {
        success: true,
        data: appsData,
        count: "Error getting count",
        countError,
      }
    }

    // Get a sample record to check the structure
    const { data: sampleData, error: sampleError } = await supabase.from("apps").select("*").limit(1)

    if (sampleData && sampleData.length > 0) {
      console.log("Sample app record structure:", Object.keys(sampleData[0]))
      console.log("Sample app PD_BUILDER_ONLY value:", sampleData[0].PD_BUILDER_ONLY)
    }

    return {
      success: true,
      data: appsData,
      count,
      sample: sampleData && sampleData.length > 0 ? sampleData[0] : null,
      message: `Successfully connected to apps table. Found ${count} records.`,
    }
  } catch (error) {
    console.error("Supabase connection test failed:", error)
    return { success: false, error }
  }
}

// Our normalized App type
export type App = {
  id: string
  name: string
  name_slug: string
  app_hid: string
  description: string
  img_src?: string
  categories: string[]
  featured_weight?: number
  api_docs_url?: string
  status?: number
}

// Raw Supabase app schema
export type SupabaseApp = {
  APP_ID: number
  APP_HID: string
  APP_NAME_SLUG: string
  APP_NAME: string
  APP_IMG_SRC: string
  APP_DESCRIPTION: string
  APP_FEATURED_WEIGHT: number
  APP_LOGO_DATA: any
  APP_STATUS: number
  APP_API_DOCS_URL: string
  APP_OPEN_API_SPEC: string
  APP_CATEGORY_ID: number
  CATEGORY_NAME: string
  PD_BUILDER_ONLY: boolean
}

