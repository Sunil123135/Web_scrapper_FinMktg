function formatN8nErrorBody(text: string): string {
  const raw = text.slice(0, 800).trim();
  try {
    const json = JSON.parse(text) as { message?: string; hint?: string };
    if (typeof json.message === "string") {
      const parts = [json.message, typeof json.hint === "string" ? json.hint : ""].filter(Boolean);
      return parts.join(" ");
    }
  } catch {
    /* not JSON */
  }
  return raw;
}

export async function postJsonToN8n(webhookUrl: string, payload: Record<string, unknown>) {
  const url = webhookUrl.trim();
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const bodyText = await response.text();
    const detail = formatN8nErrorBody(bodyText);
    const suffix = detail ? `: ${detail}` : "";
    throw Object.assign(new Error(`n8n webhook failed with ${response.status}${suffix}`), { statusCode: 502 });
  }
}
