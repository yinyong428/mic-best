# MIC Blueprint 技术架构设计文档 v2.0
**文档编号**：MIC-BP-TADD-2026-04-05
**版本**：v2.0（深度研究增强版）
**日期**：2026 年 4 月 5 日
**状态**：正式版

---

## 1. 执行摘要

在 Blueprint.am 原始架构（LangGraph 多 Agent + Supabase）基础上，**全面对接中国供应链**，实现零件价格更低、交付更快、库存更准、体验更本土。核心架构不变，新增供应链集成层和国产模型支持层。

---

## 2. 高层系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    用户浏览器 / App                          │
│              Next.js 15 (App Router, RSC)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / WebSocket
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                 FastAPI (Python 3.12+)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Auth Router  │  │ Project CRUD │  │  WebSocket Hub   │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         LangGraph Agent Orchestrator                  │  │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐  │  │
│  │  │Intent    │ │ BOM       │ │Wiring    │ │Mech    │  │  │
│  │  │Agent     │ │ Agent     │ │Agent     │ │Agent   │  │  │
│  │  └────┬─────┘ └─────┬─────┘ └────┬─────┘ └───┬────┘  │  │
│  │       └─────────────┼───────────┼────────────┘       │  │
│  └──────────────────────┼───────────┼──────────────────────┘  │
└────────────────────────┼───────────┼────────────────────────┘
                         │
         ┌───────────────┼───────────┼────────────────┐
         ↓               ↓           ↓                ↓
┌─────────────┐ ┌─────────────┐ ┌──────────┐  ┌────────────┐
│  通义千问    │ │  DeepSeek   │ │ LCSC API │  │ JLCPCB API│
│  (Qwen-Max) │ │  (DeepSeek  │ │ (立创)   │  │ (嘉立创)  │
└─────────────┘ │   V3)       │ └──────────┘  └────────────┘
                 └─────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL + Auth + Realtime + Storage + Edge)  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │projects  │ │ users    │ │parts_cache│ │procurement  │  │
│  │_messages │ │_sessions │ │_lcsc    │ │_links       │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘

```

---

## 3. 技术栈选型

### 3.1 前端

| 技术 | 选型 | 说明 |
|------|------|------|
| **框架** | Next.js 15 (App Router) | SSR + RSC + API Routes |
| **语言** | TypeScript 5.4 | 严格类型检查 |
| **UI 组件** | shadcn/ui | 基于 Radix + Tailwind |
| **状态管理** | Zustand | 轻量，适合 AI 对话流 |
| **图表** | Mermaid.js | Wiring 图渲染 |
| **3D 预览** | @react-three/fiber | Mech 3D 模型预览 |
| **样式** | Tailwind CSS 4.0 | 原子化 CSS |
| **深色模式** | next-themes | 系统级主题切换 |
| **WebSocket** | Supabase Realtime | 项目生成进度推送 |

### 3.2 后端

| 技术 | 选型 | 说明 |
|------|------|------|
| **框架** | FastAPI (Python 3.12) | ASGI 高性能 |
| **Agent 编排** | LangGraph | 多 Agent 状态机 |
| **AI 模型** | 通义千问 + DeepSeek 双引擎 | 国产模型优先 |
| **向量数据库** | Supabase pgvector | 零件规格向量检索 |
| **任务队列** | Redis + Celery | 长时间任务（Gerber 生成） |
| **缓存** | Redis | LCSC 价格缓存（TTL 5min） |
| **API 规范** | OpenAPI 3.1 | 自动生成客户端 SDK |

### 3.3 数据库（Supabase）

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `users` | 用户账号 | id, email, wechat_openid, credits, plan |
| `projects` | 项目记录 | id, user_id, name, spec, status, created_at |
| `project_messages` | 对话历史 | id, project_id, role, content, artifacts |
| `parts_cache_lcsc` | LCSC 零件缓存 | lcsc_id, name, price_cny, stock, spec_vector |
| `procurement_links` | 采购链接 | project_id, lcsc_id, taobao_link, jlcpcb_link |
| `Bom_items` | BOM 清单 | project_id, part_name, lcsc_id, quantity, unit_price |

### 3.4 基础设施

| 组件 | 选型 | 地域 |
|------|------|------|
| **云服务器** | 阿里云 ECS (北京) | 中国大陆 |
| **CDN** | 阿里云 CDN | 全球加速（海外用户） |
| **对象存储** | 阿里云 OSS | 项目文件、Gerber 存储 |
| **数据库** | Supabase Cloud (或自建 PostgreSQL 16) | 中国大陆 |
| **监控** | 阿里云 ARMS + Prometheus | 全栈可观测性 |
| **日志** | 阿里云 SLS | 结构化日志 |

---

## 4. 核心模块详细设计

### 4.1 AI Agent 层（LangGraph）

#### 4.1.1 架构图

```
User Input (自然语言)
        │
        ▼
