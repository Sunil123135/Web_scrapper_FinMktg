import { describe, expect, it } from "vitest";

import { buildBriefPayload } from "../src/lib/brief";
import { createContentHash, normalizeUrlForHash } from "../src/lib/hash";
import { parseClaudeScore } from "../src/lib/scoring";
import { extractArticleWithClients, stripCookieHeaders, type ExtractedArticle } from "../src/lib/server/scrape";

describe("content hashing", () => {
  it("normalizes URLs before hashing scraper results", async () => {
    expect(normalizeUrlForHash("HTTPS://Example.com/Article/?utm_source=newsletter#intro")).toBe(
      "https://example.com/Article/",
    );
  });

  it("creates stable SHA-256 hashes from normalized URL and title", async () => {
    const first = await createContentHash("https://example.com/a?utm_campaign=x", "  Big News ");
    const second = await createContentHash("https://example.com/a", "Big News");

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("Claude score parsing", () => {
  it("parses raw JSON and clamps score fields to the expected contract", () => {
    expect(
      parseClaudeScore('{"summary":"Useful signal","relevance_score":14,"reason":"Directly matches profile."}'),
    ).toEqual({
      summary: "Useful signal",
      relevanceScore: 10,
      reason: "Directly matches profile.",
    });
  });

  it("strips markdown fences before parsing JSON", () => {
    expect(
      parseClaudeScore('```json\n{"summary":"Short","relevance_score":8,"reason":"Useful context."}\n```'),
    ).toEqual({
      summary: "Short",
      relevanceScore: 8,
      reason: "Useful context.",
    });
  });
});

describe("brief webhook payload", () => {
  it("builds the canonical n8n payload shape", () => {
    const payload = buildBriefPayload({
      userEmail: "user@example.com",
      profileText: "AI tools for B2B SaaS marketing",
      generatedAt: new Date("2026-05-08T07:00:00.000Z"),
      items: [
        {
          title: "Anthropic launches Claude for Excel",
          sourceLabel: "Anthropic News",
          url: "https://www.anthropic.com/news/claude-for-excel",
          summary: "Anthropic released a Claude integration for Excel.",
          score: 9,
          reason: "Direct fit.",
        },
      ],
    });

    expect(payload).toEqual({
      user_email: "user@example.com",
      profile_text: "AI tools for B2B SaaS marketing",
      generated_at: "2026-05-08T07:00:00.000Z",
      items: [
        {
          title: "Anthropic launches Claude for Excel",
          source_label: "Anthropic News",
          url: "https://www.anthropic.com/news/claude-for-excel",
          summary: "Anthropic released a Claude integration for Excel.",
          score: 9,
          reason: "Direct fit.",
        },
      ],
    });
  });
});

describe("scraper priority and privacy", () => {
  const article: ExtractedArticle = {
    url: "https://example.com/news",
    title: "Example News",
    author: null,
    publishedAt: null,
    bodyText: "Useful article text. ".repeat(20),
  };

  it("tries Firecrawl before Jina and falls back when the first scraper has no content", async () => {
    const calls: string[] = [];

    const result = await extractArticleWithClients("https://example.com/news", [
      {
        name: "Firecrawl",
        scrape: async () => {
          calls.push("Firecrawl");
          return null;
        },
      },
      {
        name: "Jina Reader",
        scrape: async () => {
          calls.push("Jina Reader");
          return article;
        },
      },
    ]);

    expect(result).toBe(article);
    expect(calls).toEqual(["Firecrawl", "Jina Reader"]);
  });

  it("removes cookie headers from outbound scraper requests", () => {
    const headers = stripCookieHeaders({
      Cookie: "session=secret",
      "Set-Cookie": "session=secret",
      Authorization: "Bearer token",
    });

    const normalized = new Headers(headers);
    expect(normalized.has("cookie")).toBe(false);
    expect(normalized.has("set-cookie")).toBe(false);
    expect(normalized.get("authorization")).toBe("Bearer token");
  });
});
