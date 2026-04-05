# Blueprint.am 完整功能分析

## 项目页 (Project Page) 完整结构

### URL 路由
```
/                           - 首页
/project/:id                - 项目详情页
/project/:id?tab=render     - 3D 渲染视图
/project/:id?tab=wiring     - 接线图视图
/project/:id?tab=graph      - 机械爆炸图视图
```

### 顶部导航栏
```
[← 返回] | Garbage Robot | [INFO][BOM][WIRING][MECH][INSTRUCTIONS][PART] | [Published][Download ZIP][8积分][用户]
```

---

## 功能标签页详解

### 1. INFO 面板
- 项目名称、描述
- 零件总数：35
- 总成本：$311.15
- 创建时间：Today
- 作者：titano_8f08
- 分类 BOM 汇总表（Electrical 10个 $164.45 / Mechanical 25个 $146.70）

### 2. BOM (Bill of Materials) 物料清单
**表格列**: Part | Type | Qty | Unit | Source | Subtotal

**零件类型分类**:
- MCU (微控制器): Raspberry Pi 4 Model B
- Sensor (传感器): HC-SR04 超声波, Raspberry Pi Camera Module 3
- Actuator (执行器): NEMA 17 步进电机 x2, SG90 舵机
- Power (电源): 3S 12V LiPo Battery, Pololu 5V 降压稳压器
- Module (模块): L298N 双H桥电机驱动
- Structural (结构件): 2020 V-Slot 铝型材
- Enclosure (外壳): 塑料垃圾桶
- Mechanism (机械): 万向轮, 驱动轮, 铰链
- Misc (杂项): T型螺母, 螺栓, 螺母
- 3D Print (3D打印件): 电机座, 轮毂适配器, 传感器支架, 电池座等

**功能特性**:
- 筛选: All 35 / Electrical 10 / Mechanical 25
- 视图切换: Table / Cards
- 每个零件含 Amazon 购买链接（带 affiliate tag）
- Research part 按钮

### 3. WIRING 接线图 (React Flow)
**节点类型**:
- MCU (微控制器)
- SENSOR (传感器)
- ACTUATOR (执行器)
- POWER (电源)
- MODULE (模块)
- DISPLAY (显示)
- DATA (数据)

**接线连接**:
```
3S 12V LiPo Battery → L298N Motor Driver (12V)
L298N Motor Driver → Left/Right Stepper Motors (12V)
3S 12V LiPo Battery → Buck Converter 5V (12V)
Buck Converter 5V → Raspberry Pi 4 (5V)
Raspberry Pi 4 → HC-SR04 Ultrasonic Sensor (5V, GPIO×2)
Raspberry Pi 4 → SG90 Servo Motor (PWM)
Raspberry Pi 4 → I2S Speaker Module (I2S×3)
Raspberry Pi 4 → L298N Motor Driver (GPIO×4, PWM×2)
Raspberry Pi 4 → Raspberry Pi Camera (CSI)
```

**控制面板**: Zoom In / Zoom Out / Fit View

**节点引脚详情**:
- HC-SR04: VCC, GND, Trig, Echo
- NEMA 17 Stepper: A+, A-, B+, B-
- L298N: IN1-4, ENA, ENB, OUT1-2
- Raspberry Pi 4: 5V, GND, GPIO17, GPIO27, GPIO22, GPIO5, GPIO6, GPIO13
- SG90 Servo: VCC, GND, SIG
- I2S Speaker: VIN, GND, BCLK, DIN, LRC
- Pololu 5V: VIN, GND, VOUT

### 4. MECH 机械视图 (Three.js 3D)
- 3D 爆炸图视图
- 显示所有零件的装配位置和编号
- 可交互旋转/缩放

### 5. INSTRUCTIONS 组装说明
- 分步骤装配指南（共 7 步）
- 每步包含详细文字说明
- 进度指示器
- 示例步骤:
  - Step 1: 组装机器人底板和框架
  - Step 4: 安装 M4 螺母到铝型材槽中
  - ...等

### 6. PART 零件 3D 视图 (Three.js)
- 单个零件的 3D 模型查看器
- 显示打印规格（材料、层高、填充率）
- 可切换不同零件查看

---

## 侧边栏：零件列表
- 35 个可点击的零件
- 点击后在 3D 视图中高亮对应零件
- 显示零件图标和名称

---

## AI 对话功能
- 输入框：`> Ask to modify...`
- 发送按钮
- 系统消息：`[SYSTEM] Loaded project: Garbage Robot`
- AI 理解自然语言修改需求
- 可生成新的零件/修改设计

---

## 下载功能
- Download Project ZIP：下载完整项目包

---

## 技术栈总结
- **React 18** + 状态管理
- **Tailwind CSS** 暗色主题
- **Three.js**: 3D 渲染背景 + 爆炸图 + 零件视图
- **React Flow**: 接线图可视化
- **JetBrains Mono** 字体
- **Lucide Icons** 图标库
- **Supabase**: 后端数据库
- **Gemini API**: AI 对话能力
- **Amazon Affiliate**: 零件购买链接