┌──────────────────┐
│  Intent Agent    │ ← 通义千问 Qwen-Max
│  (意图解析)       │
└────────┬─────────┘
         │ 解析出：主控芯片、外设列表、功能需求
         ▼
┌──────────────────┐
│  BOM Agent       │ ← DeepSeek V3
│  (物料清单)       │  Tools: LCSC Search, DigiKey Fallback
└────────┬─────────┘
         │ BOM 列表（含 LCSC ID）
         ▼
┌──────────────────┐
│  Wiring Agent    │ ← DeepSeek V3
│  (接线图)        │  Tools: Fritzing 生成, SVG 渲染
└────────┬─────────┘
         │ 接线图 SVG + 连接关系 JSON
         ▼
┌──────────────────┐
│  Mech Agent      │ ← DeepSeek V3
│  (机械结构)       │  Tools: 3D 模型库, STEP 生成
└────────┬─────────┘
         │ 3D 模型 URL + 装配说明
         ▼
┌──────────────────┐
│  Instructions    │ ← 通义千问
│  (组装指南)       │
└────────┬─────────┘
         │ Markdown 组装步骤
         ▼
    [生成完成] → Supabase Realtime → 前端 WebSocket
```

#### 4.1.2 Agent 工具定义（Tools）

```python
# BOM Agent Tools
class LCSCRestAPI:
    """立创商城 REST API"""
    def search_part(keyword: str) → List[LCSCPart]
    def get_price(lcsc_id: str) → PriceInfo
    def get_stock(lcsc_id: str) → StockInfo
    def get_cart_url(parts: List[BOMItem]) → str

class DigiKeyFallback:
    """Digi-Key Fallback（当 LCSC 无货时）"""
    def search_equivalent(lcsc_id: str) → List[DigiKeyPart]

# Wiring Agent Tools
class FritzingGenerator:
    """接线图生成"""
    def generate_svg(connections: List[Connection]) → str  # SVG

class SVGToImage:
    """SVG 渲染为 PNG/SVG"""
    def render(svg: str, theme: str) → bytes

# JLCPCB Agent Tools
class JLCPCBRestAPI:
    """JLCPCB REST API"""
    def upload_gerber(zip_data: bytes) → str  # order_id
    def get_quote(gerber_id: str) → QuoteInfo
    def get_order_status(order_id: str) → OrderStatus

class GerberGenerator:
    """从 wiring.json 生成 Gerber 文件"""
    def generate(connections: List[Connection]) → bytes  # ZIP

# 1688 采购工具
class Tao BaoUnionAPI:
    """淘宝联盟 API"""
    def get_item_url(item_id: str, pid: str) → str  # 推广链接
    def search_items(keyword: str) → List[TaobaoItem]
```

#### 4.1.3 Prompt 策略

```python
# BOM Agent System Prompt（节选）
BOM_AGENT_PROMPT = """
你是一个专业的电子元器件选型工程师，熟悉中国供应链。
要求：
1. 优先选择 LCSC（有货、价格低）零件
2. 如果 LCSC 无货，选择 Digi-Key 作为 fallback
3. 标注每个零件的：零件名称、LCSC ID、规格、数量、单价（RMB）
4. 计算 BOM 总价（含汇率）
5. 推荐 JLCPCB SMT 贴片零件（标注"JLC-B"）

输出格式（JSON）：
{
  "items": [
    {
      "name": "ESP32-S3-DevKitC-1",
      "lcsc_id": "C2905875",
      "category": "开发板",
      "spec": "Xtensa 双核 240MHz, Wi-Fi+BT",
      "quantity": 1,
      "unit_price_cny": 38.50,
      "stock_status": "充足",
      "jlc_basic": false,
      "替代零件": null
    }
  ],
  "total_price_cny": 285.60,
  "currency_rate": 7.25,
  "total_price_usd": 39.39
}
"""

