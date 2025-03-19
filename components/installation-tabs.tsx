"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, ExternalLink, Lock } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import type { App } from "@/lib/supabase"

interface InstallationTabsProps {
  app: App
}

export default function InstallationTabs({ app }: InstallationTabsProps) {
  const [copied, setCopied] = useState(false)
  const { isLoaded, userId } = useAuth()

  // Generate a unique MCP server URL for the signed-in user
  const mcpServerUrl = userId ? `https://mcp.pipedream.com/${userId}/${app.name_slug}` : null
  
  // Create an obfuscated version of the URL for display
  const displayUrl = mcpServerUrl ? 
    `https://mcp.pipedream.com/****/${app.name_slug}` : 
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
    }

    return (
      <div className="bg-muted rounded-md p-3 mt-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">MCP server URL</p>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyToClipboard}>
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        <code className="text-xs font-mono bg-background p-1.5 rounded border block w-full overflow-x-auto">
          {displayUrl}
        </code>
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
  serverUrl: '${userId ? mcpServerUrl : "YOUR_MCP_SERVER_URL"}'
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

            {!userId && <div className="mt-4">{renderUrlSection()}</div>}
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
    server_url='${userId ? mcpServerUrl : "YOUR_MCP_SERVER_URL"}'
)

# Example: Send a message to a Slack channel
def send_message():
    response = client.invoke('sendMessage', {
        'channel': '#general',
        'text': 'Hello from MCP!'
    })
    
    print(response)`}</code>
            </pre>

            {!userId && <div className="mt-4">{renderUrlSection()}</div>}
          </TabsContent>
        </Tabs>

        {app.api_docs_url && (
          <div className="mt-6">
            <Button variant="outline" className="w-full" asChild>
              <a href={app.api_docs_url} target="_blank" rel="noopener noreferrer">
                View Documentation
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

