# AGENTS.md

This repo produces a **Chrome Extension (Manifest V3)** and a **Next.js marketing site**. The extension is the product. The marketing site drives traffic and provides a landing page.

Read README.md for setup and database docs.

## What you're building

A Chrome extension that gets published to the Chrome Web Store. This is not a webapp — the primary artifact is a `.zip` file uploaded to CWS, not a Vercel deployment. The Vercel-deployed marketing site is secondary.

## Repo layout

```
/                              # Next.js marketing site (auto-deploys to Vercel)
  app/                         # Next.js pages and API routes
  db/                          # Neon PostgreSQL schema and connection
extension/                     # Chrome Extension (Manifest V3) — THE PRODUCT
  manifest.json                # Extension config — permissions, scripts, icons
  src/popup/                   # Popup UI shown when user clicks the extension icon
  src/background/              # Service worker — runs in background, handles events
  src/content/                 # Content script — injected into web pages
  assets/                      # Extension icons (16, 48, 128px PNGs)
  scripts/build.ts             # esbuild compiler
  scripts/package.ts           # Zips dist/ for CWS upload
  dist/                        # Build output (git-ignored)
```

## Extension development

### Build and test

```bash
cd extension
npm install
npm run build          # compiles to extension/dist/
npm run dev            # watch mode — rebuilds on file changes
```

To test locally: open `chrome://extensions`, enable Developer mode, click "Load unpacked", select `extension/dist/`.

### How the build works

`scripts/build.ts` uses esbuild to compile three entry points:
- `src/popup/popup.ts` → `dist/popup/popup.js`
- `src/background/service-worker.ts` → `dist/background/service-worker.js`
- `src/content/content.ts` → `dist/content/content.js`

Then copies static files (HTML, CSS, manifest.json, assets/) into `dist/`. The `dist/` directory is a complete, loadable extension.

### Package for Chrome Web Store

```bash
cd extension
npm run build
npm run package        # creates extension/extension.zip
```

## Manifest V3 guide

The manifest (`extension/manifest.json`) controls everything about the extension. Key fields:

### Permissions

```json
"permissions": []
```

Start empty. Add only what the extension needs. Common permissions:

| Permission | When to use |
|-----------|-------------|
| `"storage"` | Persist user settings or data locally |
| `"activeTab"` | Access the current tab when user clicks the extension icon |
| `"tabs"` | Read tab URLs and titles (more access than activeTab) |
| `"scripting"` | Programmatically inject scripts into pages |
| `"alarms"` | Schedule periodic background tasks |
| `"notifications"` | Show desktop notifications |
| `"contextMenus"` | Add items to the right-click menu |
| `"identity"` | OAuth2 authentication |

**Host permissions** go in a separate `"host_permissions"` array:
```json
"host_permissions": ["https://api.example.com/*"]
```

Only request permissions you actually use. CWS reviews reject extensions with unnecessary permissions. Use `"activeTab"` instead of broad host permissions when possible.

### Content scripts

Content scripts run inside web pages. Define in manifest.json:

```json
"content_scripts": [
  {
    "matches": ["https://www.example.com/*"],
    "js": ["content/content.js"],
    "css": ["content/content.css"],
    "run_at": "document_idle"
  }
]
```

- `matches` — URL patterns where the script runs. `"<all_urls>"` matches everything but triggers extra CWS scrutiny. Be specific.
- `run_at` — `"document_idle"` (default, after page loads), `"document_start"`, or `"document_end"`
- Content scripts have limited access to Chrome APIs. Use `chrome.runtime.sendMessage()` to communicate with the background service worker.

### Background service worker

The service worker (`src/background/service-worker.ts`) handles:
- Event listeners (install, messages, alarms, etc.)
- Communication between content scripts and popup
- API calls and data processing
- State management via `chrome.storage`

Key constraint: service workers are **ephemeral** — they can be terminated at any time. Do not rely on global variables persisting. Use `chrome.storage.local` for state.

```typescript
// Listening for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getData") {
    // Handle the request
    sendResponse({ data: "result" });
  }
  return true; // Required for async sendResponse
});
```

### Popup

The popup (`src/popup/`) is the UI shown when the user clicks the extension icon. It's a standalone HTML page.

- Keep it small (320-400px wide recommended)
- The popup closes when the user clicks away — don't rely on it staying open
- Communicate with background via `chrome.runtime.sendMessage()`
- Access current tab via `chrome.tabs.query({ active: true, currentWindow: true })`

### Extension icons

Replace the placeholder PNGs in `assets/`:
- `icon-16.png` — 16x16, shown in the toolbar
- `icon-48.png` — 48x48, shown in extensions page
- `icon-128.png` — 128x128, shown in Chrome Web Store

Icons must be PNG format. Use a simple, recognizable design that works at small sizes.

## Chrome Web Store

### How publishing works

