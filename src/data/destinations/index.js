/* Auto-registers every destination content file in this folder — adding a
   new destination is just "create src/data/destinations/<slug>.js"; nothing
   here or in routing needs to change. Keyed by filename (the URL slug used
   in /destinations/:slug), matched against azerbaijanDestinations.js
   (the single source of truth for which slugs are actually valid cities). */
const modules = import.meta.glob("./*.js", { eager: true });

export const DESTINATION_CONTENT = Object.fromEntries(
  Object.entries(modules)
    .filter(([path]) => !path.endsWith("/index.js"))
    .map(([path, mod]) => [path.replace("./", "").replace(".js", ""), mod.default]),
);

/** Resolves a destination's article content for the given language, falling
 *  back to Azerbaijani (and then English) when a language isn't translated
 *  yet — mirrors the fallback behavior of the interface translations. */
export function getDestinationContent(slug, language) {
  const entry = DESTINATION_CONTENT[slug];
  if (!entry) return null;
  return entry[language] || entry.az || entry.en || null;
}
