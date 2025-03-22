import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { randomUUID } from "crypto"

/**
 * This API route initializes the external user ID in Clerk metadata and
 * then redirects to the original destination URL stored in session storage.
 * It's used as a redirect destination after sign-up to ensure metadata is created.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    // Get the user data
    const user = await clerkClient.users.getUser(userId)
    
    // Check if the user already has an external ID
    let pdExternalUserId = user.privateMetadata?.pd_external_user_id as string
    
    if (!pdExternalUserId) {
      // Generate a new UUID if one doesn't exist
      pdExternalUserId = randomUUID()
      
      // Store it in Clerk's user metadata
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          pd_external_user_id: pdExternalUserId
        }
      })
    }
    
    // Add a small delay to ensure Clerk has time to update the metadata
    // This is particularly important after a new user signs up
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redirect to the original destination from session storage
    // We need to use a script tag to access localStorage/sessionStorage and perform the redirect
    // since this is a server-side API route
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Initializing...</title>
        </head>
        <body>
          <script>
            // Get the redirect URL from sessionStorage
            let redirectUrl = sessionStorage.getItem('pdRedirectUrl') || '/';
            
            // Add the /mcp prefix if the path doesn't already have it and it's not an absolute URL
            if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('/mcp/') && !redirectUrl.startsWith('http')) {
              redirectUrl = '/mcp' + redirectUrl;
            }
            
            console.log('Redirecting to:', redirectUrl);
            
            // Clear the stored redirect URL
            sessionStorage.removeItem('pdRedirectUrl');
            
            // Redirect to the original destination
            window.location.href = redirectUrl;
          </script>
          <p>Initializing your account... You will be redirected shortly.</p>
        </body>
      </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
        },
      }
    )
  } catch (error) {
    console.error('[initialize-metadata] Error initializing metadata:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}