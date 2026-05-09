import { useAuth } from "@clerk/clerk-react";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/toast-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Progress, Skeleton } from "@/components/ui/feedback";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { getSources, saveSources, scrapeNow } from "@/lib/api";
import { domainLabels, seedSources } from "@/lib/seedSources";
import { getSourceUrlValidationError } from "@/lib/sourceUrl";
import type { Domain, FailedSource, Source } from "@/lib/types";
import { cn } from "@/lib/utils";

const emptyProfile = {
  profileText: "AI tools, market shifts, and operational risks that affect my business.",
  domain: "other" as Domain,
};

function newSource(source?: Partial<Source>): Source {
  return {
    id: crypto.randomUUID(),
    url: source?.url ?? "",
    label: source?.label ?? "",
    category: source?.category ?? "other",
    active: source?.active ?? true,
  };
}

export function SourcesPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [failed, setFailed] = useState<FailedSource[]>([]);
  const [profile, setProfile] = useState(emptyProfile);
  const [sources, setSources] = useState<Source[]>([]);

  const activeCount = useMemo(() => sources.filter((source) => source.active).length, [sources]);
  const invalidSourceErrors = useMemo(
    () =>
      new Map(
        sources
          .map((source) => {
            if (!source.url.trim()) {
              return null;
            }
            const reason = getSourceUrlValidationError(source.url);
            return reason ? ([source.id, reason] as const) : null;
          })
          .filter((entry): entry is readonly [string, string] => Boolean(entry)),
      ),
    [sources],
  );

  useEffect(() => {
    void getSources(getToken)
      .then((data) => {
        setSources(data.sources);
        setProfile(data.profile ?? emptyProfile);
      })
      .catch((error) => toast(error instanceof Error ? error.message : "Could not load sources", "error"))
      .finally(() => setLoading(false));
  }, [getToken, toast]);

  async function persist(nextSources = sources) {
    if (invalidSourceErrors.size > 0) {
      toast("Fix invalid source URLs before saving.", "error");
      return;
    }

    setSaving(true);
    try {
      const saved = await saveSources(getToken, { profile, sources: nextSources });
      setSources(saved.sources);
      setProfile(saved.profile);
      toast("Sources saved", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not save sources", "error");
    } finally {
      setSaving(false);
    }
  }

  async function runScrape() {
    if (invalidSourceErrors.size > 0) {
      toast("Fix invalid source URLs before scraping.", "error");
      return;
    }

    setScraping(true);
    setFailed([]);
    try {
      await persist();
      const result = await scrapeNow(getToken, profile.domain === "other" ? undefined : profile.domain);
      setFailed(result.failed);
      if (result.inserted > 0) {
        toast(`Scraped ${result.inserted} new items, skipped ${result.skipped}`, "success");
        navigate("/dashboard");
        return;
      }

      if (result.failed.length > 0) {
        toast(
          `No new items were added. ${result.failed.length} source${result.failed.length === 1 ? "" : "s"} failed. Scroll down to review and edit source URLs.`,
          "error",
        );
        return;
      }

      toast("No new items found from active sources for this run.", "info");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Scrape failed", "error");
    } finally {
      setScraping(false);
    }
  }

  function importSeeds() {
    const existing = new Set(sources.map((source) => source.url));
    const imported = seedSources.filter((source) => !existing.has(source.url)).map((source) => newSource(source));
    setSources((current) => [...imported, ...current]);
    toast(`Imported ${imported.length} seed sources`, "success");
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-blue">Sources</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Choose what ScrapeSignal reads</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Add sources, describe what matters, then run one sequential scrape for the selected domain.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interest profile</CardTitle>
            <CardDescription>Claude scores each item against this profile.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="space-y-2">
              <Label htmlFor="profile">Profile text</Label>
              <Textarea
                id="profile"
                value={profile.profileText}
                onChange={(event) => setProfile((current) => ({ ...current, profileText: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Default domain</Label>
              <Select
                id="domain"
                value={profile.domain}
                onChange={(event) => setProfile((current) => ({ ...current, domain: event.target.value as Domain }))}
              >
                {Object.entries(domainLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setSources((current) => [newSource(), ...current])}>
            <Plus className="mr-2 h-4 w-4" aria-hidden /> Add source
          </Button>
          <Button variant="secondary" onClick={importSeeds}>
            Import seed sources
          </Button>
          <Button variant="secondary" onClick={() => void persist()} disabled={saving || invalidSourceErrors.size > 0}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button onClick={() => void runScrape()} disabled={scraping || activeCount === 0 || invalidSourceErrors.size > 0}>
            {scraping ? "Scraping..." : "Scrape Now"}
          </Button>
        </div>

        {scraping ? <Progress value={65} label={`Scraped sources sequentially. Active queue: ${activeCount}`} /> : null}

        {sources.length === 0 ? (
          <EmptyState
            title="No sources yet"
            description="Import curated sources or add your first URL to start a Day 1 demo."
            action={<Button onClick={importSeeds}>Import seed sources</Button>}
          />
        ) : (
          <div className="grid gap-3">
            {sources.map((source) => (
              <Card key={source.id}>
                <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_170px_90px_44px]">
                  <Input
                    aria-label="Source label"
                    value={source.label}
                    placeholder="Source label"
                    onChange={(event) =>
                      setSources((current) =>
                        current.map((item) => (item.id === source.id ? { ...item, label: event.target.value } : item)),
                      )
                    }
                  />
                  <Input
                    aria-label="Source URL"
                    className={cn(
                      invalidSourceErrors.has(source.id) && "border-red-300 focus-visible:ring-red-500/40",
                    )}
                    value={source.url}
                    placeholder="https://example.com"
                    onChange={(event) =>
                      setSources((current) =>
                        current.map((item) => (item.id === source.id ? { ...item, url: event.target.value } : item)),
                      )
                    }
                  />
                  {invalidSourceErrors.has(source.id) ? (
                    <p className="md:col-span-2 -mt-1 text-xs font-medium text-red-600">
                      {invalidSourceErrors.get(source.id)}
                    </p>
                  ) : null}
                  <Select
                    aria-label="Source category"
                    value={source.category}
                    onChange={(event) =>
                      setSources((current) =>
                        current.map((item) =>
                          item.id === source.id ? { ...item, category: event.target.value as Domain } : item,
                        ),
                      )
                    }
                  >
                    {Object.entries(domainLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <label className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={source.active}
                      onChange={(event) =>
                        setSources((current) =>
                          current.map((item) =>
                            item.id === source.id ? { ...item, active: event.target.checked } : item,
                          ),
                        )
                      }
                    />
                    Active
                  </label>
                  <Button
                    aria-label={`Remove ${source.label || "source"}`}
                    variant="ghost"
                    onClick={() => setSources((current) => current.filter((item) => item.id !== source.id))}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Demo status</CardTitle>
            <CardDescription>Keep one strong end-to-end flow ready.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              <strong className="text-slate-900">{sources.length}</strong> sources saved,{" "}
              <strong className="text-slate-900">{activeCount}</strong> active.
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(domainLabels).map(([value, label]) => (
                <Badge key={value} className="bg-slate-100 text-slate-600">
                  {label}: {sources.filter((source) => source.category === value).length}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {failed.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Failed ({failed.length})</CardTitle>
              <CardDescription>These sources can be retried after edits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {failed.map((source) => (
                <div key={source.sourceId} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{source.label}</p>
                  <p className="mt-1 text-slate-600">{source.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}
