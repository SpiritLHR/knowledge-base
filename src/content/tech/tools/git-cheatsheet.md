---
title: Git 常用命令速查
date: 2026-04-20
tags: [git, 工具, 效率]
description: 日常开发中最常用的 Git 命令汇总
---

版本控制是软件开发的基石，Git 是最广泛使用的分布式版本控制系统。

## 基础操作

```bash
git init              # 初始化仓库
git status            # 查看状态
git add .             # 暂存所有更改
git commit -m "msg"   # 提交
git log --oneline     # 查看提交历史
```

## 分支管理

```bash
git branch feature    # 创建分支
git checkout -b fix   # 创建并切换
git merge feature     # 合并分支
git rebase main       # 变基
```

## 远程协作

```bash
git remote add origin <url>
git push -u origin main
git pull --rebase
```

这套工作流也用于本博客的开发，详见 [[projects/how-this-blog-was-built|博客搭建记录]]。

## 技巧

- 使用 `git stash` 临时保存改动
- 使用 `.gitignore` 排除不需要追踪的文件
- 写有意义的 commit message

如果你在做 Python 项目，[[tech/programming/python-intro|Python 入门笔记]]中介绍了如何管理 Python 项目的依赖和虚拟环境，可以和 Git 配合使用。
