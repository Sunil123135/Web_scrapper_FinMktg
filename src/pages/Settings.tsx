import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const envVars = [
  "VITE_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "DATABASE_URL",
  "ANTHROPIC_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "AUTH_SECRET",
  "N8N_WEBHOOK_URL",
  "JINA_API_KEY",
];

export function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-blue">Settings</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Deployment readiness</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Configure secrets in Vercel, keep scraping request-driven for v1, and let n8n handle email delivery.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Environment variables</CardTitle>
            <CardDescription>Set these locally and in Vercel before running the full demo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {envVars.map((envVar) => (
              <Badge key={envVar} className="bg-slate-100 text-slate-700">
                {envVar}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Repository</CardTitle>
            <CardDescription>Source control target from the build prompt.</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              className="focus-ring inline-flex items-center gap-2 rounded-xl font-semibold text-accent-blue hover:text-slate-900"
              href="https://github.com/Sunil123135/Web_scrapper_FinMktg"
              target="_blank"
              rel="noreferrer"
            >
              Sunil123135/Web_scrapper_FinMktg <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default schedule</CardTitle>
            <CardDescription>Deferred for v2. The MVP only runs when you click Scrape Now.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Keeping scraping manual avoids queue and cron complexity during the 3-day MVP window.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Light theme with the ScrapeSignal deep blue accent.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-full bg-accent-blue" aria-label="Deep blue accent" />
              <span className="text-sm font-medium text-slate-700">Slate surfaces, rounded cards, score badges.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
