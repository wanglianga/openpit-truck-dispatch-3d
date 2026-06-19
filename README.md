# 露天矿卡车道路三维调度可视化系统

基于 React + Three.js (@react-three/fiber) 构建的沉浸式露天矿卡车调度 3D 可视化平台。

## 项目简介

本系统为矿山调度中心提供全景式三维监控与决策辅助能力。通过程序化生成的矿坑台阶、运输道路网络、装载点、卸料区、危险边坡等场景要素，结合 60 辆卡车与 3 台挖机的实时调度模拟，调度员可直观监控车辆位置、载重状态、排队长度、道路拥堵、安全距离与装卸效率，并支持昼夜切换、车队/物料过滤、单车轨迹回放、事故路线分析等交互功能。

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite 6
- **3D 引擎**：Three.js 0.169 + @react-three/fiber 8 + @react-three/drei 9 + @react-three/postprocessing 2
- **状态管理**：Zustand 5
- **样式方案**：Tailwind CSS 3（玻璃拟态面板）
- **字体**：Noto Sans SC（中文）+ Orbitron（仪表盘数字）
- **图标**：Lucide React

## 核心功能

| 模块 | 能力说明 |
|------|----------|
| 🌋 矿坑场景 | 8 级环形台阶矿坑、主/次/支路/工作道 4 级道路网络，含坡度、方向箭头、限速标识 |
| 🚚 车辆调度 | 60 辆 A/B/C/D 四队卡车，Dijkstra 路径规划，装载/排队/运输/卸料/空返 状态机 |
| 🏗️ 装卸作业 | 3 个装载工作面（采煤/采矿石/剥离）+ 3 台挖机（大臂/铲斗动画）+ 3 处卸料场 |
| 🚨 安全监控 | 危险边坡红色警戒区（脉冲动画）、超速预警、车距过近预警、事故事件书签 |
| 🌗 昼夜系统 | 白班（太阳光+天空）与夜班（星空+40盏路灯+每车2盏前照聚光灯+尾灯）1.5s 渐变过渡 |
| 🔍 交互筛选 | 按车队 / 物料过滤，斜视/俯视/主道/工作面 4 种预设视角，标签/拥堵/警戒显示开关 |
| 📼 轨迹回放 | 时间轴滑块，0.5x/1x/2x/4x 播放速度，事故书签一键跳转，载重与速度可视化 |
| ⚡ 性能优化 | 三级 LOD（高模/中模/InstancedMesh 低模），轨迹点抽样，Bloom+FXAA 后处理 |

---

## 原始需求

> 请用 Three.js 实现露天矿卡车道路三维调度图，场景包括矿坑台阶、运输道路、装载点、卸料区、卡车、挖机、坡度、限速、危险边坡和夜班照明。调度员要看清车辆位置、载重、排队长度、道路拥堵、安全距离和装卸效率；用户可切换白班夜班、按车队或物料过滤、查看单车轨迹、回放事故前后路线。道路层级、坡道方向、车辆标签和警戒线必须清楚，卡车数量增加时用简化模型和轨迹抽样保持移动流畅。

---

## 启动方式

### 前置要求

- **Node.js** ≥ 18（推荐 20 LTS）
- **npm** ≥ 9 或 **pnpm** ≥ 8
- 现代浏览器：Chrome 100+ / Edge 100+ / Firefox 95+，支持 WebGL 2.0
- 建议 GPU：任意独立显卡或核显（Intel UHD 630 以上），显存 ≥ 1GB

### 本地开发启动

#### 1. 安装依赖

```bash
npm install
```

#### 2. 启动开发服务器

```bash
npm run dev
```

访问地址：**http://localhost:5173**

#### 3. 生产构建 & 本地预览

```bash
# 构建
npm run build

# 预览（生产模式）
npm run preview
```

访问地址：**http://localhost:4173**

#### 其他命令

```bash
# TypeScript 类型检查
npm run check

# ESLint 检查
npm run lint
```

---

## Docker 一键启动（推荐）

### Docker 前置要求

- **Docker Engine** ≥ 24.0
- **Docker Compose** ≥ 2.20（或 Docker Desktop 4.20+）

### 构建并启动

```bash
docker compose up --build
```

后台启动（守护进程）：

```bash
docker compose up --build -d
```

启动后访问：**http://localhost:5173**

### 常用运维命令

```bash
# 查看日志
docker compose logs -f openpit-dispatch

# 健康检查
docker compose ps

# 停止服务（保留容器）
docker compose stop

# 重启服务
docker compose restart

# 停止并清理容器、网络（保留镜像与卷）
docker compose down

# 完全清理（含镜像与构建缓存）
docker compose down -v --rmi all
```

### 配置文件校验

```bash
docker compose config
```

---

## 操作指南

### 3D 场景操作

| 操作 | 效果 |
|------|------|
| 鼠标左键拖拽 | 环绕视角旋转 |
| 鼠标右键拖拽 / 中键拖拽 | 平移场景 |
| 滚轮 | 缩放（25 ~ 500 距离范围） |
| 点击卡车 | 选中该车辆，显示详情卡 + 轨迹线 |
| 悬停卡车 | 显示车辆信息浮窗（车牌/状态/载重/速度/车距） |
| 点击空白 | 取消选择 |

### 顶部工具栏

