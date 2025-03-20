"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth, useUser } from "@clerk/nextjs"
import { 
  Select, 
  SelectContent, 
  SelectItem,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"
import type { App } from "@/lib/supabase"

interface InstallationTabsProps {
  app: App
}

export default function InstallationTabs({ app }: InstallationTabsProps) {
  const [copied, setCopied] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const [externalUserId, setExternalUserId] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState("cursor")
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
          console.log("Generated client-side UUID:", fallbackId)
          
          // Store the fallback ID in Clerk metadata for persistence
          try {
            const metadataResponse = await fetch('/api/user-metadata', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                pd_external_user_id: fallbackId
              }),
            })
            
            if (metadataResponse.ok) {
              console.log("Successfully persisted client-generated UUID to Clerk metadata")
            } else {
              console.error("Failed to persist client-generated UUID to Clerk metadata:", await metadataResponse.text())
            }
          } catch (persistError) {
            console.error("Error persisting client-generated UUID to Clerk metadata:", persistError)
          }
          
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
        <div className="bg-muted rounded-md p-3 sm:p-4 mt-4 transition-all duration-200">
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
          <div className="bg-muted rounded-md p-3 sm:p-4 mt-4 transition-all duration-200">
            <div className="flex flex-col items-center text-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs sm:text-sm mb-2">Sign in to generate and copy your unique MCP Server URL</p>
                <Button size="sm" asChild className="transition-all duration-200">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div className="bg-muted rounded-md p-3 sm:p-4 mt-4 transition-all duration-200">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="ml-2 text-xs sm:text-sm">Generating secure ID...</span>
            </div>
          </div>
        )
      }
    }

    return (
      <div className="bg-muted rounded-md p-3 mt-4 transition-all duration-200">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">MCP server URL</p>
        <div className="relative">
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 z-10">
            <button 
              className="text-muted-foreground hover:text-foreground focus:outline-none transition-colors duration-200" 
              onClick={() => setShowUrl(!showUrl)}
            >
              {showUrl ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button 
              className="text-muted-foreground hover:text-foreground focus:outline-none ml-2 transition-colors duration-200" 
              onClick={copyToClipboard}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <code className="text-xs font-mono bg-background p-1.5 pl-14 rounded border block w-full overflow-x-auto transition-all duration-200">
            {displayUrl}
          </code>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
          Do not share this URL with anyone. You should treat it like a sensitive token.
        </p>
      </div>
    )
  }

  // Rest of the component remains the same...
  return (
    <Card className="transition-all duration-300">
      <CardHeader className="sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">Getting started</CardTitle>
        <CardDescription className="text-sm sm:text-base">Select your preferred client to install the MCP server</CardDescription>
      </CardHeader>
      <CardContent className="sm:px-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="transition-all duration-300">
          {/* Mobile Select Dropdown - only visible on small screens */}
          <div className="md:hidden mb-6">
            <Select value={currentTab} onValueChange={setCurrentTab}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cursor">Cursor</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="windsurf" disabled>Windsurf (Coming soon)</SelectItem>
                <SelectItem value="typescript" disabled>TypeScript (Coming soon)</SelectItem>
                <SelectItem value="python" disabled>Python (Coming soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Desktop Tabs - hidden on mobile, styled like main-nav */}
          <div className="hidden md:block mb-6">
            <TooltipProvider>
              <div className="flex justify-start rounded-lg p-1 bg-muted/30 w-fit overflow-hidden transition-all duration-300">
                <TabsList className="bg-transparent flex items-center gap-2 p-0 h-auto">
                  <TabsTrigger 
                    value="cursor" 
                    className={cn(
                      "px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm min-w-[80px] text-center data-[state=active]:shadow-sm",
                      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                      "data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-muted/80"
                    )}
                  >
                    Cursor
                  </TabsTrigger>
                  <TabsTrigger 
                    value="claude" 
                    className={cn(
                      "px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm min-w-[80px] text-center data-[state=active]:shadow-sm",
                      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                      "data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-muted/80"
                    )}
                  >
                    Claude
                  </TabsTrigger>
                  <div className="relative">
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <TabsTrigger 
                          value="windsurf" 
                          disabled 
                          className="px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm min-w-[80px] text-center opacity-60 cursor-help"
                        >
                          Windsurf
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={5}>
                        Coming soon
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <TabsTrigger 
                          value="typescript" 
                          disabled 
                          className="px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm min-w-[80px] text-center opacity-60 cursor-help"
                        >
                          TypeScript
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={5}>
                        Coming soon
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <TabsTrigger 
                          value="python" 
                          disabled 
                          className="px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm min-w-[80px] text-center opacity-60 cursor-help"
                        >
                          Python
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={5}>
                        Coming soon
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TabsList>
              </div>
            </TooltipProvider>
          </div>

          <TabsContent value="cursor" className="space-y-4 animate-in fade-in-50 transition-all duration-300">
            <ol className="space-y-2 list-decimal list-inside text-sm sm:text-base">
              <li>Navigate to <strong>Settings</strong>, then <strong>Cursor Settings</strong></li>
              <li>Select <strong>MCP</strong> on the left</li>
              <li>Add a new MCP server by pasting the URL below:</li>
            </ol>

            {renderUrlSection()}
          </TabsContent>

          <TabsContent value="claude" className="space-y-4 animate-in fade-in-50 transition-all duration-300">
            <ol className="space-y-2 list-decimal list-inside text-sm sm:text-base">
              <li>Open the <strong>Claude Desktop</strong> app</li>
              <li>Go to <strong>Settings</strong>, then <strong>Developer</strong></li>
              <li>Click <strong>Edit Config</strong></li>
              <li>Open the <span className="font-semibold">claude_desktop_config.json</span> file</li>
              <li>Add the below MCP server configuration to your existing file</li>
              <li>Make sure to restart Claude when that's done</li>
            </ol>

            <div className="bg-muted p-2 sm:p-3 rounded-md mt-4 transition-all duration-200">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Default configuration</p>
              <div className="bg-background p-2 rounded border block w-full overflow-x-auto transition-all duration-200">
                <pre className="text-xs font-mono">
                  <code>{`{
  "mcpServers": {}
}`}</code>
                </pre>
              </div>
            </div>

            <div className="bg-muted p-2 sm:p-3 rounded-md mt-4 transition-all duration-200">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                Add this inside the <strong>mcpServers</strong> object in your configuration file
              </p>
              <div className="relative">
                <button 
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors duration-200" 
                  onClick={(event) => {
                    // Use actual URL for clipboard but obfuscate in display
                    const config = `"${app.name_slug}": {
  "command": "npx",
  "args": [
    "-y",
    "supergateway",
    "--sse",
    "${mcpServerUrl || '{mcp_server_url}'}"
  ]
}`;
                    navigator.clipboard.writeText(config);
                    
                    // Show the checkmark temporarily
                    const button = event.currentTarget;
                    const originalContent = button.innerHTML;
                    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                    setTimeout(() => {
                      button.innerHTML = originalContent;
                    }, 2000);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <div className="bg-background p-2 rounded border block w-full overflow-x-auto transition-all duration-200">
                  <pre className="text-xs font-mono">
                    <code>{`"pipedream-${app.name_slug}": {
  "command": "npx",
  "args": [
    "-y",
    "supergateway",
    "--sse",
    "${mcpServerUrl ? "https://mcp.pipedream.com/**********/" + app.name_slug : '{mcp_server_url}'}"
  ]
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="windsurf" className="space-y-4 animate-in fade-in-50 transition-all duration-300">
            <ol className="space-y-3 list-decimal list-inside text-sm sm:text-base">
              <li>Open <strong>Windsurf Browser</strong></li>
              <li>Navigate to <strong>Extensions</strong></li>
              <li>Enable <strong>AI Tools</strong></li>
              <li>Add new MCP server with this URL:</li>
            </ol>

            {renderUrlSection()}
          </TabsContent>

          <TabsContent value="typescript" className="space-y-4 animate-in fade-in-50 transition-all duration-300">
            <p className="text-sm sm:text-base mb-4">Install the MCP client library:</p>
            <pre className="bg-muted p-2 sm:p-3 rounded-md overflow-x-auto transition-all duration-200">
              <code className="text-xs sm:text-sm font-mono">npm install @pipedream/mcp-client</code>
            </pre>

            <p className="text-sm sm:text-base mt-4 mb-2">Example usage:</p>
            <div className="relative">
              <button 
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors duration-200" 
                onClick={(event) => {
                  const code = `import { MCPClient } from '@pipedream/mcp-client';

const client = new MCPClient({
  serverUrl: '${externalUserId ? mcpServerUrl : "YOUR_MCP_SERVER_URL"}'
});

// Example: Send a message to a Slack channel
async function sendMessage() {
  const response = await client.invoke('sendMessage', {
    channel: '#general',
    text: 'Hello from MCP!'
  });
  
  console.log(response);
}`;
                  navigator.clipboard.writeText(code);
                  
                  // Show the checkmark temporarily
                  const button = event.currentTarget;
                  const originalContent = button.innerHTML;
                  button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                  setTimeout(() => {
                    button.innerHTML = originalContent;
                  }, 2000);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <pre className="bg-muted p-2 sm:p-3 rounded-md overflow-x-auto transition-all duration-200">
                <code className="text-xs font-mono">{`import { MCPClient } from '@pipedream/mcp-client';

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
            </div>

            {!externalUserId && <div className="mt-4">{renderUrlSection()}</div>}
          </TabsContent>

          <TabsContent value="python" className="space-y-4 animate-in fade-in-50 transition-all duration-300">
            <p className="text-sm sm:text-base mb-4">Install the MCP client library:</p>
            <pre className="bg-muted p-2 sm:p-3 rounded-md overflow-x-auto transition-all duration-200">
              <code className="text-xs sm:text-sm font-mono">pip install pipedream-mcp-client</code>
            </pre>

            <p className="text-sm sm:text-base mt-4 mb-2">Example usage:</p>
            <div className="relative">
              <button 
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors duration-200" 
                onClick={(event) => {
                  const code = `from pipedream_mcp_client import MCPClient

client = MCPClient(
    server_url='${externalUserId ? mcpServerUrl : "YOUR_MCP_SERVER_URL"}'
)

# Example: Send a message to a Slack channel
def send_message():
    response = client.invoke('sendMessage', {
        'channel': '#general',
        'text': 'Hello from MCP!'
    })
    
    print(response)`;
                  navigator.clipboard.writeText(code);
                  
                  // Show the checkmark temporarily
                  const button = event.currentTarget;
                  const originalContent = button.innerHTML;
                  button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                  setTimeout(() => {
                    button.innerHTML = originalContent;
                  }, 2000);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <pre className="bg-muted p-2 sm:p-3 rounded-md overflow-x-auto transition-all duration-200">
                <code className="text-xs font-mono">{`from pipedream_mcp_client import MCPClient

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
            </div>

            {!externalUserId && <div className="mt-4">{renderUrlSection()}</div>}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

