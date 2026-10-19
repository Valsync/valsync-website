import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const web = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(web, "../support");
const target = resolve(web, "out/support");
if (!existsSync(join(web, "out/index.html"))) throw new Error("Build the static export first");
mkdirSync(target, { recursive: true });
let count = 0;
if (existsSync(source)) for (const file of readdirSync(source, { withFileTypes: true })) {
  if (file.isFile() && /^vs-[a-f0-9]{24}\.json$/.test(file.name)) { copyFileSync(join(source, file.name), join(target, file.name)); count++; }
}
console.log(`Staged ${count} public support replies for Netlify`);
