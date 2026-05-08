import type { VercelResponse } from "@vercel/node";

export function sendJson<T>(res: VercelResponse, status: number, body: T) {
  res.status(status).setHeader("Content-Type", "application/json").json(body);
}

export function handleApiError(res: VercelResponse, error: unknown) {
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number"
      ? error.statusCode
      : 500;

  const message = error instanceof Error ? error.message : "Unexpected server error";
  sendJson(res, statusCode, { error: message });
}

export function requireMethod(method: string | undefined, allowed: string[]) {
  if (!method || !allowed.includes(method)) {
    throw Object.assign(new Error("Method not allowed"), { statusCode: 405 });
  }
}
