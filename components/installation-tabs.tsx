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
import { usePathname } from "next/navigation"
import { useSessionId } from "@/lib/fetch-with-csrf"
import type { App } from "@/lib/supabase"

interface InstallationTabsProps {
  app: App
}

export default function InstallationTabs({ app }: InstallationTabsProps) {
  const [copied, setCopied] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const pathname = usePathname()
  const externalUserId = useSessionId()
  const [currentTab, setCurrentTab] = useState("cursor")
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  
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

    // If not signed in, show sign-in message regardless of externalUserId state
    if (!userId) {
      return (
        <div className="bg-muted rounded-md p-3 sm:p-4 mt-4 transition-all duration-200">
          <div className="flex flex-col items-center text-center gap-3">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs sm:text-sm mb-2">Sign in to generate and copy your unique MCP Server URL</p>
              <Button size="sm" asChild className="transition-all duration-200">
                <Link href={`/sign-in?redirect_url=${encodeURIComponent('/mcp' + pathname)}`}>Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      )
    }
    
    // User is authenticated but no externalUserId yet
    if (!externalUserId) {
      return (
        <div className="bg-muted rounded-md p-3 sm:p-4 mt-4 transition-all duration-200">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="ml-2 text-xs sm:text-sm">Generating secure ID...</span>
          </div>
        </div>
      )
    }

    // User is authenticated and has an externalUserId
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
                  {/* Using button elements with title attributes for native tooltips */}
                  <button 
                    className="px-4 py-2 rounded-md font-medium text-sm min-w-[80px] text-center opacity-60 bg-transparent" 
                    disabled 
                    title="Coming soon"
                  >
                    Windsurf
                  </button>
                  
                  <button 
                    className="px-4 py-2 rounded-md font-medium text-sm min-w-[80px] text-center opacity-60 bg-transparent" 
                    disabled 
                    title="Coming soon"
                  >
                    TypeScript
                  </button>
                  
                  <button 
                    className="px-4 py-2 rounded-md font-medium text-sm min-w-[80px] text-center opacity-60 bg-transparent" 
                    disabled 
                    title="Coming soon"
                  >
                    Python
                  </button>
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
              <li>Make sure to restart Claude when that&apos;s done</li>
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

