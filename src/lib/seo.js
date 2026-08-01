import { useEffect } from "react";

const SITE_NAME = "IZIGO";
const SITE_URL = "https://izigo.az";
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/izigo-hero.webp`;

function setMeta(attr, key, content) {
  if (!content) return;
  let tag = document.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(href) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

/**
 * Sets the document title, meta description, Open Graph tags and canonical
 * URL for the current page. Runs client-side only (no SSR) — lightweight,
 * no new dependency, safe to call from any page component.
 */
export function useSeo({ title, description, path = "", image = DEFAULT_OG_IMAGE }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Easy Go Azerbaijan`;
    const url = `${SITE_URL}${path}`;

    document.title = fullTitle;
    setMeta("name", "description", description);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", image);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
    setCanonical(url);
  }, [title, description, path, image]);
}
