# 米奇妙妙屋 — 使用指南

## 目录结构

```
src/content/           # 所有文章存放在这里
├── tech/              # 技术类
│   ├── programming/   #   编程语言
│   ├── tools/         #   工具配置
│   └── ops/           #   系统运维
├── life/              # 生活类
│   ├── reading/       #   读书笔记
│   └── thoughts/      #   日常随想
└── projects/          # 项目类
```

## 创建新文章

在对应目录下新建 `.md` 文件，格式如下：

```markdown
---
title: 文章标题
date: 2026-05-06
tags: [标签1, 标签2]
description: 简短摘要（可选）
---

正文内容，使用标准 Markdown 语法。
```

**规则：**
- 文件名用英文加连字符，如 `my-new-post.md`
- `date` 格式为 `YYYY-MM-DD`
- `tags` 是中括号数组，支持中文

## 双链引用

在正文中用 `[[路径|显示文字]]` 链接到其他文章：

```markdown
详见 [[tech/tools/git-cheatsheet|Git 速查笔记]]。
```

**写法规则：**
- 写完整路径：`tech/tools/git-cheatsheet`
- 用 `|` 分隔路径和显示文字
- 系统会自动生成反向链接和知识图谱

## 常用命令

```bash
# 安装依赖（首次）
npm install

# 启动本地开发服务器
npm run dev
# 浏览器打开 http://localhost:4321/knowledge-base

# 构建生产版本
npm run build
# 输出在 dist/ 目录

# 预览构建结果
npm run preview
```

## 部署到 GitHub Pages

1. 在 GitHub 创建仓库（如 `liuhongru.github.io`）
2. 修改 `astro.config.mjs` 中的 `site` 和 `base`：
   ```js
   site: "https://你的用户名.github.io",
   base: "/你的仓库名",
   ```
3. 推送代码到 GitHub：
   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```
4. GitHub Actions 自动构建部署（`.github/workflows/deploy.yml`）

## 自定义

- **颜色主题**：修改 `src/styles/global.css` 中的 CSS 变量
- **站点名称**：修改 `src/components/Sidebar.astro` 中的标题
- **布局**：修改 `src/layouts/BaseLayout.astro`
