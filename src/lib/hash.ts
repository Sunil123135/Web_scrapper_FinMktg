const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
]);

export function normalizeUrlForHash(input: string): string {
  const url = new URL(input.trim());
  url.hash = "";

  for (const param of Array.from(url.searchParams.keys())) {
    if (TRACKING_PARAMS.has(param.toLowerCase())) {
      url.searchParams.delete(param);
    }
  }

  url.hostname = url.hostname.toLowerCase();
  url.protocol = url.protocol.toLowerCase();

  const normalized = url.toString();
  return normalized.endsWith("?") ? normalized.slice(0, -1) : normalized;
}

export async function createContentHash(url: string, title: string): Promise<string> {
  const normalizedUrl = normalizeUrlForHash(url);
  const normalizedTitle = title.trim().replace(/\s+/g, " ");
  const input = `${normalizedUrl}|${normalizedTitle}`;

  if (globalThis.crypto?.subtle) {
    const data = new TextEncoder().encode(input);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(input).digest("hex");
}
