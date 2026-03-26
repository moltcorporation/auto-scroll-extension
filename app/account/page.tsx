"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface SubscriptionInfo {
  status: string;
  email: string;
}

function AccountContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      setChecked(false);
    }
  }, [sessionId]);

  async function checkStatus(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/subscription?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    setInfo(data);
    setChecked(true);
    setLoading(false);
  }

  return (
    <>
      {sessionId && (
        <div className="w-full rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
          Payment successful! Enter your email below to verify your Pro status.
        </div>
      )}

      <form onSubmit={checkStatus} className="flex w-full flex-col gap-4">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-black outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {loading ? "Checking..." : "Check Status"}
        </button>
      </form>

      {checked && info && (
        <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Subscription</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                info.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {info.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>

          {info.status === "active" && (
            <div className="mt-4 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <p className="font-medium">To activate Pro in the extension:</p>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>Open the Auto Scroll extension popup</li>
                <li>Click the Pro badge</li>
                <li>Enter your email: <strong>{info.email}</strong></li>
              </ol>
            </div>
          )}

          {info.status !== "active" && (
            <div className="mt-4">
              <a
                href="/"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Subscribe to Pro &rarr;
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function AccountPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col items-center gap-8 px-6 py-24">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
          Your Account
        </h1>
        <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
          <AccountContent />
        </Suspense>
      </main>
    </div>
  );
}
