# OpenClaw Desktop - 主进程技术文档

> 自动生成于 2026-03-14

## 1. 模块概述

主进程是 Electron 应用的核心，负责：
- 应用生命周期管理
- 窗口创建与管理
- Gateway 网关服务管理
- 系统托盘集成
- IPC 通信处理
- Dashboard API 服务器

---

## 2. 文件结构

```
src/main/
├── index.js              # 应用入口，窗口创建，IPC 处理
├── gateway.js            # Gateway CLI 模式管理
├── embedded-gateway.js   # 嵌入式网关管理（推荐）
├── tray.js               # 系统托盘
└── dashboard-server.js   # Dashboard API 服务器
```

---

## 3. 核心文件详解

### 3.1 index.js - 应用入口

**主要职责**：
- 应用生命周期管理
- 窗口创建与配置
- IPC handlers 注册
- 单实例锁

**关键配置**：

```javascript
// 窗口配置
new BrowserWindow({
  width: 1400,
  height: 900,
  minWidth: 1000,
  minHeight: 700,
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    nodeIntegration: false,
    contextIsolation: true
  },
  backgroundColor: '#0a0a0f'
});
```

**IPC Handlers**：

| 通道 | 功能 | 返回值 |
|------|------|--------|
| `gateway:status` | 获取网关状态 | `string` |
| `gateway:detailedStatus` | 获取详细状态 | `GatewayStatus` |
| `gateway:start` | 启动网关 | `Promise<boolean>` |
| `gateway:stop` | 停止网关 | `Promise<boolean>` |
| `gateway:restart` | 重启网关 | `Promise<boolean>` |
| `gateway:getConfig` | 获取配置 | `object | null` |
| `gateway:updateConfig` | 更新配置 | `Promise<void>` |
| `gateway:getLogs` | 获取日志缓冲 | `LogEntry[]` |
| `gateway:getLogFiles` | 获取日志文件列表 | `LogFile[]` |
| `gateway:readLogFile` | 读取日志文件 | `string | null` |

**状态推送**：

```javascript
// 主进程向渲染进程推送状态变化
mainWindow.webContents.send('gateway:status-update', { status, error });
```

### 3.2 embedded-gateway.js - 嵌入式网关

**两种模式**：
1. **嵌入式模式（推荐）**：直接在进程中运行 openclaw-core
2. **CLI 模式（降级）**：通过 spawn 启动外部进程

**配置常量**：

```javascript
const GATEWAY_PORT = 18789;       // 网关端口
const CHECK_INTERVAL = 5000;      // 状态检查间隔 (ms)
const MAX_LOG_BUFFER = 2000;      // 最大日志缓冲条数
```

**状态机**：

```
stopped ──start()──> starting ──onReady──> running
    ↑                                           │
    │                                       stop()
    │                                           │
    └───────── stopped ←─── stopping ←─────────┘
                                     │
                                 error ──restart──> starting
```

**核心 API**：

| 方法 | 描述 | 返回值 |
|------|------|--------|
| `start()` | 启动网关 | `Promise<boolean>` |
| `stop()` | 停止网关 | `Promise<boolean>` |
| `restart()` | 重启网关 | `Promise<boolean>` |
| `getStatus()` | 获取当前状态 | `string` |
| `getDetailedStatus()` | 获取详细状态 | `GatewayStatus` |
| `getConfig()` | 获取配置 | `object | null` |
| `updateConfig(config)` | 更新配置 | `Promise<void>` |
| `getLogs()` | 获取日志缓冲 | `LogEntry[]` |
| `getLogFiles()` | 获取日志文件列表 | `LogFile[]` |
| `readLogFile(filename)` | 读取日志文件 | `string | null` |
| `setOnStatusChange(cb)` | 设置状态回调 | `void` |
| `setOnLog(cb)` | 设置日志回调 | `void` |

**嵌入式模式初始化**：

```javascript
const { createEmbeddedGateway } = require(embeddedPath);

gateway = await createEmbeddedGateway({
  port: GATEWAY_PORT,
  onLog: (entry) => { /* 日志处理 */ },
  onStatusChange: (status) => { /* 状态变化 */ },
  onReady: () => { /* 就绪 */ },
  onError: (error) => { /* 错误处理 */ }
});

await gateway.start();
```

**日志缓冲**：

```javascript
// 日志条目结构
interface LogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'trace';
  subsystem: string;
  message: string;
}

// 缓冲区自动裁剪
if (logBuffer.length > MAX_LOG_BUFFER) {
  logBuffer = logBuffer.slice(-MAX_LOG_BUFFER);
}
```

