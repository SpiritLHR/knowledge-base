// Site search URL templates for movie watch links.
// {title} will be replaced with the URL-encoded movie title.
// Add new sites here; both the movie list and detail pages will pick them up.

export interface SiteTemplate {
  name: string;
  searchUrl: string;
}

export const SITE_TEMPLATES: Record<string, SiteTemplate> = {
  mini4k: { name: "mini4k", searchUrl: "https://www.mini4k.net/?s={title}" },
  ddys: { name: "低端影视", searchUrl: "https://ddys.tv/?s={title}" },
};

export function buildWatchUrl(movieTitle: string, siteKey: string): { name: string; url: string } | null {
  const tpl = SITE_TEMPLATES[siteKey];
  if (!tpl) return null;
  return {
    name: tpl.name,
    url: tpl.searchUrl.replace("{title}", encodeURIComponent(movieTitle)),
  };
}

export function buildWatchUrls(movieTitle: string, siteKeys: string[]) {
  return siteKeys.map((key) => buildWatchUrl(movieTitle, key)).filter(Boolean);
}
