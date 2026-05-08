import { asc, eq } from "drizzle-orm";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildBriefPayload } from "../src/lib/brief";
import { requireUser } from "../src/lib/server/auth";
import { db, schema } from "../src/lib/server/db";
import { handleApiError, requireMethod, sendJson } from "../src/lib/server/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireMethod(req.method, ["POST"]);
    const user = await requireUser(req);
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error("N8N_WEBHOOK_URL is required");
    }

    const [profile, rows] = await Promise.all([
      db.query.interestProfiles.findFirst({ where: eq(schema.interestProfiles.userId, user.id) }),
      db
        .select({ brief: schema.briefItems, item: schema.scrapedItems, source: schema.sources })
        .from(schema.briefItems)
        .innerJoin(schema.scrapedItems, eq(schema.briefItems.scrapedItemId, schema.scrapedItems.id))
        .leftJoin(schema.sources, eq(schema.scrapedItems.sourceId, schema.sources.id))
        .where(eq(schema.briefItems.userId, user.id))
        .orderBy(asc(schema.briefItems.position)),
    ]);

    const payload = buildBriefPayload({
      userEmail: user.email,
      profileText: profile?.profileText ?? "",
      generatedAt: new Date(),
      items: rows.map((row) => ({
        title: row.item.title,
        sourceLabel: row.source?.label ?? "Unknown source",
        url: row.item.url,
        summary: row.item.summary,
        score: row.item.relevanceScore,
        reason: row.item.reason,
      })),
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw Object.assign(new Error(`n8n webhook failed with ${response.status}`), { statusCode: 502 });
    }

    sendJson(res, 200, { ok: true });
  } catch (error) {
    handleApiError(res, error);
  }
}
