# Pipedream MCP Servers UI

Built on vibes with v0, Claude Code, and Cursor.

- Next.js
- Uses Supabase for retrieving apps and actions
- Clerk for auth

## Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Environment Variables

This project requires several environment variables for authentication and API access. A `.env.example` file is provided as a template - copy it to `.env.local` to get started:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual credentials:

- **Clerk Authentication**:

  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
  - `CLERK_SECRET_KEY`: Your Clerk secret key

- **Supabase**:

  - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

- **Pipedream Credentials**:

  - `PIPEDREAM_ENVIRONMENT`: Set to `development` or `production`
  - `PIPEDREAM_OAUTH_CLIENT_ID`: Your Pipedream OAuth client ID
  - `PIPEDREAM_OAUTH_CLIENT_SECRET`: Your Pipedream OAuth client secret
  - `PIPEDREAM_PROJECT_ID`: Your Pipedream project ID
  - `PIPEDREAM_API_HOST`: Pipedream API host (usually `api.pipedream.com`)
  - `PIPEDREAM_EXTERNAL_USER_ID`: (Optional) External user ID for testing

- **Development Settings**:
  - `NEXT_PUBLIC_DEBUG_MODE`: Set to `true` for additional debugging output

Note: `.env.local` is included in `.gitignore` and should never be committed to the repository. Only the example file without real credentials should be checked in.

## Notes

- I had a lot of issues getting my dev env set up initially, so I had to `--legacy-peer-deps` everything not sure if that's a big deal or not.
- Reach out to the team to get proper credentials for Supabase and Clerk for local development.
