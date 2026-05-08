export type BriefPayloadInput = {
  userEmail: string;
  profileText: string;
  generatedAt: Date;
  items: Array<{
    title: string;
    sourceLabel: string;
    url: string;
    summary: string;
    score: number;
    reason: string;
  }>;
};

export type BriefWebhookPayload = {
  user_email: string;
  profile_text: string;
  generated_at: string;
  items: Array<{
    title: string;
    source_label: string;
    url: string;
    summary: string;
    score: number;
    reason: string;
  }>;
};

export function buildBriefPayload(input: BriefPayloadInput): BriefWebhookPayload {
  return {
    user_email: input.userEmail,
    profile_text: input.profileText,
    generated_at: input.generatedAt.toISOString(),
    items: input.items.map((item) => ({
      title: item.title,
      source_label: item.sourceLabel,
      url: item.url,
      summary: item.summary,
      score: item.score,
      reason: item.reason,
    })),
  };
}
