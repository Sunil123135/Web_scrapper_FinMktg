import {
  boolean,
  char,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const domainEnum = pgEnum("domain", ["finance", "supply_chain", "marketing", "content", "other"]);
export const scrapedItemStatusEnum = pgEnum("scraped_item_status", ["new", "read", "hidden"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  passwordHash: text("password_hash"),
  authProvider: text("auth_provider").notNull().default("clerk"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex("accounts_provider_account_unique").on(
      table.provider,
      table.providerAccountId,
    ),
  }),
);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const interestProfiles = pgTable("interest_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  profileText: text("profile_text").notNull().default(""),
  domain: domainEnum("domain").notNull().default("other"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    label: text("label").notNull(),
    category: domainEnum("category").notNull().default("other"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("sources_user_idx").on(table.userId),
  }),
);

export const scrapedItems = pgTable(
  "scraped_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    url: text("url").notNull(),
    title: text("title").notNull(),
    author: text("author"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    bodyText: text("body_text").notNull(),
    summary: text("summary").notNull(),
    relevanceScore: integer("relevance_score").notNull(),
    reason: text("reason").notNull(),
    status: scrapedItemStatusEnum("status").notNull().default("new"),
    contentHash: char("content_hash", { length: 64 }).notNull(),
    scrapedAt: timestamp("scraped_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userScoreIdx: index("scraped_items_user_score_idx").on(table.userId, table.relevanceScore),
    userHashUnique: uniqueIndex("scraped_items_user_hash_unique").on(table.userId, table.contentHash),
  }),
);

export const briefItems = pgTable(
  "brief_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scrapedItemId: uuid("scraped_item_id")
      .notNull()
      .references(() => scrapedItems.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("brief_items_user_idx").on(table.userId),
    itemUnique: uniqueIndex("brief_items_user_item_unique").on(table.userId, table.scrapedItemId),
  }),
);
