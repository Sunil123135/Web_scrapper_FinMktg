import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUser } from "../src/lib/server/auth";
import { scoreWithClaude } from "../src/lib/server/claude";
import { handleApiError, requireMethod, sendJson } from "../src/lib/server/http";

function readBody(req: VercelRequest) {
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireMethod(req.method, ["POST"]);
    await requireUser(req);

    const body = readBody(req) as {
      title?: unknown;
      url?: unknown;
      bodyText?: unknown;
      profileText?: unknown;
    };

    if (typeof body.bodyText !== "string" || body.bodyText.trim().length === 0) {
      throw Object.assign(new Error("bodyText is required"), { statusCode: 400 });
    }

    const score = await scoreWithClaude({
      title: typeof body.title === "string" ? body.title : "Untitled",
      url: typeof body.url === "string" ? body.url : "",
      bodyText: body.bodyText,
      profileText: typeof body.profileText === "string" ? body.profileText : "",
    });

    sendJson(res, 200, score);
  } catch (error) {
    handleApiError(res, error);
  }
}
