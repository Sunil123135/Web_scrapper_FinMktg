import { and, eq } from "drizzle-orm";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createContentHash } from "../src/lib/hash";
import { requireUser } from "../src/lib/server/auth";
import { scoreWithClaude } from "../src/lib/server/claude";
import { db, schema } from "../src/lib/server/db";
import { handleApiError, requireMethod, sendJson } from "../src/lib/server/http";
import { extractArticle } from "../src/lib/server/scrape";
import type { Domain, FailedSource } from "../src/lib/types";

const DOMAINS = new Set<Domain>(["finance", "supply_chain", "marketing", "content", "other"]);

function readBody(req: VercelRequest) {
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireMethod(req.method, ["POST"]);
    const user = await requireUser(req);
    const body = readBody(req) as { domain?: unknown };
    const domain = typeof body.domain === "string" && DOMAINS.has(body.domain as Domain) ? (body.domain as Domain) : null;

    const [profile, sources] = await Promise.all([
      db.query.interestProfiles.findFirst({ where: eq(schema.interestProfiles.userId, user.id) }),
      db.query.sources.findMany({
        where: domain
          ? and(eq(schema.sources.userId, user.id), eq(schema.sources.active, true), eq(schema.sources.category, domain))
          : and(eq(schema.sources.userId, user.id), eq(schema.sources.active, true)),
        orderBy: (table, { asc }) => [asc(table.createdAt)],
      }),
    ]);

    let inserted = 0;
    let skipped = 0;
    const failed: FailedSource[] = [];

    for (const source of sources) {
      try {
        const article = await extractArticle(source.url);
        const contentHash = await createContentHash(article.url, article.title);
        const duplicate = await db.query.scrapedItems.findFirst({
          where: and(eq(schema.scrapedItems.userId, user.id), eq(schema.scrapedItems.contentHash, contentHash)),
        });

        if (duplicate) {
          skipped += 1;
          continue;
        }

        const score = await scoreWithClaude({
          title: article.title,
          url: article.url,
          bodyText: article.bodyText,
          profileText: profile?.profileText ?? "",
        });

        await db.insert(schema.scrapedItems).values({
          userId: user.id,
          sourceId: source.id,
          url: article.url,
          title: article.title,
          author: article.author,
          publishedAt: article.publishedAt,
          bodyText: article.bodyText,
          summary: score.summary,
          relevanceScore: score.relevanceScore,
          reason: score.reason,
          status: "new",
          contentHash,
        });
        inserted += 1;
      } catch (error) {
        failed.push({
          sourceId: source.id,
          label: source.label,
          url: source.url,
          reason: error instanceof Error ? error.message : "Unknown scrape failure",
        });
      }
    }

    sendJson(res, 200, { inserted, skipped, failed });
  } catch (error) {
    handleApiError(res, error);
  }
}
