import type { CollectionEntry } from "astro:content";
import { extractOutlinks } from "./wikilinks";

export interface GraphNode {
  id: string;
  slug: string;
  title: string;
  category: string;
  tags: string[];
  backlinkCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraph(articles: CollectionEntry<"articles">[]): GraphData {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const article of articles) {
    const slug = article.id;
    const parts = slug.split("/");
    const category = parts.length > 1 ? parts[0] : "";

    nodeMap.set(slug, {
      id: slug,
      slug,
      title: article.data.title,
      category,
      tags: article.data.tags || [],
      backlinkCount: 0,
    });
  }

  for (const article of articles) {
    const slug = article.id;
    const outlinks = extractOutlinks(article.body || "");

    for (const target of outlinks) {
      if (nodeMap.has(target)) {
        edges.push({ source: slug, target });
        const targetNode = nodeMap.get(target)!;
        targetNode.backlinkCount++;
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  };
}

export function getBacklinks(
  slug: string,
  articles: CollectionEntry<"articles">[]
): CollectionEntry<"articles">[] {
  return articles.filter((article) => {
    if ((article.id) === slug) return false;
    const outlinks = extractOutlinks(article.body || "");
    return outlinks.includes(slug);
  });
}
