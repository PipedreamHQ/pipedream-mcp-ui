import Image from "next/image"
import type { App } from "@/lib/supabase"

interface AppDetailHeaderProps {
  app: App
}

export default function AppDetailHeader({ app }: AppDetailHeaderProps) {
  // Construct the correct image URL using app_hid
  const imageUrl = app.app_hid
    ? `https://pipedream.com/s.v0/${app.app_hid}/logo/orig`
    : `/placeholder.svg?height=64&width=64`

  return (
    <div className="flex items-start gap-6">
      <div className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-white flex items-center justify-center shadow-sm">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={`${app.name} logo`}
          width={56}
          height={56}
          className="object-contain"
        />
      </div>

      <div>
        <h1 className="text-3xl font-bold">{app.name}</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-3xl">{app.description}</p>

        <div className="flex flex-wrap gap-2 mt-4">
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

