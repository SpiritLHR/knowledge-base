---
title: Linux 小技巧
date: 2026-03-28
tags: [linux, 运维, 效率]
description: 日常使用 Linux 时积累的实用技巧和命令
---

在日常运维和开发中积累的一些 Linux 实用技巧。

## 文件查找

```bash
find . -name "*.log" -mtime -7    # 近7天修改的日志
grep -r "TODO" src/               # 递归搜索代码中的 TODO
```

## 进程管理

```bash
ps aux | grep nginx
kill -9 $(lsof -t -i:3000)       # 释放端口
htop                               # 交互式进程查看
```

## 磁盘和网络

```bash
df -h                              # 磁盘使用
nc -zv localhost 8080              # 检查端口
```

## Shell 技巧

```bash
!!                                 # 重复上一条命令
!$                                 # 引用上一条命令的最后一个参数
Ctrl+R                             # 搜索历史命令
```

很多时候写 [[tech/programming/python-intro|Python]] 脚本需要部署到 Linux 服务器上，这些命令就派上用场了。而管理代码版本离不开 [[tech/tools/git-cheatsheet|Git]]。

关于如何把静态博客部署到 GitHub Pages 上，我在 [[projects/how-this-blog-was-built|搭建过程]] 中写了详细步骤。
