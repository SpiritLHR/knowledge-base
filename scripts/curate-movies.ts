/**
 * Weekly movie recommendation curation via DeepSeek + TMDb.
 * Runs in GitHub Actions on schedule.
 */

import fs from "fs";
import path from "path";

// ── Config ──────────────────────────────────────────────
const RECOMMEND_DIR = path.resolve("src/content/movies/recommend");
const MOVIES_DIR = path.resolve("src/content/movies");
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const TMDB_KEY = process.env.TMDB_API_KEY;
const DEEPSEEK_MODEL = "deepseek-chat";
const MAX_RECOMMEND = 12;
const ROTATE_MAX = 4;

// ── Types ───────────────────────────────────────────────
interface MovieMeta {
  id: string; title: string; originalTitle: string;
  year: number; director: string; country: string;
  genre: string[]; rating: number; poster: string;
}

interface CurationResult {
  keep: string[]; remove: string[];
  add: { title: string; originalTitle: string; year: number;
    director: string; country: string; genre: string[];
    rating: number; reason: string; }[];
}

// ── Frontmatter parser ──────────────────────────────────
function parseFrontmatter(raw: string): Record<string, any> | null {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const data: Record<string, any> = {};
  const lines = m[1].split("\n");
  let inArray = false, arrayKey = "", arrayVals: string[] = [];

  for (const line of lines) {
    if (inArray) {
      const item = line.match(/^\s*-\s+(.+)/);
      if (item) { arrayVals.push(item[1].trim()); continue; }
      data[arrayKey] = arrayVals; inArray = false; arrayVals = [];
    }
    const kv = line.match(/^(\w+):\s*(.*)/);
    if (!kv) continue;
    const key = kv[1], val = kv[2].trim();
    if (val === "") { inArray = true; arrayKey = key; arrayVals = []; }
    else if (val.startsWith("[") && val.endsWith("]")) {
      data[key] = val.slice(1, -1).split(",").map(s => s.trim().replace(/^"(.*)"$/, "$1")).filter(Boolean);
    } else {
      const num = Number(val);
      data[key] = isNaN(num) ? val.replace(/^"(.*)"$/, "$1") : num;
    }
  }
  if (inArray) data[arrayKey] = arrayVals;
  return data;
}

function readMovie(filePath: string): MovieMeta | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = parseFrontmatter(raw);
    if (!data || !data.title) return null;
    return {
      id: path.relative(MOVIES_DIR, filePath).replace(/\\/g, "/").replace(/\.md$/, ""),
      title: data.title, originalTitle: data.originalTitle || "",
      year: data.year || 0, director: data.director || "",
      country: data.country || "",
      genre: Array.isArray(data.genre) ? data.genre : [data.genre].filter(Boolean),
      rating: data.rating || 0, poster: data.poster || "",
    };
  } catch { return null; }
}

function getRecommendations(): MovieMeta[] {
  if (!fs.existsSync(RECOMMEND_DIR)) return [];
  return fs.readdirSync(RECOMMEND_DIR)
    .filter(f => f.endsWith(".md"))
    .map(f => readMovie(path.join(RECOMMEND_DIR, f)))
    .filter((m): m is MovieMeta => m !== null);
}

function getLibrary(): MovieMeta[] {
  const result: MovieMeta[] = [];
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== "recommend") walk(full); }
      else if (entry.name.endsWith(".md")) { const m = readMovie(full); if (m) result.push(m); }
    }
  }
  walk(MOVIES_DIR);
  return result;
}

