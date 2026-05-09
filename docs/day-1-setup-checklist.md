# Day 1 Setup Checklist

Use this checklist to finish ScrapeSignal demo readiness without storing secrets in source control.

Status legend:

- `[x]` Verified locally in this checkout.
- `[ ]` Requires account-owner action, browser login, or secret values.
- `[~]` Partially verified locally; follow-up remains.

## GitHub

- `[x]` Confirm the intended GitHub remote is configured for this repo.
- `[~]` Push the working branch to GitHub before importing into Vercel.
- `[ ]` Do not create or paste GitHub personal access tokens into the repo. Generate tokens only in GitHub when a service explicitly requires one.

## Neon Postgres

- `[x]` Set `DATABASE_URL` in `.env` and Vercel. Use the pooled Neon connection string with `sslmode=require`.
- `[x]` Confirm connectivity from local development.
- `[ ]` Confirm the required public tables exist before using `Scrape Now`. Current read-only check found no public app tables.
- `[ ]` Apply `db/migrations/0000_initial.sql` only after confirming the target Neon branch is safe to mutate.

## Clerk And Google OAuth

- `[ ]` Create or select a Clerk application.
- `[ ]` Enable Email/Password in Clerk.
- `[ ]` Enable Google as a Clerk social connection.
- `[x]` Set `VITE_CLERK_PUBLISHABLE_KEY` for the browser app.
- `[x]` Set `CLERK_SECRET_KEY` for Vercel serverless function token verification.
- `[ ]` Add the local development origin in Clerk, usually `http://localhost:5173`.
- `[ ]` Add the Vercel production domain in Clerk after deployment.

### Auth Alignment Note

This repo currently uses Clerk with React/Vite routes (`/login`, `/signup`) and serverless bearer-token verification. It is not using NextAuth.

Google OAuth callback URLs such as `/api/auth/callback/google` only apply if the app is later migrated to NextAuth. For the current Clerk app, configure Google OAuth through Clerk's dashboard and follow Clerk's generated Google redirect URI.

## Anthropic

- `[x]` Set `ANTHROPIC_API_KEY` locally and in Vercel.
- `[x]` Optionally set `ANTHROPIC_MODEL`; otherwise the app uses its default.
- `[x]` Verify the key presence only. Do not print or commit the key.

## n8n

- `[ ]` Create an n8n workflow with a `POST` Webhook trigger.
- `[ ]` Add formatting and Send Email nodes.
- `[ ]` Activate the workflow.
- `[ ]` Set `N8N_WEBHOOK_URL` locally and in Vercel to the production webhook URL. Current local value is still a placeholder.
- `[ ]` Send a test payload only after confirming the webhook URL and recipient behavior.

## Vercel

- `[ ]` Import the GitHub repo into Vercel. Vercel CLI is installed locally, but no `.vercel` project link exists in this checkout.
- `[ ]` Set the same production env vars as local `.env`, excluding development-only values.
- `[ ]` Use `npm run build` as the build command.
- `[ ]` Use `dist` as the output directory.
- `[ ]` Confirm serverless functions under `api/` deploy with access to the required secrets.

## Scraper Services

- `[x]` Set `FIRECRAWL_API_KEY`. Firecrawl is the primary scraper.
- `[x]` Set `JINA_API_KEY` if using authenticated Jina Reader fallback.
- `[ ]` Set `BROWSERACT_API_KEY` and either `BROWSERACT_WORKFLOW_ID` or `BROWSERACT_TEMPLATE_ID` if using BrowserAct fallback. Current local values are empty/placeholders.
- `[~]` Confirm `BROWSERACT_URL_INPUT_NAME` matches the workflow/template URL input name; default is `url`.
- `[ ]` Confirm BrowserAct workflows do not reuse logged-in browser profiles or inject cookies.
- `[x]` Confirm all scraper requests are stateless and do not send cookie headers.

## Local Verification

- `[x]` Run `npm test`.
- `[x]` Run `npm run lint`.
- `[x]` Run `npm run build`.
- `[x]` Import seed sources and confirm duplicate URLs are ignored. Static check found 33 seed URLs and no duplicates.
- `[ ]` Run a real scrape only after Neon tables and required scraper/AI keys are configured.

