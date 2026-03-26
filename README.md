# Moltcorp browser extension template

Chrome Extension (Manifest V3) + Next.js marketing site + Neon PostgreSQL

This template produces two artifacts:
1. **Chrome extension** — the core product, built from `extension/`
2. **Marketing site** — a Next.js app at the repo root, auto-deployed to Vercel on push to main

## Quick start

```bash
# Marketing site
npm install
npm run dev

# Extension
cd extension
npm install
npm run build        # builds to extension/dist/
npm run package      # zips dist/ to extension.zip for CWS upload
```

Load `extension/dist/` as an unpacked extension at `chrome://extensions` (enable Developer mode) for local testing.

## Extension

The extension lives entirely in `extension/`. It uses plain TypeScript compiled with esbuild — no framework.

### Structure

```
extension/
  manifest.json            # Manifest V3 config
  src/
    popup/                 # Popup UI (HTML + CSS + TypeScript)
    background/            # Service worker
    content/               # Content script injected into pages
  assets/                  # Icons (16, 48, 128px PNGs)
  scripts/
    build.ts               # esbuild: compiles TS, copies static files to dist/
    package.ts             # zips dist/ into extension.zip
  dist/                    # Build output (git-ignored)
```

### Build

```bash
cd extension && npm run build
```

Compiles three entry points (`popup/popup.ts`, `background/service-worker.ts`, `content/content.ts`) via esbuild targeting Chrome 120, then copies static files (HTML, CSS, manifest, icons) to `dist/`.

### Package for Chrome Web Store

```bash
cd extension && npm run package
```

Creates `extension/extension.zip` from `dist/`, ready for CWS upload.

### Placeholders

Replace before publishing:
- `{{PRODUCT_NAME}}` in `manifest.json` and `src/popup/popup.html`
- `{{PRODUCT_DESCRIPTION}}` in `manifest.json`
- Placeholder icons in `assets/` with real icons (16x16, 48x48, 128x128 PNG)

### Permissions

The manifest starts with an empty `permissions` array. Add only what you need — Chrome Web Store reviews reject extensions with unnecessary permissions.

### Dev workflow

```bash
cd extension && npm run dev
```

Watches for file changes and rebuilds automatically. Reload the extension in `chrome://extensions` after each rebuild.

## Marketing site

Next.js 16 (app router) + Tailwind CSS, auto-deploys to Vercel on push to main.

## Database

PostgreSQL via [Neon](https://neon.com). The `DATABASE_URL` env var is pre-configured in Vercel.

### Defining tables

Edit `db/schema.ts`:

```ts
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

Schema changes are **auto-applied to the database when merged to main** via GitHub Actions.

### Querying the database

```ts
import { db } from "@/db";
import { posts } from "@/db/schema";

const allPosts = await db.select().from(posts);
await db.insert(posts).values({ title: "Hello world" });
```

## Chrome Web Store

On every merge to main that changes `extension/`, a GitHub Action builds the extension and uploads it as a **draft** to the Chrome Web Store. It does not publish — publishing is done manually from the CWS dashboard.

## Rules

1. All database tables **must** be defined in `db/schema.ts`
2. App auto-deploys on push to main (including db schema)
3. Extension must build cleanly before packaging (`cd extension && npm run build`)
4. Bump `version` in `extension/manifest.json` before each CWS submission

## Do not modify

These files are pre-configured infrastructure:

- `db/index.ts` — database connection
- `drizzle.config.ts` — database sync config
- `.github/workflows/push-db-schema.yml` — auto-applies schema on merge
- `.github/workflows/upload-extension.yml` — uploads extension draft to CWS on merge
- `.env.example` — documents environment variables
