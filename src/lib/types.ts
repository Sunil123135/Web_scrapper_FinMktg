export type Domain = "finance" | "supply_chain" | "marketing" | "content" | "other";

export type Source = {
  id: string;
  url: string;
  label: string;
  category: Domain;
  active: boolean;
  createdAt?: string;
};

export type ScrapedItemStatus = "new" | "read" | "hidden";

export type ScrapedItem = {
  id: string;
  sourceId: string | null;
  sourceLabel: string;
  category: Domain;
  url: string;
  title: string;
  author: string | null;
  publishedAt: string | null;
  summary: string;
  relevanceScore: number;
  reason: string;
  status: ScrapedItemStatus;
  scrapedAt: string;
};

export type BriefItem = ScrapedItem & {
  position: number;
};

export type InterestProfile = {
  profileText: string;
  domain: Domain;
};

export type FailedSource = {
  sourceId: string;
  label: string;
  url: string;
  reason: string;
};

export type ScrapeResult = {
  inserted: number;
  skipped: number;
  failed: FailedSource[];
};
