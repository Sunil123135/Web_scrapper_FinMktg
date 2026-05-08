import { eq } from "drizzle-orm";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUser } from "../src/lib/server/auth.js";
import { db, schema } from "../src/lib/server/db.js";
import { handleApiError, requireMethod, sendJson } from "../src/lib/server/http.js";
import { mapSource } from "../src/lib/server/mappers.js";
import type { Domain } from "../src/lib/types.js";

const DOMAINS = new Set<Domain>(["finance", "supply_chain", "marketing", "content", "other"]);

function readBody(req: VercelRequest) {
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}

function parseDomain(value: unknown): Domain {
  return typeof value === "string" && DOMAINS.has(value as Domain) ? (value as Domain) : "other";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireMethod(req.method, ["GET", "POST"]);
    const user = await requireUser(req);

    if (req.method === "GET") {
      const [sources, profile] = await Promise.all([
        db.query.sources.findMany({
          where: eq(schema.sources.userId, user.id),
          orderBy: (table, { desc }) => [desc(table.createdAt)],
        }),
        db.query.interestProfiles.findFirst({
          where: eq(schema.interestProfiles.userId, user.id),
        }),
      ]);

      sendJson(res, 200, {
        sources: sources.map(mapSource),
        profile: profile ? { profileText: profile.profileText, domain: profile.domain } : null,
      });
      return;
    }

    const body = readBody(req) as {
      profile?: { profileText?: unknown; domain?: unknown };
      sources?: Array<{ id?: unknown; url?: unknown; label?: unknown; category?: unknown; active?: unknown }>;
    };

    const profileText = typeof body.profile?.profileText === "string" ? body.profile.profileText.trim() : "";
    const domain = parseDomain(body.profile?.domain);
    const incomingSources = Array.isArray(body.sources) ? body.sources : [];

    const normalizedSources = incomingSources
      .map((source) => ({
        id: typeof source.id === "string" && source.id.length > 0 ? source.id : crypto.randomUUID(),
        userId: user.id,
        url: typeof source.url === "string" ? source.url.trim() : "",
        label: typeof source.label === "string" ? source.label.trim() : "",
        category: parseDomain(source.category),
        active: source.active !== false,
      }))
      .filter((source) => source.url.length > 0 && source.label.length > 0);

    await db
      .insert(schema.interestProfiles)
      .values({ userId: user.id, profileText, domain, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.interestProfiles.userId,
        set: { profileText, domain, updatedAt: new Date() },
      });

    await db.delete(schema.sources).where(eq(schema.sources.userId, user.id));

    if (normalizedSources.length > 0) {
      await db.insert(schema.sources).values(normalizedSources);
    }

    const savedSources = await db.query.sources.findMany({
      where: eq(schema.sources.userId, user.id),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    sendJson(res, 200, {
      sources: savedSources.map(mapSource),
      profile: { profileText, domain },
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
