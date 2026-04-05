# MIC.BEST — 项目概述

> AI-Powered Hardware Prototype Design Platform

---

## 一、产品愿景

**MIC.BEST**（Made in China Blueprint）是新一代 AI 硬件原型设计平台，用户用自然语言描述想法，AI 在数秒内生成完整、可采购、可组装的硬件原型。

**核心差异化**：
- 默认对接**中国供应链**（LCSC + JLCPCB + 嘉立创EDA），成本更低、交付更快
- 中文优先，本土化体验
- AI 生成质量对标国际一流，同时价格只有 Blueprint 的 30%

---

## 二、竞品分析

| 平台 | 供应链 | 语言 | AI生成 | 成本 |
|------|--------|------|--------|------|
| Blueprint.am | Digi-Key/Mouser | 英文 | ✅ | 高 |
| Tinkercad | 无 | 英文 | ❌ | 免费但弱 |
| **MIC.BEST** | LCSC/JLCPCB/嘉立创 | 中文优先 | ✅ | 低 |

---

## 三、产品功能

### 3.1 用户旅程

```
访问首页 → 注册/登录 → 输入设计需求 → AI 生成 → 探索6个视图 → 修改完善 → 导出采购
```

### 3.2 6 大核心视图

| 视图 | 功能 | 技术 |
|------|------|------|
| **INFO** | 项目信息 + 成本汇总 | React |
| **BOM** | 物料清单，支持筛选/导出 | React + Supabase |
| **WIRING** | 接线图（节点类型化） | React Flow |
| **MECH** | 3D 爆炸装配图 | Three.js (R3F) |
| **INSTRUCTIONS** | 分步装配指南 | React |
| **PART** | 单零件 3D 查看器 | Three.js |

### 3.3 AI 对话

- 自然语言输入 → 结构化项目输出
- 支持增量修改（"加上OLED屏幕"）
- 零件选型基于供应链实时库存

---

## 四、技术架构

详见 `docs/TECH-ARCH-v2.0.md`

```
用户浏览器 → Next.js 15 → FastAPI (Python) → LangGraph Agent
                                              ↓
                        通义千问/DeepSeek + LCSC/JLCPCB API
                                              ↓
                                      Supabase + Redis
```

### 前端
- Next.js 15 (App Router, RSC)
- Tailwind CSS + shadcn/ui
- Three.js + React Three Fiber
- React Flow
- Zustand 状态管理

### 后端
- FastAPI (Python 3.12+)
- Go API Gateway
- LangGraph Agent Orchestrator

### 数据层
- Supabase (PostgreSQL + Auth + Realtime)
- Redis (积分/缓存)
- S3/R2 (文件存储)

### AI
- 通义千问 Qwen-Max（中文理解）
- DeepSeek V3（结构化生成）

### 供应链 API
- LCSC (立创商城) — 零件采购
- JLCPCB — PCB 打样 + SMT
- 嘉立创 EDA — 设计工具

---

## 五、文档地图

| 文档 | 用途 | 优先级 |
|------|------|--------|
| `docs/PRD-v2.0.md` | MIC Blueprint 完整 PRD | ⭐⭐⭐ |
| `docs/TECH-ARCH-v2.0.md` | 技术架构设计 | ⭐⭐⭐ |
| `docs/ARCHITECTURE.md` | Blueprint 克隆架构 | ⭐⭐ |
| `docs/CLONE_PLAN.md` | 克隆执行方案 | ⭐⭐ |
| `docs/FULL_ANALYSIS.md` | Blueprint 功能分析 | ⭐⭐ |
| `docs/PRD.md` | 通用 PRD 参考 | ⭐ |
| `resources/` | 爬虫抓取的 Blueprint 源码 | 参考 |

---

## 六、启动条件

在进入开发之前，需要确认：

- [ ] 确认产品名称：MIC.BEST / 智造蓝图 / 其他？
- [ ] 确认目标用户：Maker / 硬件团队 / 教育 / 全都做？
- [ ] 确认优先级：先做 AI 生成 还是 先做供应链对接？
- [ ] 确认技术选型：Python FastAPI + Go 双后端 还是 纯 Go？
- [ ] 确认 AI 模型：通义千问为主还是 DeepSeek 为主？
- [ ] 确认 LCSC/JLCPCB API 接入可行性

---

## 七、联系方式

- **产品 Owner**：Olly
- **AI 助手**：Happy
- **文档日期**：2026-04-05

---

*项目状态：规划完成，等待启动指令*
