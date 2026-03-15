# OpenClaw Desktop - 预加载脚本技术文档

> 自动生成于 2026-03-14

## 1. 模块概述

预加载脚本（Preload Script）是 Electron 安全模型的核心组件，负责：
- 在渲染进程加载前注入代码
- 提供安全的 IPC 通信桥接
- 暴露有限的 API 给渲染进程
- 实现上下文隔离（Context Isolation）

---

## 2. 文件位置

```
src/preload/index.js
```

---

## 3. 安全架构

### 3.1 上下文隔离

```
┌─────────────────────────────────────────────────────────────────┐
│                        Main Process                              │
│                      (Node.js 环境)                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ IPC (进程间通信)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Preload Script                             │
│                    (桥接层，隔离上下文)                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ contextBridge.exposeInMainWorld('openclaw', { ... })      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Renderer Process                            │
│                     (Web 环境，无 Node.js)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ window.openclaw.gateway.start()                            │ │
│  │ window.openclaw.gateway.status()                           │ │
│  │ ...                                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 安全配置

主进程窗口配置：

```javascript
new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    nodeIntegration: false,      // 禁用 Node.js 集成
    contextIsolation: true       // 启用上下文隔离
  }
});
```

---

## 4. API 结构

### 4.1 暴露的 API

```javascript
contextBridge.exposeInMainWorld('openclaw', {
  gateway: { /* Gateway 管理 API */ },
  app: { /* 应用控制 API */ },
  platform: /* 平台信息 */,
  versions: /* 版本信息 */
});
```

### 4.2 Gateway API

```javascript
gateway: {
  // 控制方法
  start: () => ipcRenderer.invoke('gateway:start'),
  stop: () => ipcRenderer.invoke('gateway:stop'),
  restart: () => ipcRenderer.invoke('gateway:restart'),

  // 状态查询
  status: () => ipcRenderer.invoke('gateway:status'),
  detailedStatus: () => ipcRenderer.invoke('gateway:detailedStatus'),

  // 状态监听
  onStatusChange: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('gateway:status-update', handler);
    return () => ipcRenderer.removeListener('gateway:status-update', handler);
  },

  // 配置管理
  getConfig: () => ipcRenderer.invoke('gateway:getConfig'),
  updateConfig: (config) => ipcRenderer.invoke('gateway:updateConfig', config),

  // 日志管理
  getLogs: () => ipcRenderer.invoke('gateway:getLogs'),
  getLogFiles: () => ipcRenderer.invoke('gateway:getLogFiles'),
  readLogFile: (filename) => ipcRenderer.invoke('gateway:readLogFile', filename)
}
```

### 4.3 App API

```javascript
app: {
  quit: () => ipcRenderer.invoke('app:quit'),
  minimize: () => ipcRenderer.invoke('app:minimize')
}
```

### 4.4 平台信息

```javascript
platform: process.platform,  // 'win32' | 'darwin' | 'linux'

versions: {
  node: process.versions.node,
  chrome: process.versions.chrome,
  electron: process.versions.electron
}
```

---

## 5. IPC 通信模式

### 5.1 Invoke/Handle 模式（双向通信）

**渲染进程 → 主进程**：

```javascript
// Preload (渲染进程侧)
start: () => ipcRenderer.invoke('gateway:start')

// Main (主进程侧)
ipcMain.handle('gateway:start', async () => {
  return await gateway.start();
});
```

**返回值**：

```typescript
// 渲染进程中的调用
const success = await window.openclaw.gateway.start();
// success: boolean
```

### 5.2 Send/On 模式（单向通信）

**主进程 → 渲染进程（状态推送）**：

```javascript
// Preload (渲染进程侧)
onStatusChange: (callback) => {
  const handler = (event, data) => callback(data);
  ipcRenderer.on('gateway:status-update', handler);
  return () => ipcRenderer.removeListener('gateway:status-update', handler);
}

// Main (主进程侧)
mainWindow.webContents.send('gateway:status-update', { status, error });
```

**使用示例**：

```typescript
// 渲染进程
useEffect(() => {
  const unsubscribe = window.openclaw.gateway.onStatusChange(({ status, error }) => {
    console.log('Status:', status);
    if (error) console.error('Error:', error);
  });

  return () => unsubscribe(); // 清理
}, []);
```

---

## 6. 类型定义

### 6.1 TypeScript 类型扩展

```typescript
// src/renderer/types/index.ts 或 global.d.ts

interface OpenClawGateway {
  start: () => Promise<boolean>;
  stop: () => Promise<boolean>;
  restart: () => Promise<boolean>;
  status: () => Promise<string>;
  detailedStatus: () => Promise<GatewayStatus>;
  onStatusChange: (callback: (data: { status: string; error?: string }) => void) => () => void;
  getConfig: () => Promise<Record<string, unknown> | null>;
  updateConfig: (config: Record<string, unknown>) => Promise<void>;
  getLogs: () => Promise<LogEntry[]>;
  getLogFiles: () => Promise<LogFile[]>;
  readLogFile: (filename: string) => Promise<string | null>;
}

interface OpenClawApp {
  quit: () => Promise<void>;
  minimize: () => Promise<void>;
}

