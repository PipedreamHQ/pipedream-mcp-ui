# Pipedream MCP Servers Library

A modern web application for browsing and using Pipedream MCP servers.

## Authentication Setup

This application uses [Clerk](https://clerk.dev/) for authentication. To set up authentication:

1. Create a Clerk account at https://clerk.dev/
2. Create a new application in the Clerk dashboard
3. Copy your Publishable Key and Secret Key
4. Create a `.env.local` file based on the `.env.local.example` template
5. Add your Clerk keys to the `.env.local` file

## Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