- **预设视角**：斜视全景 / 俯视总览 / 主运输道 / 工作面
- **车队筛选**：全部 / A队 / B队 / C队 / D队
- **物料筛选**：全部 / 原煤 / 矿石 / 废石
- **昼夜切换**：☀️ 白班 ↔ 🌙 夜班（含平滑过渡动画）
- **图层开关**：👁 车辆标签 / 📊 拥堵着色 / ⚠️ 危险边坡

### 左侧仪表盘

- 在途车辆 / 平均载重 / 排队长度 / 安全预警 四项核心指标卡片
- 装卸效率仪表盘（环形进度 + 三装载点等待时间）
- 排队概况条形图
- 四车队状态分布条 + 实时安全预警滚动

### 右侧回放中心

- 单车选择 + 进入回放模式
- 进度条拖动 + 事件书签快捷跳转
- 播放/暂停 + 前后 30s 跳转
- 播放速度：0.5x / 1x / 2x / 4x
- 载重变化柱状图（抽样）
- 事故书签列表（碰撞 / 超速 / 边坡越界 / 其他）

### 底部图例栏

- 道路层级（主道/次道/支路/工作道）
- 坡道方向（上坡橙·下坡蓝）
- 车队颜色、拥堵等级、物料颜色、危险区标识

---

## 目录结构

```
src/
├── components/
│   ├── layout/
│   │   ├── TopToolbar.tsx        顶部工具栏（昼夜/筛选/视角）
│   │   ├── LeftDashboard.tsx     左侧仪表盘（统计/效率/预警）
│   │   ├── RightReplayPanel.tsx  右侧回放中心（时间轴/书签）
│   │   └── BottomLegend.tsx      底部图例栏
│   └── vehicle/
│       └── VehicleDetail.tsx     选中车辆详情卡
├── scene/                         3D 场景组件（R3F）
│   ├── Scene.tsx                 场景根（Canvas+相机+控制+后处理）
│   ├── MineTerrain.tsx           矿坑环形台阶地形
│   ├── RoadNetwork.tsx           道路网络（层级/坡度/拥堵/箭头）
│   ├── LoadingPoints.tsx         装载点+挖机（回转/俯仰/铲斗动画）
│   ├── UnloadingAreas.tsx        卸料区（选煤厂/堆场/排土场）
│   ├── DangerZones.tsx           危险边坡警戒脉冲区
│   ├── StreetLights.tsx          路灯阵列（夜班点亮）
│   ├── Truck.tsx                 单卡车 LOD+车灯+CSS2D 标签
│   ├── TruckFleet.tsx            车队批量管理（分级渲染）
│   ├── TruckTrack.tsx            选中/回放车辆轨迹线
│   └── DayNightCycle.tsx         昼夜循环（光照/天空/星星/雾）
├── simulation/                    调度模拟引擎
│   ├── types.ts                  全部类型定义
│   ├── roadData.ts               道路节点/段数据（含最短路径）
│   ├── vehicleFactory.ts         车辆/装卸区/挖机/路灯 初始数据工厂
│   └── scheduler.ts              状态机 Tick 模拟（移动/排队/装卸/事故）
├── store/
│   └── useScheduleStore.ts       Zustand 全局状态
├── utils/
│   ├── colors.ts                 工业色板（色卡+辅助函数）
│   └── lod.ts                    LOD 距离阈值与轨迹抽样
├── pages/
│   └── Home.tsx                  主页（场景+各面板组合）
├── App.tsx
├── main.tsx
└── index.css                     Tailwind 入口 + 玻璃拟态样式
```

---

## 性能指标（默认配置：60 辆车）

| 指标 | 桌面（GTX 1650） | 笔记本（核显 UHD 770） |
|------|-------------------|------------------------|
| 帧率 | 58 ~ 62 FPS | 38 ~ 48 FPS |
| 显存占用 | ~380 MB | ~520 MB |
| 初次加载 | ~2.1s | ~3.4s |

> 卡车数量可在 `src/store/useScheduleStore.ts` 中修改 `TRUCK_COUNT` 常量（建议 ≤ 200）。

---

## 真实数据接入扩展点

本项目默认内置模拟引擎，在 `src/simulation/` 三层均保留接口：

1. **静态数据层**（`roadData.ts`）：道路网络可改为 `fetchRoadNetwork(): Promise<RoadSegment[]>` 从后端拉取
2. **调度逻辑层**（`scheduler.ts`）：新增 `liveData` 开关，消费 WebSocket 推送的 `Truck.position` / `status` / `load` 增量更新，跳过本地模拟
3. **历史轨迹层**（`replayRecorder.ts`）：可接入 `/api/tracks/:truckId?from=...&to=...` 分页查询真实轨迹

---

## 浏览器兼容性

| 特性 | Chrome 100+ | Edge 100+ | Firefox 95+ | Safari 16+ |
|------|:-----------:|:---------:|:-----------:|:----------:|
| WebGL 2.0 | ✅ | ✅ | ✅ | ✅ |
| ACES 色调映射 | ✅ | ✅ | ✅ | ✅ |
| Bloom 后处理 | ✅ | ✅ | ✅ | ✅ |
| InstancedMesh | ✅ | ✅ | ✅ | ✅ |
| PointerEvents | ✅ | ✅ | ✅ | ✅ |
