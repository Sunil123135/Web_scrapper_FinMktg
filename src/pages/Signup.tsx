import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-5 px-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-blue">Start ScrapeSignal</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Create your briefing workspace</h1>
        </div>
        <SignUp routing="path" path="/signup" signInUrl="/login" fallbackRedirectUrl="/sources" />
        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-accent-blue" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
