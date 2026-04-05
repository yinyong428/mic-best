# HardwareForge - 系统架构设计

> 基于 Blueprint.am 克隆项目

---

## 一、技术栈选型

### 前端
| 技术 | 用途 |
|------|------|
| **Next.js 14** (App Router) | 框架 |
| **Tailwind CSS** | 样式系统 |
| **Three.js + React Three Fiber** | 3D 可视化 |
| **React Flow** | 接线图编辑器 |
| **Zustand** | 状态管理 |
| **shadcn/ui** | UI 组件库 |
| **JetBrains Mono** | 字体 |

### 后端
| 技术 | 用途 |
|------|------|
| **Go** | API 服务 |
| **Supabase** (PostgreSQL) | 数据库 + Auth |
| **Redis** | 缓存 + 积分 |
| **Gemini API** | AI 对话 |
| **S3 / R2** | 文件存储 (模型/图片) |

### AI Pipeline
| 技术 | 用途 |
|------|------|
| **Gemini 2.0** | 自然语言理解 → 结构化设计 |
| **LLM Parsing** | 提取零件清单、BOM |
| **Code Generation** | 生成接线逻辑、STL 模型描述 |

---

## 二、系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Next.js)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Home    │  │ Project  │  │  Editor  │  │  Profile │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │             │             │              │
│       └─────────────┴──────┬──────┴─────────────┘              │
│                             │                                   │
│  ┌─────────────────────────┴─────────────────────────┐          │
│  │              状态层 (Zustand Store)               │          │
│  │  projectStore | chatStore | uiStore | userStore   │          │
│  └─────────────────────────┬─────────────────────────┘          │
└────────────────────────────┼────────────────────────────────────┘
                             │

                        REST / WebSocket

┌────────────────────────────┼────────────────────────────────────┐
│                         API Gateway                               │
│                      (Go + Gin)                                  │
└───┬──────────┬───────────┬┴───────────┬──────────┬──────────────┘
    │          │           │            │          │
┌───┴───┐  ┌──┴───┐  ┌───┴───┐  ┌───┴───┐  ┌───┴────┐
│ Auth  │  │Project│  │  AI   │  │  BOM  │  │Parts   │
│ Service│ │Service│  │Service│  │Service│  │Catalog │
└───┬───┘  └──┬───┘  └───┬───┘  └───┬───┘  └───┬────┘
    │          │           │          │           │
┌───┴──────────┴───────────┴──────────┴───────────┴────┐
│                  Supabase (PostgreSQL)                   │
│  users | projects | parts | boms | wiring_diagrams     │
│  instructions | messages | credits                      │
└──────────────────────────┬──────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │    Redis    │
                    │ (积分/缓存)  │
                    └─────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        ┌─────┴─────┐           ┌──────┴──────┐
        │ Gemini API│           │  S3 / R2    │
        │ (AI 对话) │           │(模型/图片)   │
        └───────────┘           └─────────────┘
```

---

## 三、数据模型

### 用户 (users)
```sql
id            UUID PRIMARY KEY
email         TEXT UNIQUE
username      TEXT UNIQUE
avatar_url    TEXT
credits       INTEGER DEFAULT 10
plan          TEXT DEFAULT 'free' -- free | pro
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

### 项目 (projects)
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users
name            TEXT
description     TEXT
status          TEXT DEFAULT 'draft' -- draft | published
total_cost      DECIMAL(10,2)
total_parts     INTEGER
is_deleted      BOOLEAN DEFAULT false
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### 零件目录 (parts_catalog)
```sql
id              UUID PRIMARY KEY
name            TEXT
category        TEXT -- mcu | sensor | actuator | power | module | structural | enclosure | mechanism | misc | 3d_print
model_url       TEXT  -- STL/GLB 模型地址
image_url       TEXT
datasheet_url   TEXT
amazon_asin     TEXT
unit_cost       DECIMAL(10,2)
specs           JSONB  -- {voltage, interface, dimensions...}
```

### BOM 行项 (bom_items)
```sql
id              UUID PRIMARY KEY
project_id      UUID REFERENCES projects
part_id         UUID REFERENCES parts_catalog
qty             INTEGER
position_3d     JSONB  -- {x, y, z, rotation}
print_specs     JSONB  -- {material, layer_height, infill} (3D打印件)
```