// ── TMDb API ────────────────────────────────────────────
async function searchTMDB(title: string, year: number): Promise<string | null> {
  if (!TMDB_KEY) return null;

  // Normalize: strip year if embedded in title (e.g. "Movie (2020)")
  const cleanTitle = title.replace(/\s*\(\d{4}\)\s*$/, "").trim();

  const queries = [
    `${cleanTitle}`,           // just the title
    `${cleanTitle} ${year}`,   // title + year
  ];

  for (const query of queries) {
    try {
      const q = encodeURIComponent(query);
      // Try with year filter first, then without
      for (const yearFilter of [year, 0]) {
        const yearParam = yearFilter > 0 ? `&year=${yearFilter}` : "";
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${q}${yearParam}&language=zh-CN`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const json: any = await res.json();
        if (json.results?.length > 0) {
          for (const r of json.results) {
            if (r.poster_path) return r.poster_path;
          }
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

// ── DeepSeek API ────────────────────────────────────────
async function callDeepSeek(system: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL, max_tokens: 4096, temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}: ${await res.text()}`);
  const json: any = await res.json();
  if (json.error) throw new Error(`DeepSeek error: ${JSON.stringify(json.error)}`);
  if (!json.choices?.[0]?.message?.content)
    throw new Error(`DeepSeek format: ${JSON.stringify(json).slice(0, 500)}`);
  return json.choices[0].message.content;
}

// ── Write movie file ────────────────────────────────────
function writeMovieFile(
  movie: CurationResult["add"][0],
  posterPath: string | null,
) {
  fs.mkdirSync(RECOMMEND_DIR, { recursive: true });
  const slug = movie.title
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  const genreStr = movie.genre.join(", ");
  const poster = posterPath ? `https://image.tmdb.org/t/p/w342${posterPath}` : "";

  const content = `---
title: "${movie.title}"
originalTitle: "${movie.originalTitle}"
year: ${movie.year}
director: "${movie.director}"
country: "${movie.country}"
genre: [${genreStr}]
rating: ${movie.rating}
popularity: 85
poster: ${poster}
backdrop: ${poster.replace("/w342/", "/w1280/")}
watchLinks:
  - mini4k
  - ddys
date: ${date}
---

${movie.reason}
`;
  const filePath = path.join(RECOMMEND_DIR, `${slug}.md`);
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`  + 新增: ${movie.title} (${slug}.md) poster=${posterPath || "无"}`);
}

// ── Fix poster in a single file ──────────────────────────
async function fixPoster(filePath: string): Promise<boolean> {
  const movie = readMovie(filePath);
  if (!movie) return false;

  // Try original title first, then Chinese title as fallback
  const searchTitles = [movie.originalTitle, movie.title].filter(Boolean);
  console.log(`  🔍 ${movie.title}...`);

  for (const t of searchTitles) {
    const posterPath = await searchTMDB(t, movie.year);
    if (posterPath) {
      let raw = fs.readFileSync(filePath, "utf-8");
      const newPosterUrl = `https://image.tmdb.org/t/p/w342${posterPath}`;
      raw = raw.replace(/^poster:\s*.*$/m, `poster: ${newPosterUrl}`);
      raw = raw.replace(/^backdrop:\s*.*$/m, `backdrop: ${newPosterUrl.replace("/w342/", "/w1280/")}`);
      fs.writeFileSync(filePath, raw, "utf-8");
      console.log(`    ✓ ${posterPath}`);
      return true;
    }
  }
  console.log(`    ✗ 未找到海报`);
  return false;
}

// ── Fix all posters ──────────────────────────────────────
async function fixAllPosters() {
  if (!TMDB_KEY) { console.log("(无 TMDB_API_KEY，跳過海報修復)\n"); return; }

  console.log("修复海报...");
  const files = fs.existsSync(RECOMMEND_DIR)
    ? fs.readdirSync(RECOMMEND_DIR).filter(f => f.endsWith(".md"))
    : [];
  let fixed = 0;
  for (const f of files) {
    const changed = await fixPoster(path.join(RECOMMEND_DIR, f));
    if (changed) fixed++;
  }
  if (fixed === 0) console.log("  所有海报正常");
  console.log();
}

// ── Main ────────────────────────────────────────────────
async function main() {
  console.log("=== 电影推荐策展 ===\n");

  if (!DEEPSEEK_KEY) { console.error("缺少 DEEPSEEK_API_KEY"); process.exit(1); }

  const recommendations = getRecommendations();
  const library = getLibrary();

  console.log(`当前推荐: ${recommendations.length} 部`);
  console.log(`片库总计: ${library.length} 部\n`);

  const recSummary = recommendations.map(r => ({
    id: r.id, title: r.title, director: r.director,
    year: r.year, country: r.country, genre: r.genre, rating: r.rating,
  }));
  const libSummary = library.map(m => ({
    title: m.title, director: m.director, year: m.year,
  }));
  const today = new Date().toISOString().slice(0, 10);

  const system = `你是一位专业的电影策展人，为一个中文个人博客的"本周推荐"栏目挑选电影。你拥有丰富的世界电影知识。

策展原则：
1. 多样性优先：类型、导演、国家、年代要分散
2. 不要只推好莱坞——亚洲、欧洲、拉美电影至少占40%
3. 每部推荐评分必须在8.0以上（豆瓣或IMDb）
4. 每次轮换不超过${ROTATE_MAX}部，保持连续性
5. 不要推荐片库里已有的电影
6. 尽量推荐经典电影而非仅限新片，确保每部都是影史重量级作品`;

  const prompt = `日期：${today}

## 当前推荐（${recommendations.length} 部）
${JSON.stringify(recSummary, null, 2)}

## 片库已有（${library.length} 部，不可重复推荐）
${JSON.stringify(libSummary, null, 2)}

## 任务
审查当前推荐列表，轮换至多 ${ROTATE_MAX} 部。返回严格 JSON（不要其他文字）：

{
  "keep": ["保留的电影id"],
  "remove": ["移除的电影id"],
  "add": [
    {
      "title": "中文片名",
      "originalTitle": "原名",
      "year": 2023,
      "director": "导演",
      "country": "国家",
      "genre": ["类型"],
      "rating": 8.5,
      "reason": "2-3句中文推荐理由"
    }
  ]
}

没有变更就返回空数组。`;

  console.log("调用 DeepSeek API...");
  const text = await callDeepSeek(system, prompt);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) { console.error("无法解析 DeepSeek 返回:", text); process.exit(1); }

  let result: CurationResult;
  try { result = JSON.parse(jsonMatch[0]); } catch (e) {
    console.error("JSON 解析失败:", text); process.exit(1);
  }

  if (!result.keep) result.keep = [];
  if (!result.remove) result.remove = [];
  if (!result.add) result.add = [];

  if (result.remove.length > ROTATE_MAX) result.remove = result.remove.slice(0, ROTATE_MAX);
  if (result.add.length > ROTATE_MAX) result.add = result.add.slice(0, ROTATE_MAX);

  // Execute removals
  for (const id of result.remove) {
    const basename = id.split("/").pop()!;
    const filePath = path.join(RECOMMEND_DIR, `${basename}.md`);
    if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); console.log(`  - 移除: ${id}`); }
  }

  // Execute additions with TMDb poster lookup
  const libTitles = new Set(library.map(m => m.title));
  const recTitles = new Set(getRecommendations().map(m => m.title));

  for (const movie of result.add) {
    if (libTitles.has(movie.title)) { console.log(`  ! 跳过（片库）: ${movie.title}`); continue; }
    if (recTitles.has(movie.title)) { console.log(`  ! 跳过（已推荐）: ${movie.title}`); continue; }

    // Search TMDb for poster
    const searchTitle = movie.originalTitle || movie.title;
    const posterPath = await searchTMDB(searchTitle, movie.year);
    writeMovieFile(movie, posterPath);
  }

  // Fix posters for ALL existing files
  await fixAllPosters();

  const final = getRecommendations();
  console.log(`\n完成。推荐 ${final.length} 部:`);
  final.forEach(m => console.log(`  - ${m.title} (${m.director}, ${m.year})`));

  const summaryAdd = result.add.map(a => a.title).join("、") || "无";
  const summaryRm = result.remove.map(id => {
    const r = recommendations.find(r => r.id === id);
    return r ? r.title : id;
  }).join("、") || "无";
  console.log(`\n变更摘要: +${summaryAdd} / -${summaryRm}`);
}

main().catch(err => { console.error(err); process.exit(1); });
