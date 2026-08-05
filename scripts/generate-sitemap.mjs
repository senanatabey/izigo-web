// Regenerates public/sitemap.xml — static routes + every published Travel
// Guide and Place from the CMS. Runs as a `prebuild` step (see package.json)
// so the sitemap deployed alongside the site is never stale, without
// needing a server or SSR. Fails soft: if Supabase isn't reachable (e.g. a
// local build with no env vars configured), it keeps the existing
// public/sitemap.xml untouched rather than breaking the build.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITE_URL = "https://izigo.az";
const OUT_PATH = resolve(ROOT, "public/sitemap.xml");

function loadEnv() {
  const envPath = resolve(ROOT, ".env");
  const env = { ...process.env };
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
      const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
      if (match && !(match[1] in env)) env[match[1]] = (match[2] || "").trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const STATIC_URLS = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/villas", changefreq: "daily", priority: "0.9" },
  { loc: "/cars", changefreq: "daily", priority: "0.8" },
  { loc: "/transfers", changefreq: "daily", priority: "0.8" },
  { loc: "/events", changefreq: "daily", priority: "0.6" },
  { loc: "/deals", changefreq: "daily", priority: "0.6" },
  { loc: "/concierge", changefreq: "weekly", priority: "0.6" },
  { loc: "/destinations", changefreq: "weekly", priority: "0.7" },
  { loc: "/places", changefreq: "weekly", priority: "0.7" },
];

// The three destinations that always have a guide, even before any CMS
// content exists (see src/data/destinations/*.js — Stage 1's static fallback).
const FALLBACK_GUIDE_SLUGS = ["baku", "gabala", "guba"];

function buildXml(urls) {
  const body = urls.map(({ loc, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

async function fetchCmsSlugs(env, table) {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) return [];
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=slug&status=eq.published`, {
    headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.map((r) => r.slug);
}

async function main() {
  const env = loadEnv();
  const urls = [...STATIC_URLS];
  const seenGuideSlugs = new Set(FALLBACK_GUIDE_SLUGS);
  FALLBACK_GUIDE_SLUGS.forEach((slug) => urls.push({ loc: `/destinations/${slug}`, changefreq: "weekly", priority: "0.8" }));

  try {
    const [guideSlugs, placeSlugs] = await Promise.all([
      fetchCmsSlugs(env, "cms_travel_guides"),
      fetchCmsSlugs(env, "cms_places"),
    ]);
    for (const slug of guideSlugs) {
      if (seenGuideSlugs.has(slug)) continue;
      seenGuideSlugs.add(slug);
      urls.push({ loc: `/destinations/${slug}`, changefreq: "weekly", priority: "0.8" });
    }
    for (const slug of placeSlugs) {
      urls.push({ loc: `/places/${slug}`, changefreq: "weekly", priority: "0.6" });
    }
    console.log(`[sitemap] ${guideSlugs.length} CMS guide(s), ${placeSlugs.length} CMS place(s) fetched.`);
  } catch (err) {
    console.warn("[sitemap] Could not fetch CMS content (this is fine for a local build without Supabase env vars):", err.message);
  }

  writeFileSync(OUT_PATH, buildXml(urls));
  console.log(`[sitemap] Wrote ${urls.length} URLs to public/sitemap.xml`);
}

main();
