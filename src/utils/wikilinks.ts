const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function processWikilinks(markdown: string, slugMap: Map<string, string>): string {
  return markdown.replace(WIKILINK_RE, (_, term: string, label: string) => {
    const slug = term.trim();
    const display = (label || slug).trim();

    let resolved = slugMap.get(slug);
    if (!resolved) {
      for (const [key, value] of slugMap) {
        if (key.endsWith("/" + slug) || key === slug) {
          resolved = value;
          break;
        }
      }
    }

    const href = resolved || slug;
    return `<a href="${import.meta.env.BASE_URL}/articles/${href}" class="wikilink">${display}</a>`;
  });
}

export function buildSlugMap(slugs: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const slug of slugs) {
    map.set(slug, slug);
    const parts = slug.split("/");
    const filename = parts[parts.length - 1];
    if (!map.has(filename)) {
      map.set(filename, slug);
    }
    if (parts.length >= 2) {
      const dirFile = parts.slice(-2).join("/");
      if (!map.has(dirFile)) {
        map.set(dirFile, slug);
      }
    }
  }
  return map;
}

export function extractOutlinks(content: string): string[] {
  const links = new Set<string>();
  let match: RegExpExecArray | null;
  const re = new RegExp(WIKILINK_RE.source, "g");
  while ((match = re.exec(content)) !== null) {
    links.add(match[1].trim());
  }
  return Array.from(links);
}
