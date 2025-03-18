import AppGrid from "@/components/app-grid"
import SearchInput from "@/components/search-input"
import CategoriesSidebar from "@/components/categories-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserButton } from "@/components/user-button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">AI Developer Toolkit by Pipedream</h1>
            <p className="text-muted-foreground">
              Easily add more than 2,500 APIs and 8k prebuilt tools to Claude, Cursor, or any other MCP client
            </p>
          </div>
          <div className="flex items-center gap-4">
            <UserButton />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 flex-shrink-0">
            <CategoriesSidebar />
          </div>

          <div className="flex-grow">
            <SearchInput />
            <AppGrid />
          </div>
        </div>
      </main>
    </div>
  )
}

