# MIC.BEST

> AI-Powered Hardware Prototype Design Platform — China Supply Chain Edition

**产品名称**：MIC Blueprint（智造蓝图）
**Slogan**：中国制造 · 全球智造
**定位**：中国版 Blueprint.am，对接 LCSC + JLCPCB + 嘉立创EDA 供应链

---

## 📁 项目结构

```
mic-best/
├── README.md              ← 你在这里
├── PROJECT.md             ← 项目概述
├── docs/                  ← 所有规划文档
│   ├── PRD-v2.0.md       ← MIC Blueprint 产品需求文档 (中国版)
│   ├── TECH-ARCH-v2.0.md ← MIC Blueprint 技术架构 (中国版)
│   ├── ARCHITECTURE.md   ← Blueprint 克隆架构设计
│   ├── CLONE_PLAN.md     ← Blueprint 克隆方案
│   ├── FULL_ANALYSIS.md  ← Blueprint 功能分析
│   ├── SCRAPED_TABS.md   ← Blueprint 标签页内容
│   └── PRD.md            ← Blueprint PRD (通用版)
├── resources/             ← 爬虫抓取的 Blueprint 源码
│   ├── index-BTMjtkQk.js
│   └── index-D1G_pGpk.css
└── src/                  ← Next.js 代码
    ├── app/              ← App Router 页面
    │   ├── page.tsx      ← 首页
    │   ├── layout.tsx    ← 根布局
    │   ├── globals.css   ← Tailwind + CSS 变量
    │   ├── api/projects/ ← API 路由
    │   └── project/[id]/ ← 项目详情页
    ├── components/       ← React 组件
    │   ├── home/         ← 首页组件
    │   ├── layout/        ← 布局组件
    │   └── project/       ← 项目页组件
    ├── stores/            ← Zustand 状态管理
    ├── lib/              ← 工具函数 + Mock 数据
    ├── types/            ← TypeScript 类型定义
    └── package.json      ← 依赖配置
```

---

## 🚀 快速开始

```bash
cd src
npm install
npm run dev
```

访问 http://localhost:3000

---

## 🔗 核心文档

| 文档 | 说明 |
|------|------|
| `docs/PRD-v2.0.md` | **必读** — MIC Blueprint 完整 PRD，中国供应链版 |
| `docs/TECH-ARCH-v2.0.md` | **必读** — 技术架构，含中国供应链集成 |
| `docs/ARCHITECTURE.md` | 系统架构设计 |
| `docs/CLONE_PLAN.md` | 克隆执行方案 |

---

## 📦 技术栈

**前端**: Next.js 15 + Tailwind CSS + JetBrains Mono + Zustand
**UI组件**: Blueprint Dark Theme (CSS Variables)
**状态管理**: Zustand
**类型**: TypeScript

**待集成**:
- Three.js + React Three Fiber — ✅ 已集成（MechTab 爆炸图、首页背景）
- React Flow — ✅ 已集成（WiringTab）
- Supabase — 🔄 schema 设计完成，API 接入中
- 通义千问 / DeepSeek — 🔄 百炼已接入，DeepSeek 待接入

---

## 🎯 MVP 功能 (Phase 1)

- [x] 项目骨架 + 路由
- [x] Blueprint 暗色主题
- [x] 首页 Hero + 输入框
- [x] 社区项目预览
- [x] 项目详情页 (6 Tab)
- [x] BOM 表格 (筛选/视图切换)
- [x] AI Chat 面板
- [x] Zustand 状态管理
- [x] Mock 数据
- [x] Three.js 3D 背景（首页 PCB 风格动态背景）
- [x] React Flow 接线图（支持拖拽布局自动保存）
- [x] Three.js 爆炸图动画

---

## 👥 团队

- Olly — 产品 Owner
- Happy — AI 助手

---

*最后更新：2026-04-05*
