import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from 'geist/font/sans'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
// Use ClerkProvider directly as shown in the official example
import { ClerkProvider, ClerkLoaded } from "@clerk/nextjs"
import UserMetadataInitializer from "@/components/user-metadata-initializer"
import RedirectHandler from "@/components/redirect-handler"
import CSRFProvider from "@/components/csrf-provider"
import SessionProvider from "@/components/session-provider"
import { csrfToken } from "@/lib/csrf"

// Use GeistSans as our primary font

export const metadata: Metadata = {
  title: "Pipedream MCP",
  description: "Access MCP servers for more than 2,500 APIs with 8,000 prebuilt tools",
  generator: 'v0.dev',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pipedream.com/mcp/',
    siteName: 'Pipedream MCP',
    title: 'Pipedream MCP',
    description: 'Access MCP servers for more than 2,500 APIs with 8,000 prebuilt tools',
    images: [
      {
        url: 'https://res.cloudinary.com/pipedreamin/image/upload/v1742427763/mcp-servers-gallery_feyi2p.png',
        width: 1253,
        height: 656,
        alt: 'Pipedream MCP Servers Library',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pipedream MCP',
    description: 'Access MCP servers for more than 2,500 APIs with 8,000 prebuilt tools',
    creator: '@pipedream',
    images: ['https://res.cloudinary.com/pipedreamin/image/upload/v1742427763/mcp-servers-gallery_feyi2p.png'],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Generate CSRF token for the meta tag
  const token = await csrfToken();
  
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
      <html lang="en" className={`${GeistSans.variable} scroll-smooth`} suppressHydrationWarning>
        <body className="font-sans transition-all duration-200">
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <CSRFProvider token={token}>
              <SessionProvider>
                <ClerkLoaded>
                  <UserMetadataInitializer />
                </ClerkLoaded>
                <RedirectHandler />
                <div className="transition-opacity duration-300">
                  {children}
                </div>
              </SessionProvider>
            </CSRFProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}