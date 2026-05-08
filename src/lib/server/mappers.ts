import type { InferSelectModel } from "drizzle-orm";
import type { BriefItem, ScrapedItem, Source } from "../types.js";
import { schema } from "./db.js";

type SourceRow = InferSelectModel<typeof schema.sources>;
type ScrapedItemRow = InferSelectModel<typeof schema.scrapedItems> & {
  source?: Pick<SourceRow, "label" | "category"> | null;
  position?: number;
};

export function mapSource(row: SourceRow): Source {
  return {
    id: row.id,
    url: row.url,
    label: row.label,
    category: row.category,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapScrapedItem(row: ScrapedItemRow): ScrapedItem {
  return {
    id: row.id,
    sourceId: row.sourceId,
    sourceLabel: row.source?.label ?? "Unknown source",
    category: row.source?.category ?? "other",
    url: row.url,
    title: row.title,
    author: row.author,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    summary: row.summary,
    relevanceScore: row.relevanceScore,
    reason: row.reason,
    status: row.status,
    scrapedAt: row.scrapedAt.toISOString(),
  };
}

export function mapBriefItem(row: ScrapedItemRow & { position: number }): BriefItem {
  return {
    ...mapScrapedItem(row),
    position: row.position,
  };
}
