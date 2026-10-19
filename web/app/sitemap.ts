import type { MetadataRoute } from "next";

// Static export: emitted once at build time as out/sitemap.xml. URLs use the
// flat .html form the mirror actually serves and the pages canonicalize to;
// the home entry drops the trailing slash because Next emits its canonical without one.
export const dynamic = "force-static";

const SITE_URL = "https://www.valsync.website/";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE_URL.slice(0, -1), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}mobile.html`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}privacy.html`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}delete-account.html`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}terms.html`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
