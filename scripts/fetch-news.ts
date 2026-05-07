import Parser from "rss-parser";
import fs from "fs";
import path from "path";

const CONTENT_DIR = path.resolve("src/content/news");
const FEEDS_FILE = path.resolve("scripts/feeds.json");
const MAX_PER_FEED = 20;
const DAYS_BACK = 2;
const TODAY = new Date();
const DATE_STR = TODAY.toISOString().slice(0, 10);

interface FeedConfig {
  name: string;
  url: string;
  category: string;
}

interface NewsItem {
  title: string;
  url: string;
  source: string;
  category: string;
  date: string;
  summary: string;
}

const parser = new Parser({
  timeout: 30000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; KnowledgeBaseBot/1.0)",
  },
});

function truncate(text: string, max: number): string {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max) + "…" : cleaned;
}

function loadExistingUrls(): Set<string> {
  const urls = new Set<string>();
  if (!fs.existsSync(CONTENT_DIR)) return urls;
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const content = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const matches = content.match(/https?:\/\/\S+/g);
    if (matches) {
      for (const url of matches) {
        urls.add(url.replace(/[)\]"']/g, ""));
      }
    }
  }
  return urls;
}

async function fetchFeed(feed: FeedConfig): Promise<NewsItem[]> {
  try {
    const result = await parser.parseURL(feed.url);
    const items: NewsItem[] = [];

    for (const entry of (result.items || []).slice(0, MAX_PER_FEED)) {
      const pubDate = entry.pubDate ? new Date(entry.pubDate) : new Date();
      const daysAgo =
        (TODAY.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysAgo > DAYS_BACK && feed.name !== "GitHub Trending") continue;

      const url = entry.link || entry.guid || "";
      if (!url) continue;

      items.push({
        title: entry.title || "无标题",
        url,
        source: feed.name,
        category: feed.category,
        date: pubDate.toISOString().slice(0, 10),
        summary: truncate(
          entry.contentSnippet || entry.description || entry.content || entry.summary || "",
          200
        ),
      });
    }
    return items;
  } catch (err) {
    console.error(`  [ERROR] ${feed.name}: ${(err as Error).message}`);
    return [];
  }
}

async function main() {
  console.log(`\n=== 新闻抓取 ${DATE_STR} ===\n`);

  const existingUrls = loadExistingUrls();
  console.log(`已有 ${existingUrls.size} 条历史新闻 URL\n`);

  const feeds: FeedConfig[] = JSON.parse(
    fs.readFileSync(FEEDS_FILE, "utf-8")
  );

  const allItems: NewsItem[] = [];
  const seenUrls = new Set<string>(existingUrls);

  for (const feed of feeds) {
    console.log(`抓取: ${feed.name}...`);
    const items = await fetchFeed(feed);
    const newItems = items.filter((item) => {
      if (seenUrls.has(item.url)) return false;
      seenUrls.add(item.url);
      return true;
    });
    console.log(`  ${newItems.length} 条新内容 (共 ${items.length} 条)`);
    allItems.push(...newItems);
  }

  if (allItems.length === 0) {
    console.log("\n没有新内容，跳过生成。\n");
    return;
  }

  allItems.sort((a, b) => b.date.localeCompare(a.date));
  fs.mkdirSync(CONTENT_DIR, { recursive: true });

  const dateItems = allItems.filter((item) => item.date === DATE_STR);
  const olderItems = allItems.filter((item) => item.date !== DATE_STR);

  if (dateItems.length > 0) {
    const filePath = path.join(CONTENT_DIR, `${DATE_STR}.md`);
    writeNewsFile(filePath, DATE_STR, dateItems);
  }

  const olderByDate = new Map<string, NewsItem[]>();
  for (const item of olderItems) {
    const items = olderByDate.get(item.date) || [];
    items.push(item);
    olderByDate.set(item.date, items);
  }
  for (const [date, items] of olderByDate) {
    const filePath = path.join(CONTENT_DIR, `${date}.md`);
    writeNewsFile(filePath, date, items);
  }

  console.log(`\n完成。共保存 ${allItems.length} 条新闻。\n`);
}

function formatEntry(item: NewsItem): string {
  return (
    `### [${item.title}](${item.url})\n` +
    `- **来源**: ${item.source}\n` +
    `- **分类**: ${item.category}\n` +
    `${item.summary ? `- **摘要**: ${item.summary}\n` : ""}` +
    `\n`
  );
}

function parseExistingItems(content: string): { urls: Set<string>; entries: string } {
  const parts = content.split(/^### /m);
  const entries = parts.length > 1 ? "### " + parts.slice(1).join("### ") : "";
  const urls = new Set<string>();
  const urlRe = /\]\((https?:\/\/[^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = urlRe.exec(content)) !== null) {
    urls.add(m[1]);
  }
  return { urls, entries };
}

function writeNewsFile(
  filePath: string,
  date: string,
  items: NewsItem[]
) {
  let existingEntries = "";
  let existingUrls = new Set<string>();
  let existingTags: string[] = [];
  let existingSources: string[] = [];

  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const headerMatch = raw.match(/^---\n([\s\S]*?)\n---/);
    if (headerMatch) {
      const header = headerMatch[1];
      const tagMatch = header.match(/tags:\s*\[([^\]]*)\]/);
      if (tagMatch) {
        existingTags = tagMatch[1].split(",").map((t) => t.trim());
      }
      const srcMatch = header.match(/来源：(.+)/);
      if (srcMatch) {
        existingSources = srcMatch[1].split("、").map((s) => s.trim());
      }
    }
    const parsed = parseExistingItems(raw);
    existingUrls = parsed.urls;
    existingEntries = parsed.entries;
  }

  const trulyNew = items.filter((item) => !existingUrls.has(item.url));

  if (trulyNew.length === 0 && existingEntries.length > 0) return;

  const mergedEntries = trulyNew
    .map(formatEntry)
    .join("") + existingEntries;

  const allCategories = [
    ...new Set([...existingTags, ...trulyNew.map((i) => i.category)]),
  ].filter((t) => t !== "新闻" && t !== "每日快讯");
  const allSources = [
    ...new Set([...existingSources, ...trulyNew.map((i) => i.source)]),
  ];

  const content = `---
title: "每日快讯 — ${date}"
date: ${date}
tags: [新闻, 每日快讯, ${allCategories.join(", ")}]
description: ${date} 新闻汇总，来源：${allSources.join("、")}
---

${mergedEntries}`;

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`  保存: ${path.relative(process.cwd(), filePath)} (${trulyNew.length} 条新增)`);
}

main();
