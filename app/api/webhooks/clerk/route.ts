import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { clerkClient } from "@clerk/clerk-sdk-node"
import { randomUUID } from "crypto"
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no svix headers, return 400
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', { status: 400 });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook received: ${eventType}`);

  // Handle user creation
  if (eventType === 'user.created') {
    try {
      const userId = id as string;
      
      console.log(`New user created: ${userId}`);
      
      // Generate a UUID
      const externalUserId = randomUUID();
      console.log(`Generated external user ID: ${externalUserId} for user ${userId}`);
      
      // Store it in Clerk's user metadata
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          pd_external_user_id: externalUserId
        }
      });
      
      console.log(`Successfully stored external user ID for user ${userId}`);
      
      return NextResponse.json({ success: true, message: `External user ID created for ${userId}` });
    } catch (error) {
      console.error('Error handling user creation webhook:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to process user creation' },
        { status: 500 }
      );
    }
  }

  // Return a 200 response for other event types
  return NextResponse.json({ success: true, message: `Webhook received for ${eventType}` });
}