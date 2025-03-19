import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from 'geist/font/sans'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ClerkProvider, ClerkLoaded } from "@clerk/nextjs"
import RedirectHandler from "@/components/redirect-handler"
import UserMetadataInitializer from "@/components/user-metadata-initializer"

// Use GeistSans as our primary font

export const metadata: Metadata = {
  title: "MCP Servers from Pipedream",
  description: "Browse thousands of MCP servers from Pipedream",
  generator: 'v0.dev',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pipedream.com/mcp/',
    siteName: 'Pipedream MCP Servers',
    title: 'Pipedream MCP Servers',
    description: 'Browse thousands of MCP servers from Pipedream',
    images: [
      {
        url: 'https://res.cloudinary.com/pipedreamin/image/upload/v1688088928/mcp-servers-og.png',
        width: 1200,
        height: 630,
        alt: 'Pipedream MCP Servers Library',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pipedream MCP Servers Library',
    description: 'Search and copy MCP server URLs for Pipedream integrations',
    creator: '@pipedream',
    images: ['https://res.cloudinary.com/pipedreamin/image/upload/v1688088928/mcp-servers-og.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined, // Let the app control the theme
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary/90",
          card: "shadow-lg",
        },
      }}
    >
      <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
        <body className="font-sans">
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <ClerkLoaded>
              <UserMetadataInitializer />
            </ClerkLoaded>
            <RedirectHandler />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}