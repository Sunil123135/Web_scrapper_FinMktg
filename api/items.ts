import { and, desc, eq, sql } from "drizzle-orm";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUser } from "../src/lib/server/auth.js";
import { db, schema } from "../src/lib/server/db.js";
import { handleApiError, requireMethod, sendJson } from "../src/lib/server/http.js";
import type { Domain, ScrapedItem } from "../src/lib/types.js";

const DOMAINS = new Set<Domain>(["finance", "supply_chain", "marketing", "content", "other"]);

function readBody(req: VercelRequest) {
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}

function rowToItem(row: {
  item: typeof schema.scrapedItems.$inferSelect;
  source: typeof schema.sources.$inferSelect | null;
}): ScrapedItem {
  return {
    id: row.item.id,
    sourceId: row.item.sourceId,
    sourceLabel: row.source?.label ?? "Unknown source",
    category: row.source?.category ?? "other",
    url: row.item.url,
    title: row.item.title,
    author: row.item.author,
    publishedAt: row.item.publishedAt?.toISOString() ?? null,
    summary: row.item.summary,
    relevanceScore: row.item.relevanceScore,
    reason: row.item.reason,
    status: row.item.status,
    scrapedAt: row.item.scrapedAt.toISOString(),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireMethod(req.method, ["GET", "PATCH"]);
    const user = await requireUser(req);

    if (req.method === "GET") {
      const domain = typeof req.query.domain === "string" && DOMAINS.has(req.query.domain as Domain)
        ? (req.query.domain as Domain)
        : null;

      const filters = [
        eq(schema.scrapedItems.userId, user.id),
        domain ? eq(schema.sources.category, domain) : undefined,
      ].filter(Boolean);

      const rows = await db
        .select({ item: schema.scrapedItems, source: schema.sources })
        .from(schema.scrapedItems)
        .leftJoin(schema.sources, eq(schema.scrapedItems.sourceId, schema.sources.id))
        .where(and(...filters))
        .orderBy(desc(schema.scrapedItems.relevanceScore), desc(schema.scrapedItems.scrapedAt));

      sendJson(res, 200, { items: rows.map(rowToItem) });
      return;
    }

    const body = readBody(req) as { itemId?: unknown; action?: unknown };
    const itemId = typeof body.itemId === "string" ? body.itemId : "";

    if (!itemId) {
      throw Object.assign(new Error("itemId is required"), { statusCode: 400 });
    }

    if (body.action === "hide") {
      await db
        .update(schema.scrapedItems)
        .set({ status: "hidden" })
        .where(and(eq(schema.scrapedItems.userId, user.id), eq(schema.scrapedItems.id, itemId)));
      sendJson(res, 200, { ok: true });
      return;
    }

    if (body.action === "save") {
      const [{ nextPosition }] = await db
        .select({ nextPosition: sql<number>`coalesce(max(${schema.briefItems.position}), 0) + 1` })
        .from(schema.briefItems)
        .where(eq(schema.briefItems.userId, user.id));

      await db
        .insert(schema.briefItems)
        .values({ userId: user.id, scrapedItemId: itemId, position: nextPosition })
        .onConflictDoNothing();

      await db
        .update(schema.scrapedItems)
        .set({ status: "read" })
        .where(and(eq(schema.scrapedItems.userId, user.id), eq(schema.scrapedItems.id, itemId)));

      sendJson(res, 200, { ok: true });
      return;
    }

    throw Object.assign(new Error("Unsupported action"), { statusCode: 400 });
  } catch (error) {
    handleApiError(res, error);
  }
}