# Wiring Agent System Prompt（节选）
WIRING_AGENT_PROMPT = """
你是一个硬件接线图专家，使用 Fritzing 风格生成接线图。
规则：
1. 所有连接用彩色线表示（红色=VCC, 黑色=GND, 其他信号用对应颜色）
2. 每根线标注连接起点和终点
3. 开发板用简化的 PCB 视图表示
4. 生成安全的接线关系（检查电压兼容）

输出格式（JSON）：
{
  "connections": [
    {
      "from": {"device": "ESP32-S3", "pin": "GPIO21"},
      "to": {"device": "OLED", "pin": "SDA"},
      "wire_color": "#4CAF50",
      "label": "I2C_SDA"
    }
  ],
  "warnings": ["警告：ESP32 GPIO21 连接到 OLED SDA，注意 I2C 地址不要冲突"]
}
"""
```

### 4.2 数据库设计

#### 4.2.1 Schema 定义

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  wechat_openid TEXT UNIQUE,
  github_id TEXT UNIQUE,
  nickname TEXT,
  credits INTEGER DEFAULT 15,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 项目表
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'done', 'error')),
  spec JSONB,  -- 原始需求
  artifacts JSONB,  -- 生成结果：wiring_svg, bom, mech_url, instructions
  is_public BOOLEAN DEFAULT false,
  shared_url TEXT UNIQUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 对话历史
CREATE TABLE project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  artifacts JSONB,  -- 该轮生成的中间产物
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LCSC 零件缓存（定时同步热门零件）
CREATE TABLE parts_cache_lcsc (
  lcsc_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  manufacturer TEXT,
  spec TEXT,
  unit_price_cny DECIMAL(10, 4),
  stock_qty INTEGER,
  stock_status TEXT,
  jlc_basic BOOLEAN DEFAULT false,
  jlc_basic_part_id TEXT,
  datasheet_url TEXT,
  spec_vector vector(1536),  -- 用于相似零件搜索
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 采购链接记录
CREATE TABLE procurement_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  lcsc_id TEXT REFERENCES parts_cache_lcsc(lcsc_id),
  taobao_link TEXT,
  jlcpcb_link TEXT,
  quantity INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 向量索引（用于零件相似搜索）
CREATE INDEX idx_parts_spec_vector ON parts_cache_lcsc USING ivfflat (spec_vector vector_cosine_ops);
```

### 4.3 API 接口设计

#### 4.3.1 REST API 路由

```
/api/v1/
  ├── auth/
  │   ├── POST /login/wechat       # 微信登录
  │   ├── POST /login/github       # GitHub 登录
  │   └── POST /logout             # 登出
  │
  ├── projects/
  │   ├── POST   /                 # 创建项目（触发 AI 生成）
  │   ├── GET    /                  # 列出用户项目
  │   ├── GET    /{id}             # 获取项目详情
  │   ├── PATCH  /{id}             # 更新项目（名称/可见性）
  │   ├── DELETE /{id}             # 删除项目
  │   └── POST   /{id}/iterate     # 迭代（发送新消息）
  │
  ├── parts/
  │   ├── GET    /search?q=        # 搜索 LCSC 零件（缓存）
  │   ├── GET    /{lcsc_id}        # 零件详情
  │   └── GET    /price/{lcsc_id}  # 实时价格（绕过缓存）
  │
  ├── procurement/
  │   ├── GET    /lcsc-cart/{project_id}     # 生成 LCSC 购物车链接
  │   ├── GET    /jlcpcb-quote/{project_id}  # JLCPCB 报价
  │   ├── POST   /jlcpcb-order/{project_id}  # JLCPCB 下单
  │   └── GET    /1688-list/{project_id}     # 1688 采购清单
  │
  ├── community/
  │   ├── GET    /projects              # 公开项目列表
  │   ├── GET    /projects/{id}        # 获取公开项目
  │   └── POST   /projects/{id}/clone  # 克隆公开项目
  │
  └── billing/
      ├── GET    /credits              # 查询 credits
      └── POST   /subscribe            # 订阅 Pro
```

#### 4.3.2 WebSocket 实时通道

```
/ws/project/{project_id}
  → 前端建立 WebSocket 连接，实时接收：
  - generation_progress: {stage: "bom" | "wiring" | "mech", percent: 80}
  - new_message: {role: "assistant", content: "..."}
  - artifact_ready: {type: "bom" | "wiring_svg" | "mech", url: "..."}
  - error: {message: "..."}
```

---

## 5. 中国供应链 API 集成详解

