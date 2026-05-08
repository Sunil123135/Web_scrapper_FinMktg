import { useAuth } from "@clerk/clerk-react";
import { ArrowDown, ArrowUp, Copy, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/toast-context";
import { ScoreBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { getBrief, reorderBrief, sendBrief } from "@/lib/api";
import type { BriefItem } from "@/lib/types";

function toMarkdown(items: BriefItem[]) {
  return [
    "# Today's Brief",
    "",
    ...items.flatMap((item, index) => [
      `## ${index + 1}. ${item.title}`,
      "",
      `- Source: ${item.sourceLabel}`,
      `- Score: ${item.relevanceScore}/10`,
      `- URL: ${item.url}`,
      "",
      item.summary,
      "",
      `Why it matters: ${item.reason}`,
      "",
    ]),
  ].join("\n");
}

export function BriefPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<BriefItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void getBrief(getToken)
      .then((data) => setItems(data.items))
      .catch((error) => toast(error instanceof Error ? error.message : "Could not load brief", "error"))
      .finally(() => setLoading(false));
  }, [getToken, toast]);

  const markdown = useMemo(() => toMarkdown(items), [items]);

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) {
      return;
    }
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next.map((item, itemIndex) => ({ ...item, position: itemIndex + 1 })));
    try {
      const saved = await reorderBrief(getToken, next.map((item) => item.id));
      setItems(saved.items);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not reorder brief", "error");
    }
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown);
    toast("Brief copied as Markdown", "success");
  }

  async function submitBrief() {
    setSending(true);
    try {
      await sendBrief(getToken);
      toast("Brief sent", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Send failed - retry", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-blue">Today's Brief</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Curate the final signal</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Reorder saved items, copy a markdown version, or send the JSON payload to n8n.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => void copyMarkdown()} disabled={items.length === 0}>
            <Copy className="mr-2 h-4 w-4" aria-hidden /> Copy as Markdown
          </Button>
          <Button onClick={() => void submitBrief()} disabled={items.length === 0 || sending}>
            <Send className="mr-2 h-4 w-4" aria-hidden /> {sending ? "Sending..." : "Send Brief"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No brief items yet"
          description="Save high-scoring dashboard items to build today's brief."
          action={
            <Link
              className="focus-ring inline-flex h-10 items-center justify-center rounded-xl bg-accent-blue px-4 text-sm font-semibold text-white transition hover:bg-slate-900"
              to="/dashboard"
            >
              Review dashboard
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {items.map((item, index) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-accent-blue">Position {index + 1}</p>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.sourceLabel}</CardDescription>
                  </div>
                  <ScoreBadge score={item.relevanceScore} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-slate-700">{item.summary}</p>
                <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{item.reason}</p>
                <div className="flex flex-wrap gap-2">
                  <Button aria-label={`Move ${item.title} up`} variant="secondary" onClick={() => void move(index, -1)} disabled={index === 0}>
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    aria-label={`Move ${item.title} down`}
                    variant="secondary"
                    onClick={() => void move(index, 1)}
                    disabled={index === items.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden />
                  </Button>
                  <a className="text-sm font-semibold text-accent-blue hover:text-slate-900" href={item.url} target="_blank" rel="noreferrer">
                    Open source
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
