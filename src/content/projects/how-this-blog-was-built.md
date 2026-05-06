---
title: 这个博客是怎么建起来的
date: 2026-05-06
tags: [博客, astro, 知识管理, 项目]
description: 记录用 Astro 搭建个人知识库博客的完整过程
---

从零开始构建一个个人博客兼知识库空间。这篇文章记录了整个搭建过程。

## 技术选型

选择了 Astro 作为静态站点生成器，原因：

1. **内容优先**: Markdown 驱动，专注写作
2. **零 JavaScript 默认输出**: 只有交互组件才水合 React
3. **Content Collections**: 内置的类型安全内容管理
4. **灵活的路由**: 支持动态路由，适合双链笔记的 URL 结构

## 核心功能

### 双链笔记

实现了 `[[slug]]` 语法，类似 Obsidian 的 WikiLinks。写文章时可以自由引用其他文章，系统会自动生成：

- 文章间的超链接
- 每篇文章底部的反向链接面板
- 全站知识图谱可视化

### 文件夹 + 标签组织

采用双组织方式：文件夹做粗分类（技术、生活、项目），frontmatter 中的 tags 做细粒度标注。

### 搜索

使用 Fuse.js 实现客户端全文搜索，支持中英文。

## 部署

通过 GitHub Actions 自动构建并部署到 GitHub Pages。每次推送代码到 main 分支即自动上线。

## 相关文章

- 写技术文章时会用到 [[tech/programming/python-intro|Python]] 做示例
- 部署相关操作参考 [[tech/ops/linux-tips|Linux 小技巧]]
- 版本控制使用 [[tech/tools/git-cheatsheet|Git]]
