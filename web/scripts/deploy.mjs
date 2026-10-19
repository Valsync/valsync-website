#!/usr/bin/env node
// Netlify owns www.valsync.website. Build for the domain root before publishing.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const cwd = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env, NETLIFY: "true", GITHUB_PAGES: "" };
function run(command, args) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit", shell: process.platform === "win32" && command !== process.execPath });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run("npm", ["run", "build"]);
run(process.execPath, ["scripts/stage-support.mjs"]);
run("npx", ["--yes", "netlify-cli", "deploy", "--site=d1e949ab-100b-48e0-a97c-35be77648f55", "--prod", "--dir=out", "--functions=netlify/functions", "--no-build"]);

