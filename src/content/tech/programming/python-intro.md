---
title: Python 入门笔记
date: 2026-04-15
tags: [python, 编程, 入门]
description: Python 语言的基础语法、数据类型和常用库入门
---

Python 是一门简洁优雅的编程语言，适合快速开发和原型验证。

## 基础语法

Python 使用缩进来定义代码块，这强制了代码的可读性：

```python
def greet(name):
    if name:
        return f"Hello, {name}!"
    return "Hello, world!"
```

## 常用数据结构

- **列表**: 有序可变序列 `[1, 2, 3]`
- **元组**: 有序不可变序列 `(1, 2, 3)`
- **字典**: 键值对映射 `{"key": "value"}`
- **集合**: 无序不重复 `{1, 2, 3}`

## 生态

Python 的强大在于生态。数据科学用 NumPy/Pandas，Web 开发用 Django/FastAPI。关于命令行效率工具，可以参考我的 [[tech/tools/git-cheatsheet|Git 速查笔记]]。

把 Python 部署到服务器上时会涉及很多系统操作，[[tech/ops/linux-tips|Linux 小技巧]]中整理了一些常用命令。

我在 [[projects/how-this-blog-was-built|搭建本博客]] 的过程中也用到了 Python 写自动化脚本。
