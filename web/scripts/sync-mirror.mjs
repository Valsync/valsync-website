#!/usr/bin/env node
/**
 * sync-mirror.mjs — regenerate the root static mirror from web/out/.
 *
 * The repo root is served by hosts with different bases:
 *   - Surge/Netlify: https://valsync.surge.sh / custom domain      (root, CANONICAL)
 *   - GitHub Pages:  https://valsync.github.io/valsync-website/  (subpath, mirror)
 *
 * web/out/ is built with GITHUB_PAGES=true, so every asset/link carries the
 * absolute /valsync-website prefix — which 404s on root-domain hosts. The
 * mirror is flat (all pages at the same level), so rewriting the prefix to
 * "./" makes every URL resolve correctly under both bases. Never copy
 * web/out/ to the root verbatim; always run this script.
 *
 * Usage:  (from web/)  GITHUB_PAGES=true npm run build && npm run sync-mirror
 */
import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(WEB, "out");
const ROOT = resolve(WEB, "..");

// Files/dirs copied verbatim from web/out/ into the repo root.
const COPY = [
  "index.html",
  "404.html",
  "_not-found.html",
  "privacy.html",
  "terms.html",
  "mobile.html",
  "diagnostics.html",
  "favicon.ico",
  "loader-logo.png",
  "mr7gmipd-playstore.png",
  "file.svg",
  "globe.svg",
  "next.svg",
  "vercel.svg",
  "window.svg",
  "app-ads.txt",
  "robots.txt",
  ".nojekyll",
  "_next",
  "assets",
  "img",
];

// Diagnostic junk dragged into the mirror by older syncs (scraper dumps of
// Next routes: index.txt, __next._full.txt, junk-only privacy/ dirs, ...).
// Not part of the site — removed on every sync. Directories are only removed
// when they contain nothing but __next.* files.
const JUNK = [
  "index.txt",
  "privacy.txt",
  "terms.txt",
  "mobile.txt",
  "_not-found.txt",
  "privacy",
  "terms",
  "mobile",
];

// Rewrites applied to every copied .html/.js/.css file. Order matters:
// prefixed forms first, then the "./" + "/x" normalization artifacts.
const REWRITES = [
  // JSON-escaped form inside the RSC payload:  \"\/valsync-website\/x  ->  \"\./x
  ['"\\/valsync-website', '"\\./'],
  // plain attribute / JS double-quoted form:  "/valsync-website/x  ->  "./x
  ['"/valsync-website', '"./'],
  // single-quoted forms (defensive; not currently emitted)
  ["'\\/valsync-website", "'\\./"],
  ["'/valsync-website", "'./"],
  // template-literal form in JS chunks:  `/valsync-website${...}  ->  `./${...}
  ["`/valsync-website", "`./"],
  // normalization: B + "/x" concatenations produce ".//x"
  [".//", "./"],
  [".\\/\\/", ".\\/"],
];

// GitHub Pages is the mirror host, not canonical (canonical is
// valsync.surge.sh — see web/app/layout.tsx SITE_URL). If any copied file
// still references the full valsync.github.io/valsync-website URL (e.g. a
// future alternate/mirror link), the verify step below whitelists that one
// occurrence so it isn't flagged as a leftover unprefixed path.
const MIRROR_HOST = "valsync.github.io";

function fail(msg) {
  console.error(`\nsync-mirror: FAIL — ${msg}\n`);
  process.exit(1);
}

if (!existsSync(join(OUT, "index.html"))) {
  fail(`${OUT}/index.html not found — run "GITHUB_PAGES=true npm run build" first`);
}

const rewrite = (content) => {
  let out = content;
  for (const [from, to] of REWRITES) out = out.split(from).join(to);
  return out;
};

// --- copy ---------------------------------------------------------------

const copied = [];
for (const entry of COPY) {
  const src = join(OUT, entry);
  if (!existsSync(src)) {
    console.warn(`  warn: ${entry} missing from web/out — skipped`);
    continue;
  }
  const dest = join(ROOT, entry);
  if (statSync(src).isDirectory()) rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true, force: true });
  copied.push(entry);
}
console.log(`copied ${copied.length} entries from web/out/ to repo root`);

// --- rewrite + verify ---------------------------------------------------

const REWRITABLE = new Set([".html", ".js", ".css"]);
const rewritten = [];
const checked = [];
for (const entry of copied) {
  const abs = join(ROOT, entry);
  if (!statSync(abs).isDirectory()) {
    if (REWRITABLE.has(entry.slice(entry.lastIndexOf(".")))) {
      const before = readFileSync(abs, "utf8");
      const after = rewrite(before);
      if (after !== before) {
        writeFileSync(abs, after);
        rewritten.push(entry);
      }
      checked.push(entry);
    }
    continue;
  }
  // walk directories (dirs are small; recursion via stack keeps it simple)
  const stack = [abs];
  while (stack.length) {
    const dir = stack.pop();
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        stack.push(p);
        continue;
      }
      const ext = name.slice(name.lastIndexOf("."));
      if (!REWRITABLE.has(ext)) continue;
      const before = readFileSync(p, "utf8");
      const after = rewrite(before);
      if (after !== before) {
        writeFileSync(p, after);
        rewritten.push(p.slice(ROOT.length + 1));
      }
      checked.push(p.slice(ROOT.length + 1));
    }
  }
}
console.log(`rewrote ${rewritten.length} files, checked ${checked.length}`);

// --- leftover prefix check ----------------------------------------------

const leftovers = [];
for (const rel of checked) {
  const content = readFileSync(join(ROOT, rel), "utf8");
  // strip the mirror host's own URLs (host + path, plain and JSON-escaped)
  // before scanning for leftovers
  const scrubbed = content
    .split(`${MIRROR_HOST}/valsync-website`)
    .join("")
    .split(`${MIRROR_HOST}\\/valsync-website`)
    .join("");
  if (scrubbed.includes("/valsync-website")) {
    leftovers.push(rel);
  }
}
if (leftovers.length) {
  fail(`/valsync-website prefix still present in:\n  ${leftovers.join("\n  ")}`);
}

// --- junk cleanup ---------------------------------------------------------

const removed = [];
for (const entry of JUNK) {
  const p = join(ROOT, entry);
  if (!existsSync(p)) continue;
  if (statSync(p).isDirectory()) {
    const children = readdirSync(p);
    if (!children.length || children.every((c) => c.startsWith("__next."))) {
      rmSync(p, { recursive: true, force: true });
      removed.push(entry);
    } else {
      console.warn(`  warn: not removing ${entry}/ (contains non-junk files)`);
    }
  } else if (entry.endsWith(".txt") || entry.startsWith("_not-found.txt")) {
    rmSync(p, { force: true });
    removed.push(entry);
  }
}
for (const name of readdirSync(ROOT)) {
  if (name.startsWith("__next.")) {
    rmSync(join(ROOT, name), { force: true });
    removed.push(name);
  }
}
if (removed.length) console.log(`removed ${removed.length} stale diagnostic files:\n  ${removed.join("\n  ")}`);

console.log("\nsync-mirror: OK — mirror is dual-host safe (root domain + /valsync-website)");
