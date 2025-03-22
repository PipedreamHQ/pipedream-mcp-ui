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

  // Get webhook secret, validate it exists
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing CLERK_WEBHOOK_SECRET environment variable');
    return new Response('Server configuration error', { status: 500 });
  }
  
  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(webhookSecret);

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
      
      // Generate a UUID
      const externalUserId = randomUUID();
      
      // Store it in Clerk's user metadata
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          pd_external_user_id: externalUserId
        }
      });
      
      return NextResponse.json({ success: true, message: `External user ID created for ${userId}` });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to process user creation' },
        { status: 500 }
      );
    }
  }

  // Return a 200 response for other event types
  return NextResponse.json({ success: true, message: `Webhook received for ${eventType}` });
}