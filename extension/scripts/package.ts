import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";

const extDir = resolve(import.meta.dirname, "..");
const distDir = resolve(extDir, "dist");

if (!existsSync(distDir)) {
  console.error("dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

execSync(`cd "${distDir}" && zip -r ../extension.zip .`, { stdio: "inherit" });
console.log("Packaged → extension/extension.zip");
