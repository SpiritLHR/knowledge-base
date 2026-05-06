import { useState, useMemo, useRef, useEffect } from "react";
import Fuse from "fuse.js";

interface SearchItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

interface Props {
  articles: SearchItem[];
}

export default function Search({ articles }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(articles, {
        keys: ["title", "description", "tags", "category"],
        threshold: 0.3,
        includeScore: true,
      }),
    [articles]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query.trim()).slice(0, 10);
  }, [query, fuse]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        type="text"
        className="search-input"
        placeholder="搜索文章..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="search-results">
          {results.map(({ item }) => (
            <a
              key={item.slug}
              href={`${import.meta.env.BASE_URL}/articles/${item.slug}`}
              className="search-result-item"
              style={{ display: "block", textDecoration: "none", color: "inherit" }}
              onClick={() => setOpen(false)}
            >
              <div className="search-result-title">{item.title}</div>
              <div className="search-result-meta">
                {item.category} {item.tags.length > 0 && `· ${item.tags.slice(0, 3).join(", ")}`}
              </div>
            </a>
          ))}
        </div>
      )}
      {open && query && results.length === 0 && (
        <div className="search-results">
          <div className="search-result-item" style={{ cursor: "default" }}>
            <div className="search-result-meta">未找到匹配文章</div>
          </div>
        </div>
      )}
    </div>
  );
}