### 5.1 LCSC（立创商城）集成

#### 5.1.1 官方 Open API

文档地址：https://open.jlc.com/

**申请流程**：
1. 注册嘉立创账号（企业/个人均可）
2. 在 open.jlc.com 申请 AppKey（需审核 1-3 工作日）
3. 配置 IP 白名单（服务器出口 IP）
4. 签名认证调用 API

**核心 API 端点**：

```
基础地址：https://open.jlc.com/api
认证方式：AppKey + AppSecret 签名

GET /components/search
  ?keyword=ESP32-S3
  &pageSize=20
  &pageNum=1
  &componentCategory=0
  → 返回零件列表（含 LCSC ID、名称、规格）

GET /components/{lcscId}
  → 单个零件详情

GET /components/{lcscId}/price
  ?quantity=1,10,100
  → 分段价格（1片/10片/100片）

GET /components/{lcscId}/stock
  → 实时库存（仓库位置 + 数量）

POST /shoppingCart/add
  → 加入购物车（需登录态）
```

#### 5.1.2 缓存策略

```python
class LCSCCache:
    """
    LCSC 零件缓存策略：
    - 热门零件（TOP 1000）：每 5 分钟同步一次
    - 普通零件：首次查询后缓存 1 小时
    - 库存紧张零件（<10）：实时查询
    """
    def __init__(self, redis: Redis):
        self.redis = redis
        self.hot_parts_ttl = 300   # 5 分钟
        self.normal_ttl = 3600     # 1 小时

    async def get_price(self, lcsc_id: str) -> PriceInfo:
        key = f"lcsc:price:{lcsc_id}"
        cached = await self.redis.get(key)
        if cached:
            return PriceInfo.parse_raw(cached)

        # 真实 API 调用
        price = await self.lcsc_api.get_price(lcsc_id)
        await self.redis.setex(key, self.hot_ttl, price.json())
        return price
```

#### 5.1.3 LCSC → JLCPCB 零件映射

```python
# LCSC 零件的 JLCPCB 兼容处理
# JLCPCB 只有约 800 种基础零件（SMT）可贴片
# 需标记哪些零件是 JLC-B（JLC Basic），这些可直接贴片

def check_jlc_compatible(lcsc_id: str, lcsc_data: dict) -> bool:
    """
    判断 LCSC 零件是否可用于 JLCPCB SMT 贴片
    依据：lcsc_data['jlc_basic'] == True
    """
    return lcsc_data.get('jlc_basic', False)

def get_jlc_basic_part_id(lcsc_id: str) -> str:
    """
    获取 LCSC 零件对应的 JLC Basic 零件编号
    用于 JLCPCB SMT 报价
    """
    # 调用 JLCPCB Parts Library API
    pass
```

### 5.2 JLCPCB 集成

#### 5.2.1 官方 API

文档地址：https://api.jlcpcb.com/

**API 类型**：
- PCB API（Gerber 上传、报价、下单）
- Parts API（基础零件库查询）

**核心端点**：

```
基础地址：https://api.jlcpcb.com

GET /parts/baseComponents
  ?search=ESP32
  &currPage=1
  &pageSize=20
  → JLCPCB 基础零件库搜索

POST /bom/gerberUpload
  Content-Type: multipart/form-data
  → 上传 Gerber 文件（ZIP），返回 order_id

POST /bom/quote
  → PCB + SMT 报价计算

GET /bom/orders/{orderId}/status
  → 订单状态
```

#### 5.2.2 Gerber 生成流程

```python
class GerberGenerator:
    """
    从 Wiring Agent 生成的连接关系生成标准 Gerber 文件
    使用 KiCad pcbnew 底层库
    """

    async def generate_from_wiring(self, connections: List[Connection]) -> bytes:
        """
        1. 创建空白 PCB（双面板，默认尺寸）
        2. 根据 connections 放置焊盘/过孔
        3. 自动布线（Simple router）
        4. 生成顶层/底层 Gerber + 钻孔文件
        5. 打包为 ZIP 返回
        """
        # 使用 skidl + pcbnew
        circuit = skidl.Circuit()
        # ... 添加零件和连接 ...
        circuit.ERC()  # 电气规则检查
        circuit.write_backer()  # 生成 PCB 文件

        # 调用 KiCad 命令行生成 Gerber
        result = await asyncio.create_subprocess_exec(
            'kikit', 'fab', 'jlcpcb',
            'input.kicad_pcb',
            'output.zip',
            env={'KISYM': '/opt/kicad/share/kicad'}
        )
        return await result.stdout.read()
```

