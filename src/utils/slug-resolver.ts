import type { CollectionEntry } from "astro:content";

let slugMap: Map<string, string> | null = null;

export function buildSlugMap(articles: CollectionEntry<"articles">[]): void {
  slugMap = new Map();
  for (const article of articles) {
    const slug = article.id;
    const parts = slug.split("/");
    const shortName = parts[parts.length - 1];
    const dirName = parts.length > 1 ? parts.slice(-2).join("/") : shortName;

    slugMap.set(slug, slug);

    if (!slugMap.has(shortName)) {
      slugMap.set(shortName, slug);
    }

    if (!slugMap.has(dirName) || dirName.includes("/")) {
      slugMap.set(dirName, slug);
    }
  }
}

export function resolveSlug(term: string): string {
  if (!slugMap) return term;
  return slugMap.get(term) || term;
}

export function matchSlug(term: string, slugs: Set<string>): string | null {
  for (const slug of slugs) {
    if (slug === term) return slug;
    if (slug.endsWith("/" + term)) return slug;
  }
  return null;
}
