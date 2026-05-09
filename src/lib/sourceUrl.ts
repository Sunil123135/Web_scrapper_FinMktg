export function normalizeSourceUrl(value: string): string {
  return value.trim();
}

export function getSourceUrlValidationError(value: string): string | null {
  const normalized = normalizeSourceUrl(value);
  if (!normalized) {
    return "URL is required.";
  }

  if (normalized.includes("...") || normalized.includes("…")) {
    return "URL looks truncated. Paste the full link.";
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return "Enter a valid full URL.";
  }

  if (parsed.protocol !== "https:") {
    return "Only HTTPS URLs are allowed.";
  }

  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    return "Hostname is invalid.";
  }

  if (parsed.username || parsed.password) {
    return "URLs with embedded credentials are not allowed.";
  }

  return null;
}

export function validateSourceUrl(value: string): { valid: true } | { valid: false; reason: string } {
  const reason = getSourceUrlValidationError(value);
  return reason ? { valid: false, reason } : { valid: true };
}
