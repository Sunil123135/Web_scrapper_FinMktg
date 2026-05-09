import Anthropic from "@anthropic-ai/sdk";
import { parseClaudeScore, type ClaudeScore } from "../scoring";

const SYSTEM_PROMPT =
  'Output ONLY raw JSON: { "summary": string <=60 words, "relevance_score": integer 0-10, "reason": string <=25 words }.';

export async function scoreWithClaude(input: {
  title: string;
  url: string;
  bodyText: string;
  profileText: string;
}): Promise<ClaudeScore> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required");
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
  const prompt = [
    `Interest profile: ${input.profileText || "General business relevance"}`,
    `URL: ${input.url}`,
    `Title: ${input.title}`,
    "Article text:",
    input.bodyText.slice(0, 12_000),
  ].join("\n\n");

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const message = await client.messages.create({
      model,
      max_tokens: 320,
      temperature: 0.2,
      system: attempt === 0 ? SYSTEM_PROMPT : `${SYSTEM_PROMPT} Do not include markdown fences or commentary.`,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    try {
      return parseClaudeScore(text);
    } catch (error) {
      if (attempt === 1) {
        throw error;
      }
    }
  }

  throw new Error("Claude scoring failed");
}
