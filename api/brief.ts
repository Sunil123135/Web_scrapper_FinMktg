import { and, asc, eq, inArray } from "drizzle-orm";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUser } from "../src/lib/server/auth.js";
import { db, schema } from "../src/lib/server/db.js";
import { handleApiError, requireMethod, sendJson } from "../src/lib/server/http.js";
import type { BriefItem } from "../src/lib/types.js";

function readBody(req: VercelRequest) {
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}

function rowToBriefItem(row: {
  item: typeof schema.scrapedItems.$inferSelect;
  source: typeof schema.sources.$inferSelect | null;
  brief: typeof schema.briefItems.$inferSelect;
}): BriefItem {
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
    position: row.brief.position,
  };
}

async function getBriefItems(userId: string) {
  const rows = await db
    .select({ brief: schema.briefItems, item: schema.scrapedItems, source: schema.sources })
    .from(schema.briefItems)
    .innerJoin(schema.scrapedItems, eq(schema.briefItems.scrapedItemId, schema.scrapedItems.id))
    .leftJoin(schema.sources, eq(schema.scrapedItems.sourceId, schema.sources.id))
    .where(eq(schema.briefItems.userId, userId))
    .orderBy(asc(schema.briefItems.position));

  return rows.map(rowToBriefItem);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireMethod(req.method, ["GET", "PATCH"]);
    const user = await requireUser(req);

    if (req.method === "GET") {
      const [items, profile] = await Promise.all([
        getBriefItems(user.id),
        db.query.interestProfiles.findFirst({ where: eq(schema.interestProfiles.userId, user.id) }),
      ]);
      sendJson(res, 200, {
        items,
        profile: profile ? { profileText: profile.profileText, domain: profile.domain } : null,
      });
      return;
    }

    const body = readBody(req) as { itemIds?: unknown };
    const itemIds = Array.isArray(body.itemIds) ? body.itemIds.filter((id): id is string => typeof id === "string") : [];

    if (itemIds.length === 0) {
      throw Object.assign(new Error("itemIds is required"), { statusCode: 400 });
    }

    const existing = await db
      .select({ itemId: schema.briefItems.scrapedItemId })
      .from(schema.briefItems)
      .where(and(eq(schema.briefItems.userId, user.id), inArray(schema.briefItems.scrapedItemId, itemIds)));

    const existingIds = new Set(existing.map((item) => item.itemId));
    const orderedExistingIds = itemIds.filter((id) => existingIds.has(id));

    await Promise.all(
      orderedExistingIds.map((id, index) =>
        db
          .update(schema.briefItems)
          .set({ position: index + 1 })
          .where(and(eq(schema.briefItems.userId, user.id), eq(schema.briefItems.scrapedItemId, id))),
      ),
    );

    sendJson(res, 200, { items: await getBriefItems(user.id) });
  } catch (error) {
    handleApiError(res, error);
  }
}
