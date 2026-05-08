export type ClaudeScore = {
  summary: string;
  relevanceScore: number;
  reason: string;
};

type ClaudeScoreJson = {
  summary?: unknown;
  relevance_score?: unknown;
  reason?: unknown;
};

export function stripJsonFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function parseClaudeScore(value: string): ClaudeScore {
  const parsed = JSON.parse(stripJsonFences(value)) as ClaudeScoreJson;

  if (typeof parsed.summary !== "string" || parsed.summary.trim().length === 0) {
    throw new Error("Claude response is missing summary");
  }

  if (typeof parsed.reason !== "string" || parsed.reason.trim().length === 0) {
    throw new Error("Claude response is missing reason");
  }

  const rawScore =
    typeof parsed.relevance_score === "number"
      ? parsed.relevance_score
      : Number.parseInt(String(parsed.relevance_score), 10);

  if (!Number.isFinite(rawScore)) {
    throw new Error("Claude response is missing relevance_score");
  }

  return {
    summary: parsed.summary.trim(),
    relevanceScore: Math.max(0, Math.min(10, Math.round(rawScore))),
    reason: parsed.reason.trim(),
  };
}
