CREATE TYPE "domain" AS ENUM ('finance', 'supply_chain', 'marketing', 'content', 'other');
CREATE TYPE "scraped_item_status" AS ENUM ('new', 'read', 'hidden');

CREATE TABLE "users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "name" text,
  "image_url" text,
  "password_hash" text,
  "auth_provider" text DEFAULT 'clerk' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "provider" text NOT NULL,
  "provider_account_id" text NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "expires_at" timestamp with time zone
);

CREATE TABLE "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "session_token" text NOT NULL,
  "expires" timestamp with time zone NOT NULL,
  CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);

CREATE TABLE "interest_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "profile_text" text DEFAULT '' NOT NULL,
  "domain" "domain" DEFAULT 'other' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "interest_profiles_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "url" text NOT NULL,
  "label" text NOT NULL,
  "category" "domain" DEFAULT 'other' NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "scraped_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "source_id" uuid REFERENCES "sources"("id") ON DELETE set null,
  "url" text NOT NULL,
  "title" text NOT NULL,
  "author" text,
  "published_at" timestamp with time zone,
  "body_text" text NOT NULL,
  "summary" text NOT NULL,
  "relevance_score" integer NOT NULL,
  "reason" text NOT NULL,
  "status" "scraped_item_status" DEFAULT 'new' NOT NULL,
  "content_hash" char(64) NOT NULL,
  "scraped_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "brief_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "scraped_item_id" uuid NOT NULL REFERENCES "scraped_items"("id") ON DELETE cascade,
  "position" integer NOT NULL,
  "added_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "accounts_provider_account_unique" ON "accounts" ("provider", "provider_account_id");
CREATE INDEX "sources_user_idx" ON "sources" ("user_id");
CREATE INDEX "scraped_items_user_score_idx" ON "scraped_items" ("user_id", "relevance_score");
CREATE UNIQUE INDEX "scraped_items_user_hash_unique" ON "scraped_items" ("user_id", "content_hash");
CREATE INDEX "brief_items_user_idx" ON "brief_items" ("user_id");
CREATE UNIQUE INDEX "brief_items_user_item_unique" ON "brief_items" ("user_id", "scraped_item_id");
