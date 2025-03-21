"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { ChevronDown } from "lucide-react"

export default function MCPServerCategoriesSidebar() {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get("category") || ""

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        const response = await fetch("/mcp/api/categories")
        const data = await response.json()

        if (data.categories) {
          setCategories(data.categories)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams)

    if (category) {
      params.set("category", category)
    } else {
      params.delete("category")
    }

    // Preserve search query if it exists
    const query = searchParams.get("q")
    if (query) {
      params.set("q", query)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold mb-4">MCP Server categories</h2>
        <div className="hidden md:block">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full mb-2" />
          ))}
        </div>
        <div className="md:hidden">
          <Skeleton className="h-10 w-full mb-2" />
        </div>
      </div>
    )
  }

  // Mobile dropdown view
  const mobileCategorySelector = (
    <div className="md:hidden mb-4">
      <Select value={selectedCategory || "all"} onValueChange={(value) => handleCategoryClick(value === "all" ? "" : value)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="All MCP Servers" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All MCP Servers</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )

  // Desktop sidebar view
  const desktopCategorySidebar = (
    <div className="hidden md:block">
      <h2 className="text-lg font-semibold mb-4">MCP Server categories</h2>
      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="space-y-1 pr-4">
          <Button
            variant={selectedCategory === "" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleCategoryClick("")}
          >
            All MCP Servers
          </Button>

          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <div>
      {mobileCategorySelector}
      {desktopCategorySidebar}
    </div>
  )
}

