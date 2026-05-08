import { SignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <section className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_420px]">
        <div className="flex flex-col justify-center">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-blue font-bold text-white">
            SS
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-blue">ScrapeSignal</p>
          <h1 className="mt-3 max-w-xl text-4xl font-bold tracking-tight text-slate-900">
            Turn noisy web sources into a ranked daily brief.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
            Sign in to manage sources, run a scrape, score items with Claude, and send your daily signal through n8n.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SignIn routing="path" path="/login" signUpUrl="/signup" fallbackRedirectUrl="/dashboard" />
          <p className="mt-4 text-center text-sm text-slate-600">
            New to ScrapeSignal?{" "}
            <Link className="font-semibold text-accent-blue" to="/signup">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
