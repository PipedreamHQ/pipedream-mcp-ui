"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth, useUser } from "@clerk/nextjs"
import Link from "next/link"
import type { App } from "@/lib/supabase"

interface InstallationTabsProps {
  app: App
}

export default function InstallationTabs({ app }: InstallationTabsProps) {
  const [copied, setCopied] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const [externalUserId, setExternalUserId] = useState<string | null>(null)
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()

  // Get or generate a client-side UUID for this session
  useEffect(() => {
    function generateClientUUID() {
      // Simple UUID generation for client-side
      // This isn't cryptographically secure, but is a reasonable temporary fallback
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, 
              v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    async function getExternalUserId() {
      if (user) {
        try {
          // First check if we already have a UUID in sessionStorage for this page session
          // This ensures we use the same ID across the whole browsing session
          const storedId = sessionStorage.getItem('pdExternalUserId')
          
          if (storedId) {
            console.log("Using stored UUID from session:", storedId)
            
            // Set up a listener to add the session ID to API calls for consistency
            if (typeof window !== 'undefined') {
              const originalFetch = window.fetch;
              window.fetch = function(input, init = {}) {
                // Only add the header for our API calls
                if (typeof input === 'string' && input.startsWith('/api/')) {
                  init.headers = init.headers || {};
                  init.headers = {
                    ...init.headers,
                    'x-session-id': storedId
                  };
                }
                return originalFetch(input, init);
              };
            }
            
            setExternalUserId(storedId)
            return
          }
          
          // If no stored session ID, try to get the UUID from Clerk metadata
          // This is the persistent UUID across sessions
          try {
            const response = await fetch('/api/user-metadata')
            
            if (response.ok) {
              const data = await response.json()
              if (data.pd_external_user_id) {
                console.log("Retrieved external user ID from Clerk metadata:", data.pd_external_user_id)
                const clerkUuid = data.pd_external_user_id
                
                // Set up fetch API interception to add the header consistently
                if (typeof window !== 'undefined') {
                  const originalFetch = window.fetch;
                  window.fetch = function(input, init = {}) {
                    // Only add the header for our API calls
                    if (typeof input === 'string' && input.startsWith('/api/')) {
                      init.headers = init.headers || {};
                      init.headers = {
                        ...init.headers,
                        'x-session-id': clerkUuid
                      };
                    }
                    return originalFetch(input, init);
                  };
                }
                
                setExternalUserId(clerkUuid)
                // Store in session storage so it persists during navigation
                sessionStorage.setItem('pdExternalUserId', clerkUuid)
                return
              }
            }
          } catch (clerkError) {
            console.error("Error retrieving user metadata from Clerk:", clerkError)
            // Continue to fallback mechanisms
          }
          
          // If Clerk metadata retrieval fails, fall back to the external-user-id endpoint
          try {
            const response = await fetch('/api/external-user-id')
            
            if (response.ok) {
              const data = await response.json()
              if (data.externalUserId) {
                console.log("Using server-generated UUID:", data.externalUserId)
                const newUuid = data.externalUserId
                
                // Set up a listener to add the session ID to other API calls
                if (typeof window !== 'undefined') {
                  const originalFetch = window.fetch;
                  window.fetch = function(input, init = {}) {
                    // Only add the header for our API calls
                    if (typeof input === 'string' && input.startsWith('/api/')) {
                      init.headers = init.headers || {};
                      init.headers = {
                        ...init.headers,
                        'x-session-id': newUuid
                      };
                    }
                    return originalFetch(input, init);
                  };
                }
                
                setExternalUserId(newUuid)
                // Store in session storage so it persists during navigation
                sessionStorage.setItem('pdExternalUserId', newUuid)
                return
              }
            }
          } catch (serverError) {
            console.error("Error getting external user ID from server:", serverError)
            // Continue to client-side fallback
          }
          
          // As a last resort, generate a client-side UUID
          const fallbackId = generateClientUUID()
          setExternalUserId(fallbackId)
          // Store it in session storage for consistency
          sessionStorage.setItem('pdExternalUserId', fallbackId)
          console.log("Using client-generated UUID:", fallbackId)
        } catch (error) {
          console.error("Error getting external user ID:", error)
          // Absolute fallback to using the Clerk userId
          setExternalUserId(userId)
        }
      }
    }
    
    if (user) {
      getExternalUserId()
    }
  }, [user, userId])
  
  // Generate a unique MCP server URL using the external user ID
  const mcpServerUrl = externalUserId ? 
    `https://mcp.pipedream.com/${externalUserId}/${app.name_slug}` : 
    null
  
  // Create an obfuscated version of the URL for display
  const displayUrl = mcpServerUrl ? 
    (showUrl ? mcpServerUrl : "••••••••••••••••••••••••••••••••••••") : 
    null

  const copyToClipboard = () => {
    if (!mcpServerUrl) return

    navigator.clipboard.writeText(mcpServerUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Render the URL section based on authentication state
  const renderUrlSection = () => {
    if (!isLoaded) {
      return (
        <div className="bg-muted rounded-md p-4 mt-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm">Loading...</span>
          </div>
        </div>
      )
    }

    if (!externalUserId) {
      if (!userId) {
        return (
          <div className="bg-muted rounded-md p-4 mt-4">
            <div className="flex flex-col items-center text-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm mb-2">Sign in to generate and copy your unique MCP Server URL</p>
                <Button size="sm" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div className="bg-muted rounded-md p-4 mt-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm">Generating secure ID...</span>
            </div>
          </div>
        )
      }
    }

    return (
      <div className="bg-muted rounded-md p-3 mt-4">
        <p className="text-sm text-muted-foreground mb-1">MCP server URL</p>
        <div className="relative">
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 z-10">
            <button 
              className="text-muted-foreground hover:text-foreground focus:outline-none" 
              onClick={() => setShowUrl(!showUrl)}
            >
              {showUrl ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button 
              className="text-muted-foreground hover:text-foreground focus:outline-none ml-2" 
              onClick={copyToClipboard}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <code className="text-xs font-mono bg-background p-1.5 pl-14 rounded border block w-full overflow-x-auto">
            {displayUrl}
          </code>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          <span className="text-amber-500">•</span> Do not share this URL with anyone. You should treat it like a sensitive token.
        </p>
      </div>
    )
  }

  // Rest of the component remains the same...
  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting started</CardTitle>
        <CardDescription>Select your preferred client to install the MCP server</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cursor">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="cursor">Cursor</TabsTrigger>
            <TabsTrigger value="claude" disabled className="opacity-60 cursor-not-allowed">Claude (Coming soon)</TabsTrigger>
            <TabsTrigger value="windsurf" disabled className="opacity-60 cursor-not-allowed">Windsurf (Coming soon)</TabsTrigger>
            <TabsTrigger value="typescript" disabled className="opacity-60 cursor-not-allowed">TypeScript (Coming soon)</TabsTrigger>
            <TabsTrigger value="python" disabled className="opacity-60 cursor-not-allowed">Python (Coming soon)</TabsTrigger>
          </TabsList>

          <TabsContent value="cursor" className="space-y-4">
            <ol className="space-y-4 list-decimal list-inside">
              <li>Navigate to "Settings", then "Cursor Settings"</li>
              <li>Select "MCP" on the left</li>
              <li>Add a new MCP server by pasting the URL below:</li>
            </ol>

            {renderUrlSection()}
          </TabsContent>

          <TabsContent value="claude" className="space-y-4">
            <ol className="space-y-4 list-decimal list-inside">
              <li>Open Claude AI</li>
              <li>Go to Settings → Advanced</li>
              <li>Enable "External Tools"</li>
              <li>Add new MCP server with this URL:</li>
            </ol>

            {renderUrlSection()}
          </TabsContent>

          <TabsContent value="windsurf" className="space-y-4">
            <ol className="space-y-4 list-decimal list-inside">
              <li>Open Windsurf Browser</li>
              <li>Navigate to Extensions</li>
              <li>Enable "AI Tools"</li>
              <li>Add new MCP server with this URL:</li>
            </ol>

            {renderUrlSection()}
          </TabsContent>

          <TabsContent value="typescript" className="space-y-4">
            <p className="mb-4">Install the MCP client library:</p>
            <pre className="bg-muted p-3 rounded-md overflow-x-auto">
              <code>npm install @pipedream/mcp-client</code>
            </pre>

            <p className="mt-4 mb-2">Example usage:</p>
            <pre className="bg-muted p-3 rounded-md overflow-x-auto">
              <code>{`import { MCPClient } from '@pipedream/mcp-client';

const client = new MCPClient({
  serverUrl: '${externalUserId ? (showUrl ? mcpServerUrl : "YOUR_MCP_SERVER_URL") : "YOUR_MCP_SERVER_URL"}'
});

// Example: Send a message to a Slack channel
async function sendMessage() {
  const response = await client.invoke('sendMessage', {
    channel: '#general',
    text: 'Hello from MCP!'
  });
  
  console.log(response);
}`}</code>
            </pre>

            {!externalUserId && <div className="mt-4">{renderUrlSection()}</div>}
          </TabsContent>

          <TabsContent value="python" className="space-y-4">
            <p className="mb-4">Install the MCP client library:</p>
            <pre className="bg-muted p-3 rounded-md overflow-x-auto">
              <code>pip install pipedream-mcp-client</code>
            </pre>

            <p className="mt-4 mb-2">Example usage:</p>
            <pre className="bg-muted p-3 rounded-md overflow-x-auto">
              <code>{`from pipedream_mcp_client import MCPClient

client = MCPClient(
    server_url='${externalUserId ? (showUrl ? mcpServerUrl : "YOUR_MCP_SERVER_URL") : "YOUR_MCP_SERVER_URL"}'
)

# Example: Send a message to a Slack channel
def send_message():
    response = client.invoke('sendMessage', {
        'channel': '#general',
        'text': 'Hello from MCP!'
    })
    
    print(response)`}</code>
            </pre>

            {!externalUserId && <div className="mt-4">{renderUrlSection()}</div>}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

