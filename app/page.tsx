import AppGrid from "@/components/app-grid"
import SearchInput from "@/components/search-input"
import CategoriesSidebar from "@/components/categories-sidebar"
import { MainNav } from "@/components/main-nav"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 pt-8 pb-12">
        <MainNav />

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

