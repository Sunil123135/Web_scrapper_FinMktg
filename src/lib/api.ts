import type { BriefItem, Domain, InterestProfile, ScrapeResult, ScrapedItem, Source } from "./types";

type TokenProvider = () => Promise<string | null>;

async function requestJson<T>(path: string, getToken: TokenProvider, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getSources(getToken: TokenProvider) {
  return requestJson<{ sources: Source[]; profile: InterestProfile | null }>("/api/sources", getToken);
}

export async function saveSources(
  getToken: TokenProvider,
  input: { profile: InterestProfile; sources: Array<Omit<Source, "createdAt">> },
) {
  return requestJson<{ sources: Source[]; profile: InterestProfile }>("/api/sources", getToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function scrapeNow(getToken: TokenProvider, domain?: Domain) {
  return requestJson<ScrapeResult>("/api/scrape", getToken, {
    method: "POST",
    body: JSON.stringify({ domain }),
  });
}

export async function getScrapedItems(getToken: TokenProvider, domain?: Domain) {
  const params = domain ? `?domain=${domain}` : "";
  return requestJson<{ items: ScrapedItem[] }>("/api/items" + params, getToken);
}

export async function updateScrapedItem(getToken: TokenProvider, itemId: string, action: "hide" | "save") {
  return requestJson<{ ok: true }>("/api/items", getToken, {
    method: "PATCH",
    body: JSON.stringify({ itemId, action }),
  });
}

export async function getBrief(getToken: TokenProvider) {
  return requestJson<{ items: BriefItem[]; profile: InterestProfile | null }>("/api/brief", getToken);
}

export async function reorderBrief(getToken: TokenProvider, itemIds: string[]) {
  return requestJson<{ items: BriefItem[] }>("/api/brief", getToken, {
    method: "PATCH",
    body: JSON.stringify({ itemIds }),
  });
}

export async function sendBrief(getToken: TokenProvider) {
  return requestJson<{ ok: true }>("/api/send-brief", getToken, { method: "POST" });
}
