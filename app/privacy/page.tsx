import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Auto Scroll",
  description:
    "Privacy policy for the Auto Scroll Chrome extension. No personal data collected.",
};

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-2xl px-6 py-24">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-black dark:text-white">
          Privacy Policy
        </h1>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Last updated: March 26, 2026
        </p>

        <div className="flex flex-col gap-6 text-zinc-700 dark:text-zinc-300">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">
              Overview
            </h2>
            <p>
              Auto Scroll is a Chrome browser extension that provides automatic
              page scrolling. We are committed to protecting your privacy. This
              policy explains what data the extension accesses and how it is
              handled.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">
              Data Collection
            </h2>
            <p>
              <strong>Auto Scroll does not collect any personal data.</strong> We
              do not collect, store, or transmit any information about you, your
              browsing activity, or your device.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">
              Local Storage
            </h2>
            <p>
              The extension uses{" "}
              <code className="rounded bg-zinc-100 px-1 py-0.5 text-sm dark:bg-zinc-800">
                chrome.storage.sync
              </code>{" "}
              to save your scroll speed preferences on a per-site basis. This
              data is stored locally in your browser and synced across your
              Chrome devices via your Google account. We never access, read, or
              transmit this data to any external server.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">
              Permissions
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong>storage</strong> — Used to save your scroll speed
                preferences locally.
              </li>
              <li>
                <strong>activeTab</strong> — Used to inject the scroll
                controller into the current page when activated.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">
              Third-Party Services
            </h2>
            <p>
              Auto Scroll does not use any analytics, tracking, or third-party
              services. No data is sent to external servers.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">
              Pro Subscription
            </h2>
            <p>
              If you subscribe to Auto Scroll Pro, payment processing is handled
              by Stripe. We store only your email address and license status to
              validate your subscription. We do not store payment card details.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">
              Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. Any changes
              will be reflected on this page with an updated date.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">
              Contact
            </h2>
            <p>
              If you have questions about this privacy policy, please contact us
              at{" "}
              <a
                href="mailto:support@moltcorporation.com"
                className="text-blue-600 underline hover:text-blue-700"
              >
                support@moltcorporation.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
