# Blueprint.am 克隆方案

## 一、技术栈分析

### 核心框架
| 技术 | 用途 |
|------|------|
| **React 18** | 前端框架 |
| **Tailwind CSS** | 样式（自定义配置，JetBrains Mono 字体） |
| **Three.js** | 3D 可视化背景 |
| **React Flow** | 接线图/流程图渲染 |
| **Lucide Icons** | 图标库 |

### 资源清单
```
主 JS:  https://www.blueprint.am/assets/index-BTMjtkQk.js (3.5MB)
主 CSS: https://www.blueprint.am/assets/index-D1G_pGpk.css (55KB)
字体:   Google Fonts - JetBrains Mono
```

### CSS 设计系统
- **暗色主题**: `#18181b` 背景, `#fafafa` 文字
- **自定义变量**: `--c-bg`, `--c-text`, `--c-g200~g950`, `--c-accent: #22c55e`
- **边框**: `--c-g700` (#3f3f46)
- **输入框背景**: `--c-input-bg: #222226`

---

## 二、API 端点

```
/api/auto-username          - 自动生成用户名
/api/brave-images           - 图片搜索
/api/broadcast              - 广播
/api/check-subscription      - 检查订阅
/api/check-username         - 检查用户名
/api/community              - 社区项目列表
/api/consume-credit         - 消耗积分
/api/early_access_features/ - 早期功能
/api/gemini                 - Gemini AI 对话
/api/get-credits            - 获取积分
/api/objects                - 对象存储
/api/product_tours/         - 产品导览
/api/publish                - 发布项目
/api/publish-status         - 发布状态
/api/published              - 已发布项目
/api/published-thumbnail    - 发布缩略图
/api/set-username           - 设置用户名
/api/star                   - 收藏
/api/surveys/               - 调查问卷
/api/trending               - 热门项目
/api/unpublish              - 取消发布
/api/web_experiments/       - 网页实验
```

---

## 三、用户流程

### 首页 (/)
```
┌──────────────────────────────────────────────┐
│  [蓝图 Logo]          [titano_8f08] [专业版]  │  ← 顶部导航栏
├──────────────────────────────────────────────┤
│                                              │
│         🌐 3D 交互背景 (Three.js)            │
│            粒子/节点网络可视化                │
│                                              │
├──────────────────────────────────────────────┤
│  "你想建造什么？"                             │
│  "通过与人工智能对话创建硬件原型设计"          │
│  ┌────────────────────────────────┐ [发送]   │
│  │ 请建筑师提供蓝图……             │           │
│  └────────────────────────────────┘           │
│  [需要灵感吗？]                               │
├──────────────────────────────────────────────┤
│  社区项目                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ CNC  │ │无人机│ │服务器│ │地形  │       │
│  │ 铣床 │ │ AI   │ │ 塔式 │ │ 建筑 │       │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
│  [更多的]                                     │
├──────────────────────────────────────────────┤
│  我的项目                                     │
│  [Garbage Robot - Published]                 │
│  "This autonomous refuse bot..."             │
└──────────────────────────────────────────────┤
│  由 3E8 Robotics 制造 | 服务条款             │
└──────────────────────────────────────────────┘
```

### 设计页面 (/project/:id)
```
┌────────────────────────────────────────────────────────┐
│ [← 返回] Garbage Robot              [INFO][BOM][WIRING][MECH][INSTRUCTIONS] │
├──────────┬─────────────────────────┬───────────────────┤
│          │                         │                   │
│ 项目列表  │    Three.js 3D 视图      │   AI 对话面板     │
│          │    (零件旋转/缩放)        │                   │
│ 35个零件 │                         │  "设计一个智能台灯" │
│          │                         │  → AI 回复中...    │
│          │                         │                   │
├──────────┴─────────────────────────┴───────────────────┤
│ [输入框: 请建筑师提供蓝图……]                    [发送] │
└────────────────────────────────────────────────────────┘
```

### 功能面板
- **INFO**: 项目信息（描述、作者）
- **BOM**: 物料清单（Bill of Materials）
- **WIRING**: 接线图（React Flow）
- **MECH**: 机械零件 3D 视图
- **INSTRUCTIONS**: 组装说明

---

## 四、关键 UI 组件

### 输入框
```css
.robot-border { border: 1px solid var(--c-g700); }
.robot-border:focus-within { border-color: var(--c-text); }
```

### 按钮变体
- **主要按钮**: `bg-white text-black`（黑色文字）
- **次要按钮**: `border border-gray-800 hover:border-gray-500 text-gray-500 hover:text-white`
- **图标按钮**: 无背景，纯图标

### 社区项目卡片
- 3D 渲染预览图
- 标题 + 零件数 + 发布时间 + 作者

---

## 五、克隆步骤

### Phase 1: 前端框架搭建
1. Next.js 14 + App Router
2. Tailwind CSS（复制配色系统）
3. JetBrains Mono 字体
4. React Flow（接线图）
5. Three.js（3D 背景）

### Phase 2: 页面重建
1. 首页（3D 背景 + 输入框 + 社区项目）
2. 项目详情页（3D 视图 + 侧边栏 + 对话面板）
3. 各个功能面板（BOM/WIRING/MECH/INSTRUCTIONS）

### Phase 3: 后端对接
1. Supabase（用户系统 + 项目存储）
2. Gemini API（AI 对话）
3. 积分系统

### Phase 4: 3D 零件系统
1. 零件数据库
2. Three.js 可视化
3. 旋转/缩放交互

---

## 六、注意事项

⚠️ **法律风险**
- UI 相似度控制在合理范围
- 不直接复制原文/代码
- 用于学习目的

💡 **核心价值**
- AI 对话 + 3D 可视化的结合
- 硬件原型设计的细分市场
- 这才是值得借鉴的点
