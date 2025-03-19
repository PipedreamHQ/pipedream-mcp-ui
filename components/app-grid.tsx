"use client"

import { useState, useEffect } from "react"
import AppCard from "./app-card"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { App } from "@/lib/supabase"

interface PageInfo {
  total_count: number
  current_page: number
  page_size: number
  has_more: boolean
}

export default function AppGrid() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [dataSource, setDataSource] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q") || ""
  const categoryFilter = searchParams.get("category") || ""
  const [currentPage, setCurrentPage] = useState(1)

  // Function to fetch apps
  const fetchApps = async (page = 1, append = false) => {
    if (page > 1) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setCurrentPage(1)
    }

    setError(null)
    setErrorDetails(null)

    try {
      // Build query params
      const queryParams = new URLSearchParams()

      if (searchQuery) {
        queryParams.set("q", searchQuery)
      }

      if (categoryFilter) {
        queryParams.set("category", categoryFilter)
      }

      queryParams.set("page", page.toString())

      if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
        console.log("Fetching MCP servers with params:", queryParams.toString())
      }

      const response = await fetch(`/api/apps?${queryParams.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
          console.error("API error response:", data)
        }
        throw new Error(data.error || `API error: ${response.status}`)
      }

      if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
        console.log("API response:", data)
      }

      // Check if data has the expected structure
      if (!data.data || !Array.isArray(data.data)) {
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
          console.error("Unexpected API response structure:", data)
        }
        throw new Error("Unexpected API response structure")
      }

      // Update apps state
      if (append) {
        setApps((prevApps) => [...prevApps, ...data.data])
      } else {
        setApps(data.data || [])
      }

      // Update page info and data source
      setPageInfo(data.page_info)
      // Only log to console if debug mode is true and using Pipedream API
      if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' && data.source === 'pipedream') {
        console.log("Using Pipedream API because the Supabase database is empty.")
      }
      setDataSource(data.source)
      setCurrentPage(page)
    } catch (error) {
      if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
        console.error("Error fetching apps:", error)
      }
      setError("Failed to load MCP servers. Please try again later.")
      setErrorDetails(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Initial load and when search or category changes
  useEffect(() => {
    fetchApps(1, false)
  }, [searchQuery, categoryFilter])

  // Load more function
  const handleLoadMore = () => {
    if (pageInfo?.has_more) {
      fetchApps(currentPage + 1, true)
    }
  }

  if (loading && !loadingMore) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            {errorDetails && (
              <div className="mt-2 p-2 bg-destructive/10 rounded text-xs font-mono overflow-auto">{errorDetails}</div>
            )}
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => fetchApps(1, false)}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">
          {categoryFilter
            ? `No MCP servers found in the "${categoryFilter}" category${searchQuery ? ` matching "${searchQuery}"` : ""}.`
            : searchQuery
              ? `No MCP servers found matching "${searchQuery}".`
              : "No MCP servers found."}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>

      {pageInfo?.has_more && (
        <div className="flex justify-center mt-8">
          <Button onClick={handleLoadMore} disabled={loadingMore} variant="outline">
            {loadingMore ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Loading...
              </>
            ) : (
              `Load More (${apps.length} of ${pageInfo.total_count})`
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

