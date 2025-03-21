import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AppNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">App Not Found</h1>
        <p className="text-muted-foreground mb-8">The app you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Button asChild>
          <Link href="/">Return to App Directory</Link>
        </Button>
      </div>
    </div>
  )
}

