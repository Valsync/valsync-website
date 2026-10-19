#!/usr/bin/env node
/**
 * seo-check.mjs — check the live VALSYNC site's SEO and hosting setup.
 *
 *   npm run seo-check
 *
 * Uses cache-busted HTML requests and reports each check without deploying.
 * Exits with status 1 if any check fails.
 */
const BASE = "https://www.valsync.website";
const STAMP = Date.now();
const REDIRECTS = new Set([301, 302, 307, 308]);
let passed = 0;
let total = 0;

function errorMessage(error) {
  return [error.message, error.cause?.message].filter(Boolean).join(": ").replace(/\s+/g, " ");
}

async function request(url, html = false) {
  const target = new URL(url);
  if (html) target.searchParams.set("seocheck", String(STAMP));
  return fetch(target, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
}

async function check(label, hint, run) {
  total++;
  try {
    const detail = await run();
    passed++;
    console.log(`PASS ${label} — ${detail}`);
  } catch (error) {
    console.log(`FAIL ${label} — ${errorMessage(error)}`);
    console.log(`  Hint: ${hint}`);
  }
}

function requireStatus(response) {
  if (response.status !== 200) throw new Error(`Expected HTTP 200, got ${response.status}`);
}

for (const path of ["/", "/privacy.html", "/terms.html", "/mobile.html"]) {
  const canonical = path === "/" ? BASE : `${BASE}${path}`;
  await check(`${BASE}${path} canonical`, "Rebuild, sync the mirror, and deploy with the page's own canonical URL.", async () => {
    const response = await request(`${BASE}${path}`, true);
    requireStatus(response);
    const html = await response.text();
    const links = html.match(/<link\b[^>]*>/gi) ?? [];
    const canonicals = links.flatMap((link) => {
      const rel = link.match(/\brel\s*=\s*(["'])(.*?)\1/i)?.[2];
      if (rel?.toLowerCase() !== "canonical") return [];
      return [link.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2]];
    });
    if (canonicals.length !== 1 || canonicals[0] !== canonical) {
      throw new Error(`Expected canonical ${canonical}, got ${canonicals.join(", ") || "none"}`);
    }
    return "HTTP 200; canonical matches";
  });
}

await check(`${BASE}/sitemap.xml`, "Generate sitemap.xml, sync the mirror, and redeploy.", async () => {
  const response = await request(`${BASE}/sitemap.xml`);
  requireStatus(response);
  if (!(await response.text()).includes("<urlset")) throw new Error("Missing <urlset in sitemap");
  return "HTTP 200; <urlset present";
});

await check(`${BASE}/robots.txt`, "Publish robots.txt with Sitemap: https://www.valsync.website/sitemap.xml.", async () => {
  const response = await request(`${BASE}/robots.txt`);
  requireStatus(response);
  if (!(await response.text()).includes(`Sitemap: ${BASE}/sitemap.xml`)) {
    throw new Error("Missing canonical Sitemap directive");
  }
  return "HTTP 200; Sitemap directive matches";
});

await check(`${BASE}/og-image.png`, "Publish og-image.png in the root mirror with image/png content-type.", async () => {
  const response = await request(`${BASE}/og-image.png`);
  requireStatus(response);
  const type = response.headers.get("content-type") ?? "";
  await response.body?.cancel();
  if (!type.startsWith("image/png")) throw new Error(`Expected image/png, got ${type || "no content-type"}`);
  return "HTTP 200; image/png";
});

for (const url of ["http://www.valsync.website/", "http://valsync.website/", "https://valsync.website/"]) {
  const hint = url === "http://www.valsync.website/"
    ? "Deploy to the https://www.valsync.website Surge target to enforce HTTPS."
    : "Configure apex DNS, TLS, and a redirect to https://www.valsync.website.";
  await check(`${url} redirect`, hint, async () => {
    const response = await request(url, true);
    const location = response.headers.get("location") ?? "";
    await response.body?.cancel();
    if (!REDIRECTS.has(response.status) || !location.startsWith(BASE)) {
      throw new Error(`Expected redirect to ${BASE}, got HTTP ${response.status}, Location: ${location || "none"}`);
    }
    return `HTTP ${response.status}; Location: ${location}`;
  });
}

await check("https://valsync.surge.sh/ duplicate host", "Run surge teardown valsync.surge.sh.", async () => {
  let response;
  let html;
  try {
    response = await request("https://valsync.surge.sh/", true);
    if (response.status === 404) {
      await response.body?.cancel();
      return "HTTP 404";
    }
    html = await response.text();
  } catch (error) {
    return `Unreachable: ${errorMessage(error)}`;
  }
  if (html.includes('canonical" href="https://valsync.surge.sh')) {
    throw new Error("Old Surge host still advertises its own canonical URL");
  }
  return `HTTP ${response.status}; no old-host canonical`;
});

console.log(`\n${passed}/${total} checks passed`);
process.exitCode = passed === total ? 0 : 1;
