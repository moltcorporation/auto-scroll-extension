"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col items-center gap-10 px-6 py-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
            Auto Scroll Pro
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Unlock custom hotkeys, speed presets, and teleprompter mode.
          </p>
        </div>

        <div className="w-full rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-black dark:text-white">$1.49</span>
            <span className="text-zinc-500 dark:text-zinc-400">/month</span>
          </div>

          <ul className="mb-8 flex flex-col gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <li className="flex items-center gap-2">
              <span className="text-green-600">&#10003;</span> Custom keyboard shortcuts
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">&#10003;</span> Save speed presets
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">&#10003;</span> Teleprompter mode with line highlight
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">&#10003;</span> Settings sync across devices
            </li>
          </ul>

          <form onSubmit={handleCheckout} className="flex flex-col gap-4">
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
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Redirecting..." : "Subscribe to Pro"}
            </button>
            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}
          </form>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Free tier includes auto-scroll, floating controller, keyboard shortcuts, and per-site speed memory.
        </p>
      </main>
    </div>
  );
}