Every merge to main that changes `extension/` triggers a GitHub Action that builds and uploads the extension as a **draft** to the Chrome Web Store. Drafts are not published — they sit in the CWS dashboard for the operator to review.

**Publishing is not automatic.** To get the extension published on the Chrome Web Store, agents must **vote to go live** — the same launch vote process used for all product types. When the launch vote passes, the operator reviews the latest draft in the CWS dashboard and submits it for review. CWS review typically takes 1-5 business days for new extensions.

Do not ask the operator to publish directly. The launch vote is the mechanism for going live.

### Before voting to go live

The extension must be complete and CWS-ready before the launch vote. Ensure all of the following:

- [ ] All `{{PRODUCT_NAME}}` and `{{PRODUCT_DESCRIPTION}}` placeholders replaced in `manifest.json` and `popup.html`
- [ ] Placeholder icons in `assets/` replaced with real icons (16x16, 48x48, 128x128 PNG)
- [ ] Specific `matches` patterns in content_scripts (avoid `<all_urls>` unless truly needed)
- [ ] Only permissions the extension actually uses — remove anything unused
- [ ] Extension builds cleanly (`cd extension && npm run build`)
- [ ] Marketing site has a landing page explaining the extension
- [ ] Privacy policy page on the marketing site (required if collecting any user data)

### CWS requirements for approval

Chrome Web Store will reject extensions that don't meet these:

1. **Single purpose** — the extension must do one clear thing. CWS rejects "Swiss army knife" extensions.
2. **Minimal permissions** — only request what you use. CWS reviewers check this.
3. **Accurate description** — the CWS description must accurately describe what the extension does. No misleading claims.
4. **Privacy policy** — required if the extension collects any user data.
5. **Screenshots** — at least one screenshot (1280x800 or 640x400). Show the extension actually working.
6. **No remote code** — Manifest V3 does not allow remotely hosted code. All JavaScript must be bundled in the extension.

### Version bumping

Bump `version` in `manifest.json` before each update after the extension is live. CWS rejects uploads with the same version as an existing published version. Use semver: `1.0.0` → `1.0.1` for fixes, `1.1.0` for features.

## Communication between extension components

```
Popup <──chrome.runtime.sendMessage──> Service Worker <──chrome.tabs.sendMessage──> Content Script
                                                       <──chrome.runtime.sendMessage──
```

- **Popup ↔ Background**: `chrome.runtime.sendMessage()` / `chrome.runtime.onMessage`
- **Background → Content**: `chrome.tabs.sendMessage(tabId, message)`
- **Content → Background**: `chrome.runtime.sendMessage(message)`
- **Storage (shared)**: `chrome.storage.local` is accessible from all contexts

## Marketing site

The Next.js app at the repo root serves as the marketing/landing page for the extension. It auto-deploys to Vercel on push to main.

Use it for:
- Landing page explaining the extension
- Privacy policy page (required for CWS if collecting data)
- Any server-side features the extension needs (API routes)

The database (Neon PostgreSQL via Drizzle ORM) is available for the marketing site and API routes. See README.md for database usage.

## Do not modify

- `db/index.ts` — database connection
- `drizzle.config.ts` — database sync config
- `.github/workflows/push-db-schema.yml` — auto-applies schema on merge
- `.github/workflows/upload-extension.yml` — uploads extension draft to CWS on merge
- `.env.example` — environment variable documentation
- `extension/scripts/build.ts` — esbuild build script
- `extension/scripts/package.ts` — zip packaging script

## Common patterns

### Extension that modifies page content

1. Add specific URL match patterns to `content_scripts` in manifest.json
2. Write DOM manipulation logic in `src/content/content.ts`
3. Add `"activeTab"` permission if you need to read the current tab
4. Optionally use the popup for user controls

### Extension with a popup UI and storage

1. Build your UI in `src/popup/popup.html` and `src/popup/popup.ts`
2. Add `"storage"` permission to manifest.json
3. Use `chrome.storage.local.set()` / `chrome.storage.local.get()` for persistence
4. Use the service worker to sync data or handle background tasks

### Extension that calls an API

1. Add `"host_permissions": ["https://your-api.com/*"]` to manifest.json
2. Make fetch calls from the service worker (not content scripts — they're subject to the page's CSP)
3. If the API is your marketing site, use the Vercel-deployed URL
4. Content scripts communicate with the service worker via `chrome.runtime.sendMessage()`, and the service worker makes the API call

### Adding a CSS file to content scripts

1. Create the CSS file in `src/content/content.css`
2. Add it to the `build.ts` copy step:
   ```typescript
   cpSync(resolve(srcDir, "content/content.css"), resolve(distDir, "content/content.css"));
   ```
3. Reference it in manifest.json:
   ```json
   "content_scripts": [{ "matches": [...], "js": [...], "css": ["content/content.css"] }]
   ```
