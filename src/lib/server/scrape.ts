import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export type ExtractedArticle = {
  url: string;
  title: string;
  author: string | null;
  publishedAt: Date | null;
  bodyText: string;
};

const FETCH_TIMEOUT_MS = 15_000;

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

function markdownTitle(markdown: string, fallback: string) {
  const firstHeading = markdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("# "));
  return firstHeading ? firstHeading.replace(/^#\s+/, "").trim() : fallback;
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const timeout = withTimeout(init?.signal ?? undefined);
  try {
    return await fetch(url, { ...init, signal: timeout.signal });
  } finally {
    timeout.clear();
  }
}

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const jinaResponse = await fetchWithTimeout(jinaUrl, {
    headers: process.env.JINA_API_KEY ? { Authorization: `Bearer ${process.env.JINA_API_KEY}` } : undefined,
  });

  if (jinaResponse.ok) {
    const markdown = await jinaResponse.text();
    const bodyText = normalizeText(markdown);
    if (bodyText.length > 200) {
      return {
        url,
        title: markdownTitle(markdown, new URL(url).hostname),
        author: null,
        publishedAt: null,
        bodyText,
      };
    }
  }

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
