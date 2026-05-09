export async function postJsonToN8n(webhookUrl: string, payload: Record<string, unknown>) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300).trim();
    const suffix = detail ? `: ${detail}` : "";
    throw Object.assign(new Error(`n8n webhook failed with ${response.status}${suffix}`), { statusCode: 502 });
  }
}