### 5.3 淘宝联盟集成

#### 5.3.1 1688 采购清单生成

```python
class TaoBaoUnionAPI:
    """
    淘宝开放平台 API（用于 1688 批发链接）
    需申请：https://open.taobao.com/
    """

    def __init__(self, app_key: str, app_secret: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self.pid = "mm_12345678_12345678_12345678"  # 自己的推广位

    async def search_1688(self, keyword: str) -> List[TaobaoItem]:
        """
        搜索 1688 商品
        返回：商品名称、价格、批发起订量、供货商
        """
        params = {
            'method': 'taobao.wireless.simple.item.list.get',
            'keyword': keyword,
            'page_size': 10,
            'cat_id': 50013814  # 电子元器件
        }
        # 签名生成 + API 调用
        result = await self._call(params)
        return result['items']

    def get_affiliate_link(self, item_id: str) -> str:
        """
        生成带佣金追踪的推广链接
        用户通过此链接购买，平台可获 5-15% 佣金
        """
        params = {
            'method': 'taobao.tbk.item.convert',
            'num_iids': item_id,
            'adzone_id': self.pid
        }
        result = await self._call(params)
        return result['short_url']
```

---

## 6. 前端核心组件设计

### 6.1 多 Tab 工作区布局

```
┌──────────────────────────────────────────────────────────────┐
│  [←] 项目名称：温湿度监控系统     [分享] [导出] [···]         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Chat  │  Info  │  BOM  │  Wiring  │  Mech  │ Instruc │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [当前 Tab 内容区域]                                         │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [用户输入框]                           [发送] [上传图片/文件]│
└──────────────────────────────────────────────────────────────┘
```

### 6.2 关键组件

| 组件 | 技术 | 说明 |
|------|------|------|
| `ProjectWorkspace` | Next.js RSC | 主工作区容器 |
| `ChatTab` | Zustand + WebSocket | 对话界面，实时接收 AI 输出 |
| `BOMTable` | TanStack Table | 可编辑 BOM 表格 |
| `WiringViewer` | Mermaid.js / SVG | 交互式接线图 |
| `MechViewer` | @react-three/fiber | 3D 模型查看器 |
| `LCSCPriceTag` | 实时 Badge | 价格和库存状态标签 |
| `CreditMeter` | Zustand | 顶部 Credits 计量器 |

### 6.3 Wiring 图渲染

```typescript
// 使用 Mermaid.js 渲染接线图
// 示例输入：
const mermaidCode = `
graph TD
    ESP32["🔲 ESP32-S3<br/>GPIO21/GPIO22"] -->|I2C| OLED["🖥 OLED 0.96<br/>I2C 0x3C"]
    ESP32["🔲 ESP32-S3<br/>GPIO4"] -->|GPIO| DHT22["🌡 DHT22<br/>DATA"]
    OLED -->|VCC/GND| PWR["⚡ 电源模块<br/>3.3V"]
    DHT22 -->|VCC/GND| PWR
`;

<MermaidChart code={mermaidCode} theme="dark" />
```

---

## 7. 部署架构

### 7.1 容器化部署

```yaml
# docker-compose.yml（本地开发 / 小规模生产）
version: '3.9'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      LCSC_API_KEY: ${LCSC_API_KEY}
      JLCPCB_API_KEY: ${JLCPCB_API_KEY}
      QWEN_API_KEY: ${QWEN_API_KEY}
      DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  celery-worker:
    build: ./backend
    command: celery -A app.celery worker
    environment:
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - redis
```