### 3.3 gateway.js - CLI 模式管理

**用途**：当嵌入式模式不可用时的降级方案

**启动方式**：

```javascript
// Windows
spawn('npx', ['openclaw', 'gateway', 'start'], {
  shell: true,
  detached: true,
  stdio: 'ignore',
  windowsHide: true
});

// Linux/macOS
spawn('openclaw', ['gateway', 'start'], {
  detached: true,
  stdio: 'ignore'
});
```

**健康检查**：

```javascript
async function checkGatewayRunning() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: GATEWAY_PORT,
      path: '/',
      method: 'GET',
      timeout: 2000
    }, (res) => resolve(true));

    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}
```

### 3.4 tray.js - 系统托盘

**功能**：
- 托盘图标显示
- 右键菜单
- 状态指示
- 快捷操作

**状态图标映射**：

```javascript
const statusEmoji = {
  'running': '🟢',
  'stopped': '🔴',
  'starting': '🟡',
  'stopping': '🟡',
  'error': '🔴',
  'unknown': '⚪'
};
```

**菜单结构**：

```
├── 🟢 OpenClaw Desktop (disabled)
├── ─────────────
├── 显示窗口
├── ─────────────
├── Gateway: 运行中/已停止
├── 启动 Gateway (条件启用)
├── 停止 Gateway (条件启用)
├── 重启 Gateway (条件启用)
├── ─────────────
└── 退出
```

**双击事件**：

```javascript
tray.on('double-click', () => {
  mainWindow.show();
  mainWindow.focus();
});
```

### 3.5 dashboard-server.js - API 服务器

**端口**：`7000`

**API 端点**：

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/sessions` | GET | 获取会话列表 |
| `/api/sessions/:id` | GET | 获取单个会话 |
| `/api/activities` | GET | 获取活动列表 |
| `/api/usage` | GET | 获取使用统计 |
| `/api/costs` | GET | 获取成本数据 |
| `/api/system` | GET | 获取系统状态 |
| `/api/health-history` | GET | 获取健康历史 |
| `/api/gateway/status` | GET | 获取网关状态 |
| `/api/gateway/start` | POST | 启动网关 |
| `/api/gateway/stop` | POST | 停止网关 |
| `/api/memory` | GET | 获取内存文件 |
| `/api/workspace/:file` | GET | 获取工作区文件 |
| `/api/logs` | GET | 获取日志 |

**数据目录**：

```javascript
OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
WORKSPACE_DIR = process.env.WORKSPACE_DIR || os.homedir();

sessDir = path.join(OPENCLAW_DIR, 'agents', AGENT_ID, 'sessions');
dataDir = path.join(WORKSPACE_DIR, 'data');
memoryDir = path.join(WORKSPACE_DIR, 'memory');
```

---

## 4. 应用生命周期

```
App Ready
    │
    ├── 启动 Dashboard Server (port 7000)
    │
    ├── 创建窗口
    │
    ├── 创建系统托盘
    │
    ├── 设置状态推送
    │
    └── 自动启动 Gateway (嵌入式模式)
            │
            ├── 成功 → 状态: running
            │
            └── 失败 → 降级到 CLI 模式
```

---

## 5. 安全特性

### 5.1 Context Isolation

```javascript
webPreferences: {
  nodeIntegration: false,      // 禁用 Node.js 集成
  contextIsolation: true       // 启用上下文隔离
}
```

### 5.2 日志文件路径验证

```javascript
function readLogFile(filename) {
  const logDir = path.join(os.tmpdir(), 'openclaw');
  const filePath = path.join(logDir, filename);

  // 防止路径遍历攻击
  if (!filePath.startsWith(logDir)) {
    throw new Error('Invalid log file path');
  }
  // ...
}
```

### 5.3 单实例锁

```javascript
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();  // 防止多实例运行
}
```

---

## 6. 依赖关系

```
index.js
    ├── embedded-gateway.js ──> openclaw-core/embedded
    │       └── gateway.js (降级)
    ├── tray.js
    └── dashboard-server.js
```

---

## 7. 构建配置

**package.json**:

```json
{
  "main": "src/main/index.js",
  "build": {
    "appId": "ai.openclaw.desktop",
    "productName": "OpenClaw Desktop",
    "extraResources": [
      { "from": "openclaw-core/dist", "to": "openclaw-core/dist" },
      { "from": "openclaw-core/node_modules", "to": "openclaw-core/node_modules" }
    ]
  }
}
```

---

## 8. 开发命令

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 仅构建渲染器
npm run build:renderer
```

---

*此文档由 Claude 自动生成，基于源码分析。*