interface OpenClawVersions {
  node: string;
  chrome: string;
  electron: string;
}

interface OpenClawAPI {
  gateway: OpenClawGateway;
  app: OpenClawApp;
  platform: 'win32' | 'darwin' | 'linux';
  versions: OpenClawVersions;
}

declare global {
  interface Window {
    openclaw: OpenClawAPI;
  }
}
```

---

## 7. API 完整列表

| API | 方法 | 参数 | 返回值 | 描述 |
|-----|------|------|--------|------|
| `gateway.start` | invoke | - | `Promise<boolean>` | 启动 Gateway |
| `gateway.stop` | invoke | - | `Promise<boolean>` | 停止 Gateway |
| `gateway.restart` | invoke | - | `Promise<boolean>` | 重启 Gateway |
| `gateway.status` | invoke | - | `Promise<string>` | 获取状态 |
| `gateway.detailedStatus` | invoke | - | `Promise<GatewayStatus>` | 获取详细状态 |
| `gateway.onStatusChange` | on | callback | unsubscribe | 状态变化监听 |
| `gateway.getConfig` | invoke | - | `Promise<object\|null>` | 获取配置 |
| `gateway.updateConfig` | invoke | config | `Promise<void>` | 更新配置 |
| `gateway.getLogs` | invoke | - | `Promise<LogEntry[]>` | 获取日志缓冲 |
| `gateway.getLogFiles` | invoke | - | `Promise<LogFile[]>` | 获取日志文件 |
| `gateway.readLogFile` | invoke | filename | `Promise<string\|null>` | 读取日志文件 |
| `app.quit` | invoke | - | `Promise<void>` | 退出应用 |
| `app.minimize` | invoke | - | `Promise<void>` | 最小化窗口 |

---

## 8. 最佳实践

### 8.1 错误处理

```typescript
// 渲染进程中的错误处理
const handleStart = async () => {
  try {
    const success = await window.openclaw.gateway.start();
    if (!success) {
      toast.error('Failed to start gateway');
    }
  } catch (error) {
    console.error('Gateway start error:', error);
    toast.error(`Error: ${error.message}`);
  }
};
```

### 8.2 清理监听器

```typescript
// React 组件中的清理
useEffect(() => {
  const unsubscribe = window.openclaw.gateway.onStatusChange(handler);
  return () => unsubscribe(); // 组件卸载时清理
}, []);
```

### 8.3 类型安全

```typescript
// 使用类型守卫
if (typeof window.openclaw?.gateway?.start === 'function') {
  await window.openclaw.gateway.start();
}
```

---

## 9. 调试

### 9.1 检查 API 是否可用

```javascript
// 渲染进程控制台
console.log(window.openclaw);
// { gateway: {...}, app: {...}, platform: 'win32', versions: {...} }

console.log(window.openclaw.platform);
// 'win32'

console.log(window.openclaw.versions);
// { node: '...', chrome: '...', electron: '...' }
```

### 9.2 手动调用 API

```javascript
// 测试 Gateway 状态
const status = await window.openclaw.gateway.status();
console.log('Gateway status:', status);

// 测试详细状态
const detailed = await window.openclaw.gateway.detailedStatus();
console.log('Detailed status:', detailed);
```

---

## 10. 安全注意事项

### 10.1 不要暴露的功能

- 文件系统直接访问
- 子进程创建
- 原生模块加载
- 任意 IPC 通道访问

### 10.2 输入验证

主进程应对所有 IPC 参数进行验证：

```javascript
// 主进程
ipcMain.handle('gateway:readLogFile', (_event, filename) => {
  // 验证文件名格式
  if (typeof filename !== 'string' || !filename.endsWith('.log')) {
    throw new Error('Invalid log file name');
  }
  // ...
});
```

### 10.3 最小权限原则

仅暴露必要的 API，避免暴露通用的 IPC 调用能力。

---

## 11. 文件完整代码

```javascript
// src/preload/index.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('openclaw', {
  gateway: {
    start: () => ipcRenderer.invoke('gateway:start'),
    stop: () => ipcRenderer.invoke('gateway:stop'),
    restart: () => ipcRenderer.invoke('gateway:restart'),
    status: () => ipcRenderer.invoke('gateway:status'),
    detailedStatus: () => ipcRenderer.invoke('gateway:detailedStatus'),

    onStatusChange: (callback) => {
      const handler = (event, data) => callback(data);
      ipcRenderer.on('gateway:status-update', handler);
      return () => ipcRenderer.removeListener('gateway:status-update', handler);
    },

    getConfig: () => ipcRenderer.invoke('gateway:getConfig'),
    updateConfig: (config) => ipcRenderer.invoke('gateway:updateConfig', config),

    getLogs: () => ipcRenderer.invoke('gateway:getLogs'),
    getLogFiles: () => ipcRenderer.invoke('gateway:getLogFiles'),
    readLogFile: (filename) => ipcRenderer.invoke('gateway:readLogFile', filename)
  },

  app: {
    quit: () => ipcRenderer.invoke('app:quit'),
    minimize: () => ipcRenderer.invoke('app:minimize')
  },

  platform: process.platform,

  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
```

---

*此文档由 Claude 自动生成，基于源码分析。*