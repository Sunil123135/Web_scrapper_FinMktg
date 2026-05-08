# ScrapeSignal

ScrapeSignal is a Vite + React MVP that turns web sources into a relevance-ranked daily brief for finance, supply chain, marketing, and content workflows.

## Stack

- React 19, Vite 8, TypeScript, Tailwind CSS, shadcn-style local UI components
- Clerk for email/password and Google SSO
- Neon Postgres through Drizzle ORM
- Vercel Serverless Functions in `api/`
- Anthropic Claude for strict JSON scoring
- Firecrawl primary scraping, with Jina Reader, Readability, and BrowserAct fallbacks
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
- `BROWSERACT_API_KEY`: Optional BrowserAct API key. Required for BrowserAct scraping.
- `BROWSERACT_WORKFLOW_ID` or `BROWSERACT_TEMPLATE_ID`: Optional BrowserAct workflow/template ID that accepts a URL input.
- `BROWSERACT_URL_INPUT_NAME`: Optional BrowserAct URL input parameter name. Defaults to `url`.
- `BROWSERACT_PROXY_REGION`: Optional BrowserAct template proxy region. Defaults to `US`.
- `FIRECRAWL_API_KEY`: Optional Firecrawl API key. Required for Firecrawl scraping.
- `JINA_API_KEY`: Optional Jina key for fallback scraping.

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
- `BROWSERACT_API_KEY` (optional)
- `BROWSERACT_WORKFLOW_ID` or `BROWSERACT_TEMPLATE_ID` (optional)
- `BROWSERACT_URL_INPUT_NAME` (optional)
- `BROWSERACT_PROXY_REGION` (optional)
- `FIRECRAWL_API_KEY` (optional)
- `JINA_API_KEY` (optional)

## Scraper Order And Cookies

`Scrape Now` tries scrapers in this order:

1. Firecrawl single-page scrape, when configured.
2. Jina Reader.
3. Direct fetch plus Readability.
4. BrowserAct workflow/template task, when configured.

Outbound scraper requests strip `Cookie` and `Set-Cookie` headers, direct fetches use `credentials: "omit"`, and Firecrawl is called without custom cookie headers or cache storage. BrowserAct is invoked as a fresh workflow task per source URL; do not configure the BrowserAct workflow to reuse a logged-in browser profile or inject cookies.

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
