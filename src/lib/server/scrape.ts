import Firecrawl from "@mendable/firecrawl-js";

export type ExtractedArticle = {
  url: string;
  title: string;
  author: string | null;
  publishedAt: Date | null;
  bodyText: string;
};

export type ScraperClient = {
  name: string;
  scrape: (url: string) => Promise<ExtractedArticle | null>;
};

const FETCH_TIMEOUT_MS = 15_000;
const MIN_BODY_TEXT_LENGTH = 200;
const APIFY_SYNC_BASE_URL = "https://api.apify.com/v2/acts";
const APIFY_SYNC_TIMEOUT_MS = 120_000;
const DEFAULT_APIFY_ACTOR = "apify/website-content-crawler";
const BROWSERACT_API_BASE_URL = "https://api.browseract.com/v2";
const BROWSERACT_POLL_INTERVAL_MS = 5_000;
const BROWSERACT_TIMEOUT_MS = 120_000;
const BROWSERACT_URL_INPUT_NAME = "url";

function withTimeout(signal?: AbortSignal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function hasReadableBodyText(article: ExtractedArticle | null): article is ExtractedArticle {
  return Boolean(article && article.bodyText.length > MIN_BODY_TEXT_LENGTH);
}

function markdownTitle(markdown: string, fallback: string) {
  const firstHeading = markdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("# "));
  return firstHeading ? firstHeading.replace(/^#\s+/, "").trim() : fallback;
}

export function stripCookieHeaders(headers?: HeadersInit): HeadersInit | undefined {
  if (!headers) {
    return undefined;
  }

  const output = new Headers(headers);
  output.delete("cookie");
  output.delete("Cookie");
  output.delete("set-cookie");
  output.delete("Set-Cookie");
  return output;
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const timeout = withTimeout(init?.signal ?? undefined);
  try {
    return await fetch(url, {
      ...init,
      credentials: "omit",
      headers: stripCookieHeaders(init?.headers),
      signal: timeout.signal,
    });
  } finally {
    timeout.clear();
  }
}

function articleFromMarkdown(url: string, markdown: string, fallbackTitle: string): ExtractedArticle | null {
  const bodyText = normalizeText(markdown);
  if (bodyText.length <= MIN_BODY_TEXT_LENGTH) {
    return null;
  }

  return {
    url,
    title: markdownTitle(markdown, fallbackTitle),
    author: null,
    publishedAt: null,
    bodyText,
  };
}

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function findLongestText(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(findLongestText).filter((text): text is string => Boolean(text)).sort((a, b) => b.length - a.length)[0] ?? null;
  }

  const object = readObject(value);
  if (!object) {
    return null;
  }

  const preferredKeys = ["markdown", "content", "text", "body", "result", "output", "data"];
  const preferred = preferredKeys
    .map((key) => findLongestText(object[key]))
    .filter((text): text is string => Boolean(text))
    .sort((a, b) => b.length - a.length)[0];

  if (preferred) {
    return preferred;
  }

  return Object.values(object)
    .map(findLongestText)
    .filter((text): text is string => Boolean(text))
    .sort((a, b) => b.length - a.length)[0] ?? null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function apifyActorPath(actorId: string): string {
  const trimmed = actorId.trim();
  if (trimmed.includes("~")) {
    return trimmed;
  }
  return trimmed.replace(/^([^/]+)\//, "$1~");
}

function withDeadlineMs(ms: number, upstream?: AbortSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  if (upstream) {
    upstream.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function scrapeWithApify(url: string): Promise<ExtractedArticle | null> {
  const token = process.env.APIFY_API_TOKEN ?? process.env.APIFY_TOKEN;
  if (!token) {
    return null;
  }

  const actorRaw = process.env.APIFY_ACTOR_ID ?? DEFAULT_APIFY_ACTOR;
  const crawlerType = process.env.APIFY_CRAWLER_TYPE ?? "playwright:adaptive";
  const actorPath = apifyActorPath(actorRaw);
  const deadlineMs =
    typeof process.env.APIFY_SYNC_TIMEOUT_MS === "string"
      ? Math.max(FETCH_TIMEOUT_MS, Number(process.env.APIFY_SYNC_TIMEOUT_MS) || APIFY_SYNC_TIMEOUT_MS)
      : APIFY_SYNC_TIMEOUT_MS;
  const timeoutSecs = Math.min(300, Math.ceil(deadlineMs / 1000));

  const input = {
    startUrls: [{ url }],
    crawlerType,
    maxCrawlDepth: 0,
    maxCrawlPages: 1,
    maxResults: 1,
    saveMarkdown: true,
    useSitemaps: false,
    useLlmsTxt: false,
  };

  const deadline = withDeadlineMs(deadlineMs);

  try {
    const endpoint = `${APIFY_SYNC_BASE_URL}/${encodeURIComponent(actorPath)}/run-sync-get-dataset-items?timeout=${timeoutSecs}`;
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "omit",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: deadline.signal,
    });

    if (!response.ok) {
      throw new Error(`Apify scrape failed with ${response.status}`);
    }

    const rows = (await response.json()) as unknown;
    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    const extracted = findLongestText(rows[0]);
    if (!extracted) {
      return null;
    }

    const rowObj = readObject(rows[0]);
    const hostname = new URL(url).hostname;
    let fallbackTitle = hostname;
    if (typeof rowObj?.title === "string" && rowObj.title.trim()) {
      fallbackTitle = rowObj.title.trim();
    } else {
      const meta = readObject(rowObj?.metadata);
      if (typeof meta?.title === "string" && meta.title.trim()) {
        fallbackTitle = meta.title.trim();
      }
    }

    return articleFromMarkdown(url, extracted, fallbackTitle);
  } finally {
    deadline.clear();
  }
}

async function scrapeWithBrowserAct(url: string): Promise<ExtractedArticle | null> {
  const apiKey = process.env.BROWSERACT_API_KEY;
  const workflowId = process.env.BROWSERACT_WORKFLOW_ID;
  const templateId = process.env.BROWSERACT_TEMPLATE_ID;

  if (!apiKey || (!workflowId && !templateId)) {
    return null;
  }

  const inputName = process.env.BROWSERACT_URL_INPUT_NAME || BROWSERACT_URL_INPUT_NAME;
  const taskBody: Record<string, unknown> = {
    input_parameters: [{ name: inputName, value: url }],
  };
  const endpoint = templateId ? "/workflow/run-task-by-template" : "/workflow/run-task";

  if (templateId) {
    taskBody.workflow_template_id = templateId;
    taskBody.proxyRegion = process.env.BROWSERACT_PROXY_REGION || "US";
  } else {
    taskBody.workflow_id = workflowId;
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "api-channel-ak": "scrapesignal",
  };

  const startResponse = await fetchWithTimeout(`${BROWSERACT_API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(taskBody),
  });

  if (!startResponse.ok) {
    throw new Error(`BrowserAct failed to start with ${startResponse.status}`);
  }

  const startPayload = (await startResponse.json()) as { id?: unknown };
  const taskId = typeof startPayload.id === "string" ? startPayload.id : null;
  if (!taskId) {
    throw new Error("BrowserAct did not return a task id");
  }

  const timeoutAt = Date.now() + BROWSERACT_TIMEOUT_MS;
  while (Date.now() < timeoutAt) {
    await new Promise((resolve) => setTimeout(resolve, BROWSERACT_POLL_INTERVAL_MS));
    const taskResponse = await fetchWithTimeout(
      `${BROWSERACT_API_BASE_URL}/workflow/get-task?task_id=${encodeURIComponent(taskId)}`,
      { headers },
    );

    if (!taskResponse.ok) {
      throw new Error(`BrowserAct task lookup failed with ${taskResponse.status}`);
    }

    const taskPayload = await taskResponse.json();
    const task = readObject(taskPayload);
    const status = typeof task?.status === "string" ? task.status : null;

    if (status === "failed" || status === "canceled") {
      throw new Error(`BrowserAct task ${status}`);
    }

    if (status === "finished") {
      const extracted = findLongestText(taskPayload);
      return extracted ? articleFromMarkdown(url, extracted, new URL(url).hostname) : null;
    }
  }

  throw new Error("BrowserAct task timed out");
}

async function scrapeWithFirecrawl(url: string): Promise<ExtractedArticle | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return null;
  }

  const client = new Firecrawl({ apiKey });
  const document = await client.scrape(url, {
    formats: ["markdown"],
    headers: {},
    onlyMainContent: true,
    storeInCache: false,
  });

  if (!document.markdown) {
    return null;
  }

  return articleFromMarkdown(url, document.markdown, document.metadata?.title ?? new URL(url).hostname);
}

async function scrapeWithJina(url: string): Promise<ExtractedArticle | null> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const jinaResponse = await fetchWithTimeout(jinaUrl, {
    headers: process.env.JINA_API_KEY ? { Authorization: `Bearer ${process.env.JINA_API_KEY}` } : undefined,
  });

  if (jinaResponse.ok) {
    const markdown = await jinaResponse.text();
    const article = articleFromMarkdown(url, markdown, new URL(url).hostname);
    if (article) {
      return article;
    }
  }

  return null;
}

async function scrapeWithReadability(url: string): Promise<ExtractedArticle | null> {
  const [{ Readability }, { JSDOM }] = await Promise.all([import("@mozilla/readability"), import("jsdom")]);
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Fetch failed with ${response.status}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();

  if (!article?.textContent) {
    throw new Error("No readable article content found");
  }

  return {
    url,
    title: article.title || new URL(url).hostname,
    author: article.byline || null,
    publishedAt: null,
    bodyText: normalizeText(article.textContent),
  };
}

function defaultScrapers(): ScraperClient[] {
  return [
    { name: "Apify", scrape: scrapeWithApify },
    { name: "Firecrawl", scrape: scrapeWithFirecrawl },
    { name: "Jina Reader", scrape: scrapeWithJina },
    { name: "Readability", scrape: scrapeWithReadability },
    { name: "BrowserAct", scrape: scrapeWithBrowserAct },
  ];
}

export async function extractArticleWithClients(
  url: string,
  scrapers: ScraperClient[] = defaultScrapers(),
): Promise<ExtractedArticle> {
  const failures: string[] = [];

  for (const scraper of scrapers) {
    try {
      const article = await scraper.scrape(url);
      if (hasReadableBodyText(article)) {
        return article;
      }
      failures.push(`${scraper.name}: no readable content`);
    } catch (error) {
      failures.push(`${scraper.name}: ${errorMessage(error)}`);
    }
  }

  throw new Error(`No scraper returned readable content. ${failures.join("; ")}`);
}

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  return extractArticleWithClients(url);
}