### 接线图 (wiring_diagrams)
```sql
id              UUID PRIMARY KEY
project_id      UUID REFERENCES projects
nodes           JSONB  -- React Flow nodes
edges           JSONB  -- React Flow edges
```

### 装配说明 (instructions)
```sql
id              UUID PRIMARY KEY
project_id      UUID REFERENCES projects
steps           JSONB  -- [{step: 1, title, description, part_ids: []}]
```

### 对话记录 (messages)
```sql
id              UUID PRIMARY KEY
project_id      UUID REFERENCES projects
role            TEXT  -- user | assistant | system
content         TEXT
credits_spent   INTEGER
created_at      TIMESTAMP
```

---

## 四、核心功能模块

### 4.1 首页 (/)

```
┌─────────────────────────────────────────────────────┐
│ Logo                          [username] [Pro]       │
├─────────────────────────────────────────────────────┤
│                                                     │
│     [3D 粒子背景 - Three.js]                        │
│                                                     │
│         "你想建造什么？"                             │
│   [ 输入框: 请建筑师提供蓝图...        ] [发送]     │
│   [ 需要灵感吗？ ]                                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│   社区项目                                           │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│   │ CNC │ │无人机│ │服务器│ │更多 │               │
│   └─────┘ └─────┘ └─────┘ └─────┘               │
│                                                     │
│   我的项目                                           │
│   ┌──────────────────────────────────────┐        │
│   │ Garbage Robot  Published  35 parts   │        │
│   └──────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

**技术实现：**
- Next.js App Router，首页静态生成
- Three.js 背景用 `useFrame` 动画循环
- 社区项目 SSR 拉取，项目列表 Zustand 缓存

---

### 4.2 项目详情页 (/project/[id])

```
┌──────────────────────────────────────────────────────────────────┐
│ [← 返回]  Project Name   [INFO][BOM][WIRING][MECH][INSTR][PART] │
│                                      [Published][ZIP][8][user]  │
├────────────┬─────────────────────────────────┬───────────────────┤
│            │                                 │                   │
│ Parts List │     主视图区域 (Three.js)        │   AI Chat        │
│ (35 items) │                                 │                   │
│            │  INFO: 项目信息卡片               │  > Ask to modify │
│ [搜索框]   │  BOM: 物料表格 (可编辑)          │                   │
│            │  WIRING: React Flow 接线图       │  [SYSTEM] Loaded │
│ 零件1      │  MECH: 3D 爆炸图                 │                   │
│ 零件2      │  INSTRUCTIONS: 分步指南          │                   │
│ 零件3      │  PART: 单零件 3D 查看器          │                   │
│ ...        │                                 │                   │
│            │                                 │                   │
├────────────┴─────────────────────────────────┴───────────────────┤
│              Chat Input: > Ask to modify...      [Send]         │
└──────────────────────────────────────────────────────────────────┘
```

**视图层实现：**
```tsx
// 项目页视图状态机
type ViewTab = 'info' | 'bom' | 'wiring' | 'mech' | 'instructions' | 'part'

// Zustand Store
interface ProjectStore {
  activeTab: ViewTab
  selectedPartId: string | null
  wiringNodes: Node[]
  wiringEdges: Edge[]
  setTab: (tab: ViewTab) => void
  selectPart: (id: string) => void
  updateWiring: (nodes: Node[], edges: Edge[]) => void
}
```

---

### 4.3 AI 对话流程

```
用户输入: "设计一个智能台灯，包含LED灯带和人体感应"

           ┌─────────────┐
           │  Chat Input │
           └──────┬──────┘
                  │ POST /api/chat
                  ▼
           ┌─────────────┐
           │  Go API     │──── 扣积分 ────▶ Redis
           │  Gateway    │
           └──────┬──────┘
                  │ POST Gemini
                  ▼
           ┌─────────────┐
           │ Gemini API  │
           │ (结构化输出) │
           └──────┬──────┘
                  │ JSON
                  ▼
           ┌─────────────┐
           │  AI Parser  │──── 解析 ────▶ Parts + BOM + Wiring
           │  Service    │
           └──────┬──────┘
                  │ SQL INSERT
                  ▼
           ┌─────────────┐
           │ Supabase   │──── WebSocket ──▶ 前端更新
           └─────────────┘
```

**Gemini Prompt 结构：**
```
你是一个硬件设计助手。用户想要: {user_input}

