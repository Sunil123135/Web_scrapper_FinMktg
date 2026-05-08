import { useAuth } from "@clerk/clerk-react";
import { EyeOff, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/toast-context";
import { Badge, ScoreBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { getScrapedItems, updateScrapedItem } from "@/lib/api";
import { domainLabels } from "@/lib/seedSources";
import type { Domain, ScrapedItem } from "@/lib/types";

type SortMode = "score" | "date";

export function DashboardPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ScrapedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState<Domain | "all">("all");
  const [sort, setSort] = useState<SortMode>("score");

  useEffect(() => {
    void getScrapedItems(getToken, domain === "all" ? undefined : domain)
      .then((data) => setItems(data.items.filter((item) => item.status !== "hidden")))
      .catch((error) => toast(error instanceof Error ? error.message : "Could not load dashboard", "error"))
      .finally(() => setLoading(false));
  }, [domain, getToken, toast]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sort === "date") {
        return new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime();
      }
      return b.relevanceScore - a.relevanceScore || new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime();
    });
  }, [items, sort]);

  function changeDomain(nextDomain: Domain | "all") {
    setLoading(true);
    setDomain(nextDomain);
  }

  async function act(itemId: string, action: "hide" | "save") {
    try {
      await updateScrapedItem(getToken, itemId, action);
      if (action === "hide") {
        setItems((current) => current.filter((item) => item.id !== itemId));
        toast("Item hidden", "success");
      } else {
        toast("Saved to brief", "success");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Action failed", "error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-blue">Dashboard</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ranked signals</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Review scraped items by relevance, save the strongest signals, and hide low-value noise.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={domain} aria-label="Filter by domain" onChange={(event) => changeDomain(event.target.value as Domain | "all")}>
            <option value="all">All domains</option>
            {Object.entries(domainLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select value={sort} aria-label="Sort items" onChange={(event) => setSort(event.target.value as SortMode)}>
            <option value="score">Sort by score</option>
            <option value="date">Sort by date</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : sortedItems.length === 0 ? (
        <EmptyState
          title="No scraped items yet"
          description="Add active sources, run Scrape Now, then come back here to review scored results."
          action={
            <Link
              className="focus-ring inline-flex h-10 items-center justify-center rounded-xl bg-accent-blue px-4 text-sm font-semibold text-white transition hover:bg-slate-900"
              to="/sources"
            >
              Go to sources
            </Link>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Signal</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedItems.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="max-w-3xl px-4 py-4">
                      <a className="font-bold text-slate-900 hover:text-accent-blue" href={item.url} target="_blank" rel="noreferrer">
                        {item.title}
                      </a>
                      <p className="mt-1 text-slate-600">{item.summary}</p>
                      <p className="mt-2 text-xs text-slate-500">{item.sourceLabel} · {item.reason}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className="bg-slate-100 text-slate-600">{domainLabels[item.category]}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <ScoreBadge score={item.relevanceScore} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => void act(item.id, "save")}>
                          <Plus className="mr-2 h-4 w-4" aria-hidden /> Brief
                        </Button>
                        <Button aria-label={`Hide ${item.title}`} variant="ghost" onClick={() => void act(item.id, "hide")}>
                          <EyeOff className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 lg:hidden">
            {sortedItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge className="mb-2 bg-slate-100 text-slate-600">{domainLabels[item.category]}</Badge>
                      <CardTitle>
                        <a href={item.url} target="_blank" rel="noreferrer">
                          {item.title}
                        </a>
                      </CardTitle>
                    </div>
                    <ScoreBadge score={item.relevanceScore} />
                  </div>
                  <CardDescription>{item.sourceLabel}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6 text-slate-700">{item.summary}</p>
                  <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{item.reason}</p>
                  <div className="flex gap-2">
                    <Button className="flex-1" variant="secondary" onClick={() => void act(item.id, "save")}>
                      Save to Brief
                    </Button>
                    <Button aria-label={`Hide ${item.title}`} variant="ghost" onClick={() => void act(item.id, "hide")}>
                      <EyeOff className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
