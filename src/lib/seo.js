import { useEffect } from "react";
import { LANGUAGES } from "../i18n/translations";

const SITE_NAME = "IZIGO";
const SITE_URL = "https://izigo.az";
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/izigo-hero.webp`;
const DEFAULT_TITLE = "IZIGO – Azerbaijan Villas, Cars & Transfers";
const DEFAULT_DESCRIPTION = "Talk directly with local hosts and explore Azerbaijan like a local. No booking fees, direct WhatsApp contact.";

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
 * hreflang scaffolding for the current language list. IZIGO doesn't have
 * locale-prefixed URLs yet (language is a client-side toggle, not part of
 * the route), so every alternate currently points at the same canonical
 * URL — that's intentionally honest, not a placeholder to "fix" blindly.
 * Once locale-prefixed routes exist (e.g. /ar/villas), swap `url` below
 * for the real per-locale URL — nothing else about this wiring changes.
 */
function setHreflangTags(languageCodes, url) {
  document.querySelectorAll('link[rel="alternate"][data-hreflang]').forEach((el) => el.remove());
  const codes = [...languageCodes, "x-default"];
  codes.forEach((code) => {
    const link = document.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", code);
    link.setAttribute("href", url);
    link.setAttribute("data-hreflang", "true");
    document.head.appendChild(link);
  });
}

/** Replaces this page's JSON-LD structured data (schema.org). Pass a single
 *  object or an array of objects; omit/null to clear (e.g. a 404 page). */
function setStructuredData(data) {
  document.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());
  if (!data) return;
  const items = Array.isArray(data) ? data : [data];
  items.forEach((item) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-jsonld", "true");
    script.textContent = JSON.stringify(item);
    document.head.appendChild(script);
  });
}

/**
 * Sets the document title, meta description, Open Graph tags, Twitter Card
 * tags, canonical URL and (optionally) JSON-LD structured data for the
 * current page. Runs client-side only (no SSR) — lightweight, no new
 * dependency, safe to call from any page component.
 */
export function useSeo({ title, titleOverride, description, path = "", image = DEFAULT_OG_IMAGE, ogType = "website", structuredData = null }) {
  useEffect(() => {
    const fullTitle = titleOverride || (title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE);
    const fullDescription = description || DEFAULT_DESCRIPTION;
    const url = `${SITE_URL}${path}`;

    document.title = fullTitle;
    setMeta("name", "description", fullDescription);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", fullDescription);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", image);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", fullDescription);
    setMeta("name", "twitter:image", image);
    setCanonical(url);
    setHreflangTags(LANGUAGES.map((l) => l.code), url);
    setStructuredData(structuredData);
  }, [title, titleOverride, description, path, image, ogType, structuredData]);
}

/** Builders for the schema.org types this site actually uses — keeps the
 *  JSON-LD shape correct and consistent instead of hand-rolling it per page. */
export const schema = {
  organization: () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logos/logo-navbar.png`,
  }),
  touristDestination: ({ name, description, url, image }) => ({
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name,
    description,
    url,
    image,
  }),
  touristAttraction: ({ name, description, url, image, city }) => ({
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name,
    description,
    url,
    image,
    address: city ? { "@type": "PostalAddress", addressLocality: city, addressCountry: "AZ" } : undefined,
  }),
  product: ({ name, description, url, image, price, currency = "AZN" }) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url,
    image,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
    },
  }),
  faqPage: (items) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  }),
  breadcrumb: (items) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, url }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: url,
    })),
  }),
};
