"use client";

import { useState } from "react";

const CWS_URL =
  "https://chromewebstore.google.com/detail/auto-scroll/PLACEHOLDER_CWS_ID";

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
    <div className="min-h-screen bg-zinc-50 font-sans text-black dark:bg-black dark:text-white">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
              AS
            </div>
            <span className="text-lg font-semibold">Auto Scroll</span>
          </div>
          <a
            href={CWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Add to Chrome
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 py-24 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Smooth auto-scrolling for any page
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl">
            A floating controller, keyboard shortcuts, and per-site speed
            memory. Read articles, scripts, and feeds hands-free.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={CWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Add to Chrome — Free
            </a>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-12 text-center text-2xl font-bold">
            Everything you need for hands-free reading
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 text-3xl">&#9654;</div>
              <h3 className="mb-2 text-lg font-semibold">Floating Controller</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Start, stop, and adjust speed with a draggable on-page widget.
                Stays out of the way until you need it.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 text-3xl">&#9000;</div>
              <h3 className="mb-2 text-lg font-semibold">Keyboard Shortcuts</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Toggle scrolling, speed up, or slow down without touching the
                mouse. Works on every page.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 text-3xl">&#128337;</div>
              <h3 className="mb-2 text-lg font-semibold">Per-Site Memory</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your preferred speed is remembered for each site. Come back
                tomorrow and it picks up where you left off.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-4 text-center text-2xl font-bold">
            Free to use. Pro when you need more.
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-zinc-600 dark:text-zinc-400">
            The free tier covers everyday auto-scrolling. Pro unlocks power
            features for professionals and presenters.
          </p>
          <div className="mx-auto grid max-w-3xl gap-8 sm:grid-cols-2">
            {/* Free */}
            <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-2 text-sm font-medium text-zinc-500">Free</div>
              <div className="mb-4 text-3xl font-bold">$0</div>
              <ul className="mb-8 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex gap-2">
                  <span className="text-green-600">&#10003;</span> Auto-scroll any page
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">&#10003;</span> Floating controller
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">&#10003;</span> Keyboard shortcuts
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">&#10003;</span> Per-site speed memory
                </li>
              </ul>
              <a
                href={CWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-zinc-100 px-6 py-3 text-center font-medium text-zinc-900 hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                Install Free
              </a>
            </div>
            {/* Pro */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-8 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                Pro
              </div>
              <div className="mb-1 text-3xl font-bold">
                $1.49<span className="text-lg font-normal text-zinc-500">/mo</span>
              </div>
              <div className="mb-4 text-xs text-zinc-500">Cancel anytime</div>
              <ul className="mb-8 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex gap-2">
                  <span className="text-green-600">&#10003;</span> Everything in Free
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">&#10003;</span> Custom keyboard shortcuts
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">&#10003;</span> Save speed presets
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">&#10003;</span> Teleprompter mode
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">&#10003;</span> Settings sync across devices
                </li>
              </ul>
              <form onSubmit={handleCheckout} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-black outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Redirecting..." : "Subscribe to Pro"}
                </button>
                {error && (
                  <p className="text-center text-sm text-red-500">{error}</p>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto max-w-5xl px-6 py-24 text-center">
          <h2 className="mb-4 text-3xl font-bold">Start scrolling smarter</h2>
          <p className="mx-auto mb-8 max-w-xl text-zinc-600 dark:text-zinc-400">
            Install the free Chrome extension and never manually scroll through
            long pages again.
          </p>
          <a
            href={CWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Add to Chrome — Free
          </a>
          <p className="mt-4 text-xs text-zinc-500">
            Available on the Chrome Web Store
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-zinc-500">
          <p>
            Auto Scroll is built by{" "}
            <a
              href="https://moltcorporation.com"
              className="text-zinc-600 hover:text-black transition-colors dark:text-zinc-400 dark:hover:text-white"
              target="_blank"
            >
              Moltcorp
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
