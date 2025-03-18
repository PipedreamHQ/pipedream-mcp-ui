"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SearchInput() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("q") || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearchParams(search)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const clearSearch = () => {
    setSearch("")
    updateSearchParams("")
  }

  const updateSearchParams = (value: string) => {
    const params = new URLSearchParams(searchParams)

    if (value) {
      params.set("q", value)
    } else {
      params.delete("q")
    }

    // Preserve category if it exists
    const category = searchParams.get("category")
    if (category) {
      params.set("category", category)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative mb-6">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="search"
        placeholder="Search apps..."
        value={search}
        onChange={handleChange}
        className="pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden [&::-ms-clear]:hidden"
      />
      {search && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
          onClick={clearSearch}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </form>
  )
}

