"use client"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import type { App } from "@/lib/supabase"

interface AppCardProps {
  app: App
  disabled?: boolean
}

export default function AppCard({ app, disabled = false }: AppCardProps) {
  const router = useRouter()

  // Construct the correct image URL using app_hid
  const imageUrl = app.app_hid
    ? `https://pipedream.com/s.v0/${app.app_hid}/logo/orig`
    : `/placeholder.svg?height=48&width=48`

  const handleClick = () => {
    if (!disabled) {
      router.push(`/app/${app.name_slug}`)
    }
  }

  return (
    <Card
      className={`overflow-hidden transition-all duration-200 h-full border-border/60 
        ${disabled 
          ? 'opacity-70 cursor-not-allowed' 
          : 'hover:shadow-md cursor-pointer hover:scale-[1.01]'}`}
      onClick={handleClick}
    >
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          {/* Add white background to the icon container */}
          <div className="relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-white flex items-center justify-center shadow-sm">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={`${app.name || "App"} logo`}
              width={40}
              height={40}
              style={{ width: 'auto', height: 'auto', maxWidth: '40px', maxHeight: '40px' }}
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{app.name || "Unknown app"}</h2>
              {disabled && (
                <Badge variant="outline" className="ml-1">Coming soon</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {app.categories &&
                app.categories.slice(0, 2).map((category, index) => (
                  <span
                    key={`${category}-${index}`}
                    className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full"
                  >
                    {category}
                  </span>
                ))}
              {app.categories && app.categories.length > 2 && (
                <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                  +{app.categories.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
          {app.description || "No description available"}
        </p>
      </CardContent>
    </Card>
  )
}