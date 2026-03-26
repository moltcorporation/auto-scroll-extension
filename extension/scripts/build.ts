import * as esbuild from "esbuild";
import { cpSync, mkdirSync, rmSync } from "fs";
import { resolve } from "path";

const extDir = resolve(import.meta.dirname, "..");
const srcDir = resolve(extDir, "src");
const distDir = resolve(extDir, "dist");

// Clean dist
rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

// Build TypeScript files
await esbuild.build({
  entryPoints: [
    resolve(srcDir, "popup/popup.ts"),
    resolve(srcDir, "background/service-worker.ts"),
    resolve(srcDir, "content/content.ts"),
  ],
  bundle: true,
  outdir: distDir,
  format: "esm",
  target: "chrome120",
  minify: false,
});

// Copy static files
cpSync(resolve(srcDir, "popup/popup.html"), resolve(distDir, "popup/popup.html"));
cpSync(resolve(srcDir, "popup/popup.css"), resolve(distDir, "popup/popup.css"));
cpSync(resolve(extDir, "manifest.json"), resolve(distDir, "manifest.json"));
cpSync(resolve(extDir, "assets"), resolve(distDir, "assets"), { recursive: true });

console.log("Build complete → extension/dist/");