请生成以下JSON结构（严格JSON，无markdown）:
{
  "name": "项目名称",
  "description": "一句话描述",
  "parts": [
    {
      "name": "零件名称",
      "category": "mcu|sensor|actuator|power|module|structural|enclosure|mechanism|misc|3d_print",
      "specs": {"接口类型": "值"},
      "qty": 1,
      "estimated_cost": 10.00,
      "amazon_keywords": "搜索关键词"
    }
  ],
  "wiring": {
    "connections": [
      {"from": "零件1", "to": "零件2", "voltage": "5V", "interface": "GPIO"}
    ]
  },
  "instructions": [
    {"step": 1, "title": "步骤标题", "description": "详细说明", "part_ids": ["零件ID"]}
  ]
}
```

---

### 4.4 BOM 物料清单

**表格功能：**
- 按类型筛选 (All / Electrical / Mechanical)
- 视图切换 (Table / Cards)
- 内联编辑数量
- Amazon 搜索链接生成
- 3D 打印件显示打印参数
- 成本自动汇总

**BOM 组件结构：**
```tsx
<BomTable>
  <BomFilters />
  <BomViewToggle />
  <BomTableHeader />
  <BomRow>
    <BomCell part={part} />
    <BomCell qty={qty} editable />
    <BomCell cost={cost} />
    <BomCell source={source} />
  </BomRow>
  <BomSummary total={total} />
</BomTable>
```

---

### 4.5 WIRING 接线图 (React Flow)

**节点类型：**
```tsx
type NodeType = 'mcu' | 'sensor' | 'actuator' | 'power' | 'module' | 'display' | 'data'

interface WiringNode {
  id: string
  type: NodeType
  position: { x: number, y: number }
  data: {
    label: string
    model: string
    pins: Pin[]
    imageUrl: string
  }
}

interface Pin {
  name: string
  type: 'power' | 'ground' | 'gpio' | 'signal'
  voltage?: string
}
```

**预设节点模板：**
```tsx
const NODE_TEMPLATES = {
  mcu: { color: '#3b82f6', icon: Cpu },
  sensor: { color: '#22c55e', icon: Radio },
  actuator: { color: '#f59e0b', icon: Zap },
  power: { color: '#ef4444', icon: Battery },
  module: { color: '#8b5cf6', icon: CircuitBoard },
  display: { color: '#06b6d4', icon: Monitor },
  data: { color: '#ec4899', icon: Wifi },
}
```

**连边样式：**
- 按电压着色 (12V=红, 5V=橙, 3.3V=黄, GPIO=绿)
- 悬停显示详情
- 可拖拽创建新连接

---

### 4.6 MECH 机械视图 (Three.js)

**爆炸图实现：**
```tsx
// 使用 React Three Fiber
<Canvas>
  <OrbitControls />
  <Stage>
    {parts.map(part => (
      <PartMesh
        key={part.id}
        geometry={part.modelUrl}
        position={part.position3d}
        label={part.name}
      />
    ))}
  </Stage>
</Canvas>
```

**交互：**
- 鼠标拖拽旋转
- 滚轮缩放
- 点击零件高亮
- 侧边栏联动选中

---

### 4.7 积分系统

```tsx
// Redis 存储
key: credits:{userId}  →  value: { amount: 10, resetAt: timestamp }

// 扣积分逻辑
async function consumeCredit(userId: string, amount: number) {
  const key = `credits:${userId}`
  const current = await redis.get(key)
  
  if (current.amount < amount) {
    throw new Error('INSUFFICIENT_CREDITS')
  }
  
  await redis.decrby(key, amount)
  await logCreditUsage(userId, amount)
}
```

**积分规则：**
- 免费用户：每周 10 积分
- Pro 用户：无限积分
- 每次 AI 对话：消耗 1-5 积分（根据复杂度）

---

## 五、API 设计

### REST Endpoints

```
认证:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

项目:
GET    /api/projects                    # 列表
POST   /api/projects                    # 创建
GET    /api/projects/:id                # 详情
PATCH  /api/projects/:id                # 更新
DELETE /api/projects/:id                # 删除

BOM:
GET    /api/projects/:id/bom            # 获取 BOM
POST   /api/projects/:id/bom/items       # 添加零件
PATCH  /api/projects/:id/bom/items/:iid # 更新零件
DELETE /api/projects/:id/bom/items/:iid # 删除零件

接线图:
GET    /api/projects/:id/wiring          # 获取接线图
PUT    /api/projects/:id/wiring          # 保存接线图

