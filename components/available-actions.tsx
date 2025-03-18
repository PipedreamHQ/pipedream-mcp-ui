import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

interface Action {
  id?: number
  name?: string
  description?: string
  component_id?: string
  component_key?: string
  component_name?: string
  component_description?: string
  app_id?: number
  APP_ID?: number
  SC_NAME?: string
  SC_DESCRIPTION?: string
  SC_GIT_PATH?: string
  [key: string]: any // For any other fields that might be in the data
}

interface AvailableActionsProps {
  actions: Action[]
}

export default function AvailableActions({ actions }: AvailableActionsProps) {
  // Ensure actions is an array to prevent rendering issues
  const safeActions = Array.isArray(actions) ? actions : []

  if (!safeActions || safeActions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available tools</CardTitle>
          <CardDescription>No tools available for this app yet.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available tools</CardTitle>
        <CardDescription>
          Get all {safeActions.length} actions for this app by following the instruction guide.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {safeActions.map((action, index) => {
          // Ensure we have a valid action object
          if (!action || typeof action !== "object") {
            console.error("Invalid action at index", index, action)
            return null
          }

          // Try to find the name and description using various possible field names
          // Convert to string to ensure we don't render objects
          const name = String(
            action.SC_NAME || action.name || action.component_name || action.COMPONENT_NAME || "Unnamed Action",
          )

          const description = String(
            action.SC_DESCRIPTION ||
              action.description ||
              action.component_description ||
              action.COMPONENT_DESCRIPTION ||
              "No description available",
          )

          // Ensure we have a valid ID for the key
          const id = String(action.id || action.component_id || action.COMPONENT_ID || `action-${index}`)

          // GitHub link - ensure it's a string
          const gitPath = action.SC_GIT_PATH ? String(action.SC_GIT_PATH) : ""
          const githubUrl = gitPath ? `https://github.com/PipedreamHQ/pipedream/blob/master/${gitPath}` : null

          return (
            <div key={id} className="border rounded-lg overflow-hidden">
              <div className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{name}</h3>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2 prose prose-sm dark:prose-invert">
                      <ReactMarkdown>{description}</ReactMarkdown>
                    </div>
                  </div>
                  {githubUrl && (
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <Link
                        href={githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground/80"
                      >
                        <Github className="h-5 w-5 text-muted-foreground" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