### 7.2 生产级 Kubernetes 部署（阿里云 ACK）

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mic-blueprint-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    spec:
      containers:
        - name: backend
          image: registry.cn-beijing.aliyuncs.com/mic-blueprint/backend:latest
          ports:
            - containerPort: 8000
          env:
            - name: LCSC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: api-keys
                  key: lcsc
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "4Gi"
              cpu: "2000m"
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
```

---

## 8. 实施路线图（12 周）

### Phase 1：基础设施 + MVP 核心（4 周）

| 周次 | 任务 | 交付物 |
|------|------|--------|
| **W1** | 项目初始化：Next.js + FastAPI + Supabase | 基础项目结构，CI/CD 流水线 |
| **W1** | 数据库 Schema 设计 + 迁移 | users, projects 表 |
| **W2** | Auth 模块：微信 + GitHub 登录 | 登录 Flow 完成 |
| **W2** | LangGraph Agent 骨架 | Agent 编排框架 |
| **W3** | Intent Agent + BOM Agent 实现 | 自然语言解析 + BOM 生成 |
| **W3** | Wiring Agent 实现 | 接线图生成（SVG） |
| **W4** | 多 Tab 前端 UI | Chat/BOM/Wiring Tab |
| **W4** | LCSC 静态数据填充（1000 热门零件） | parts_cache_lcsc 初始数据 |

### Phase 2：供应链闭环（4 周）

| 周次 | 任务 | 交付物 |
|------|------|--------|
| **W5** | LCSC REST API 接入 | 实时价格查询 |
| **W5** | LCSC 缓存层实现 | Redis 缓存 + 定时同步 |
| **W6** | BOM 表 + LCSC 购物车链接 | 一键跳转 LCSC |
| **W6** | JLCPCB Gerber 生成（KiCad CLI） | Gerber ZIP 导出 |
| **W7** | JLCPCB API 接入 | PCB 报价 + 上传 |
| **W7** | 1688 采购清单 + 淘宝联盟 | 联盟链接生成 |
| **W8** | Mech Agent + Instructions Agent | 3D 模型 + 组装指南 |
| **W8** | 集成测试 + 冒烟测试 | 可运行的端到端流程 |

### Phase 3：AI 增强 + 社区（3 周）

| 周次 | 任务 | 交付物 |
|------|------|--------|
| **W9** | 多轮对话迭代 | 对话式修改需求 |
| **W9** | 零件替代建议 | AI 推荐等效零件 |
| **W10** | 小红书分享卡片生成 | 自动生成分享图 |
| **W10** | B站视频演示自动生成 | 短视频合成 |
| **W11** | 社区浏览 + 克隆功能 | 公开项目市场 |
| **W11** | Pro 订阅系统 | Stripe 支付集成 |
| **W12** | 压测 + 优化 + 备案 | 高可用上线 |

---

## 9. 关键风险与缓解

| 风险 | 概率 | 影响 | 缓解方案 |
|------|------|------|---------|
| **LCSC API 申请被拒** | 中 | 高 | 准备企业资质；同步接入 Digi-Key API 作为 fallback |
| **JLCPCB API 审核周期** | 高 | 中 | Phase 1 先用手动 Gerber 导出文件；Phase 2 再集成 API |
| **Gerber 生成质量差** | 高 | 高 | 引入 KiCad ERC 检查；用户可手动在嘉立创EDA微调 |
| **AI 接线图错误** | 中 | 高 | 规则引擎双重校验；用户确认后再生成 Gerber |
| **LCSC 零件数据不准确** | 低 | 中 | 缓存 + 下单前强制确认价格 |
| **大模型幻觉（零件选型）** | 中 | 中 | RAG（零件规格文档）+ 规则引擎约束 |
| **通义千问 API 费用超支** | 中 | 中 | 按 token 计费上限；DeepSeek 作为降级选项 |
| **备案被拒（互联网信息服务）** | 低 | 高 | 使用阿里云 ICP 备案服务，提前准备资质 |

---

## 10. 监控与可观测性

### 10.1 关键指标

| 指标 | 描述 | 告警阈值 |
|------|------|---------|
| API 成功率 | LCSC/JLCPCB API 调用成功率 | < 95% 告警 |
| 生成时长 P95 | 项目生成时间 P95 | > 60s 告警 |
| Credits 耗尽率 | 用户 credits 耗尽率 | > 80% 需审查 |
| 并发用户数 | 同时在线用户数 | 超过 K8s Pod 上限告警 |
| 缓存命中率 | LCSC 零件查询缓存命中率 | < 70% 需优化 |

### 10.2 日志结构

```json
{
  "timestamp": "2026-04-05T12:00:00Z",
  "level": "INFO",
  "service": "bom-agent",
  "trace_id": "abc123",
  "user_id": "user_456",
  "project_id": "proj_789",
  "action": "bom_generated",
  "duration_ms": 3200,
  "parts_count": 15,
  "total_price_cny": 285.6,
  "model_used": "deepseek-v3"
}
```

---

*文档版本历史*
- v1.0（2026-04-04）：初稿
- v2.0（2026-04-05）：整合 blueprint.am 实地调研，新增 API 集成细节、Gerber 生成流程、淘宝联盟、监控体系
