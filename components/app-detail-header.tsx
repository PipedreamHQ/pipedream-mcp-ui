import Image from "next/image"
import type { App } from "@/lib/supabase"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AppDetailHeaderProps {
  app: App
}

export default function AppDetailHeader({ app }: AppDetailHeaderProps) {
  // Construct the correct image URL using app_hid
  const imageUrl = app.app_hid
    ? `https://pipedream.com/s.v0/${app.app_hid}/logo/orig`
    : `/placeholder.svg?height=64&width=64`

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
      <div className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-white flex items-center justify-center shadow-sm">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={`${app.name} logo`}
          width={56}
          height={56}
          className="object-contain"
        />
      </div>

      <div className="flex-grow w-full">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold">{app.name} MCP Server</h1>
            <p className="text-base md:text-lg text-muted-foreground mt-2 max-w-3xl">{app.description}</p>
          </div>
          
          {app.api_docs_url && (
            <div className="flex justify-center md:justify-start">
              <Button variant="outline" size="sm" className="flex-shrink-0" asChild>
                <a href={app.api_docs_url} target="_blank" rel="noopener noreferrer">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View {app.name} docs
                </a>
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
          {app.categories &&
            app.categories.map((category, index) => (
              <span key={`${category}-${index}`} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                {category}
              </span>
            ))}
        </div>
      </div>
    </div>
  )
}