装配说明:
GET    /api/projects/:id/instructions   # 获取说明
PUT    /api/projects/:id/instructions   # 保存说明

AI 对话:
POST   /api/chat                        # 发送消息
GET    /api/projects/:id/messages       # 历史记录

社区:
GET    /api/community                   # 社区项目列表
GET    /api/trending                    # 热门项目

积分:
GET    /api/credits                     # 当前积分
POST   /api/credits/purchase            # 购买积分

零件目录:
GET    /api/parts                       # 搜索零件
GET    /api/parts/:id                    # 零件详情
GET    /api/parts/categories             # 分类列表
```

### WebSocket Events

```
连接: ws://api.hardwareforge.ai/ws?projectId=xxx

服务端 → 客户端:
  - 'message'     { id, role, content }
  - 'typing'      { isTyping: boolean }
  - 'parts_update'{ newParts: Part[] }
  - 'error'       { code, message }

客户端 → 服务端:
  - 'send_message' { content }
```

---

## 六、目录结构

```
/
├── apps/
│   └── web/                    # Next.js 主应用
│       ├── app/
│       │   ├── page.tsx        # 首页
│       │   ├── project/
│       │   │   └── [id]/
│       │   │       └── page.tsx
│       │   ├── auth/
│       │   └── api/
│       ├── components/
│       │   ├── ui/             # shadcn/ui 组件
│       │   ├── home/           # 首页组件
│       │   ├── project/        # 项目页组件
│       │   │   ├── bom/        # BOM 相关
│       │   │   ├── wiring/      # 接线图
│       │   │   ├── mech/        # 3D 视图
│       │   │   └── chat/        # AI 对话
│       │   └── three/          # Three.js 组件
│       ├── lib/
│       │   ├── supabase.ts
│       │   ├── api.ts
│       │   └── utils.ts
│       ├── stores/             # Zustand stores
│       │   ├── projectStore.ts
│       │   ├── chatStore.ts
│       │   └── userStore.ts
│       └── styles/
│           └── globals.css
│
├── packages/
│   └── types/                  # 共享 TypeScript 类型
│       ├── project.ts
│       ├── part.ts
│       └── wiring.ts
│
├── services/                   # Go 后端服务
│   ├── api/                    # HTTP API
│   │   ├── handlers/
│   │   ├── middleware/
│   │   └── router.go
│   ├── auth/
│   ├── project/
│   ├── ai/
│   │   └── parser.go           # AI 响应解析
│   ├── parts/
│   └── ws/                     # WebSocket 服务
│
├── infra/
│   ├── docker-compose.yml
│   ├── supabase/
│   │   └── migrations/
│   └── redis/
│
└── docs/
    └── ARCHITECTURE.md
```

---

## 七、关键决策

### 为什么不直接用 Blueprint 的代码？

1. **法律风险** — CSS/JS 混淆打包，直接复制侵权
2. **学习价值** — 自己实现一遍才真正理解
3. **定制需求** — Olly 可能有特定领域需求（光通信？）

### 简化版本优先级

**P0 (MVP 必须):**
1. 首页 + 3D 背景
2. 项目列表/详情
3. AI 对话 (Gemini)
4. BOM 表格
5. 用户系统 + 积分

**P1 (完整功能):**
1. React Flow 接线图
2. Three.js 3D 视图
3. 装配说明
4. 社区功能

**P2 (可选):**
1. 零件 3D 打印参数
2. Amazon 链接生成
3. 项目导出 ZIP
4. 实时协作

### AI Prompt 优化

Blueprint.am 的核心价值在于 **AI 生成的结构化输出**。关键点：
- 使用 Gemini 的 `responseSchema` 强制 JSON 输出
- 预设零件知识库提高准确性
- 错误重试 + 部分成功策略

---

## 八、启动计划

```
Week 1: 搭架子
  - Next.js 项目初始化
  - Tailwind + shadcn/ui 配置
  - Supabase 项目创建
  - Go API 骨架

Week 2: 核心流程
  - 首页 + 3D 背景
  - 项目 CRUD
  - AI 对话 + Gemini 集成
  - BOM 表格

Week 3: 可视化
  - React Flow 接线图
  - Three.js 爆炸图
  - 装配说明

Week 4: 完善
  - 积分系统
  - 社区功能
  - 用户系统
  - 部署上线
```
