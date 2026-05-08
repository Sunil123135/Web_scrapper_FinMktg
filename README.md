# ScrapeSignal

ScrapeSignal is a Vite + React MVP that turns web sources into a relevance-ranked daily brief for finance, supply chain, marketing, and content workflows.

## Stack

- React 19, Vite 8, TypeScript, Tailwind CSS, shadcn-style local UI components
- Clerk for email/password and Google SSO
- Neon Postgres through Drizzle ORM
- Vercel Serverless Functions in `api/`
- Anthropic Claude for strict JSON scoring
- Jina Reader primary scraping with Readability fallback
- n8n webhook delivery for "Send Brief"

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Fill `.env`:

- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk publishable key.
- `CLERK_SECRET_KEY`: Clerk secret key for serverless token verification.
- `DATABASE_URL`: Neon pooled connection string, usually with `-pooler` in the host and `sslmode=require`.
- `ANTHROPIC_API_KEY`: Anthropic API key.
- `N8N_WEBHOOK_URL`: Production n8n webhook URL.
- `JINA_API_KEY`: Optional Jina key.

4. Run the app:

```bash
npm run dev
```

## Database

The Drizzle schema lives in `db/schema.ts`, and the initial SQL migration is in `db/migrations/0000_initial.sql`.

Generate migrations after schema changes:

```bash
npm run db:generate
```

Apply migrations to Neon:

```bash
npm run db:migrate
```

For quick development syncs against a disposable branch:

```bash
npm run db:push
```

## Clerk And Google SSO

Create a Clerk application, enable email/password and Google as sign-in methods, then add the Clerk keys to `.env`.

For Google OAuth, add these redirect URLs in Google Cloud and connect them in Clerk:

- Local: `http://localhost:5173`
- Production: your Vercel domain

Clerk handles the auth screens through `/login` and `/signup`. Serverless functions verify Clerk session tokens sent as bearer tokens by the frontend.

## n8n Webhook

Create an n8n workflow:

1. Add a Webhook trigger node with method `POST`.
2. Use a production path such as `/scrapesignal-brief`.
3. Add formatting and Send Email nodes.
4. Activate the workflow.
5. Put the production URL in `N8N_WEBHOOK_URL`.

Payload shape:

```json
{
  "user_email": "user@example.com",
  "profile_text": "AI tools for B2B SaaS marketing",
  "generated_at": "2026-05-08T07:00:00.000Z",
  "items": [
    {
      "title": "Anthropic launches Claude for Excel",
      "source_label": "Anthropic News",
      "url": "https://www.anthropic.com/news/claude-for-excel",
      "summary": "Anthropic released a Claude integration for Excel.",
      "score": 9,
      "reason": "Direct fit."
    }
  ]
}
```

## Vercel Deployment

Import the GitHub repository in Vercel and set these environment variables:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL` (optional)
- `N8N_WEBHOOK_URL`
- `JINA_API_KEY` (optional)

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

## Smoke Test

1. Sign up or sign in through Clerk.
2. Go to `/sources`, import seed sources, and save the profile.
3. Click `Scrape Now`.
4. Confirm `/dashboard` shows scored items with score badges.
5. Save at least three items to the brief.
6. Go to `/brief`, reorder items, copy markdown, then click `Send Brief`.
7. Confirm n8n receives the webhook payload.

## Verification Commands

```bash
npm test
npm run lint
npm run build
```
