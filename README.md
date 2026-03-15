# OpenClaw Desktop

Electron 桌面应用，为 openclaw-core 提供图形界面。

## 项目定位

openclaw-core 的桌面管理界面，提供：
- Gateway 启动/停止/重启控制
- 会话历史查看
- 日志浏览
- 成本统计
- openclaw-core 原生 UI 嵌入（chat、channels、agents 等）

## 技术栈

| 部分 | 技术 |
|------|------|
| 主进程 | Electron 34, Node.js |
| 渲染进程 | React 19, TypeScript, Vite 8 |
| UI 组件 | Ant Design 6 |
| 状态管理 | Zustand |
| 数据请求 | TanStack Query |
| 国际化 | i18next |
| 网关 | openclaw-core (embedded 模式) |

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
npm run build:win
```

## 项目结构

```
src/
├── main/              # 主进程
│   ├── index.js       # 入口，创建窗口，IPC handlers
│   ├── dashboard-server.js  # API 服务器
│   └── embedded-gateway.js  # 网关管理
├── preload/           # 预加载脚本 (contextBridge)
└── renderer/          # 渲染进程 (React)
    ├── components/    # 页面组件
    │   ├── overview/  # 概览页
    │   ├── sessions/  # 会话列表
    │   ├── costs/     # 成本统计
    │   ├── logs/      # 日志查看
    │   ├── config/    # 配置页
    │   ├── webview/   # openclaw-core UI 嵌入
    │   └── layout/    # 布局组件
    ├── hooks/         # 自定义 hooks
    └── stores/        # Zustand stores
```

## 功能模块

### 已实现

| 页面 | 状态 | 说明 |
|------|------|------|
| 概览 | ✅ | 系统资源、Gateway 控制、最近会话、快速操作 |
| 会话 | ✅ | 会话列表、过滤、排序 |
| 成本 | ✅ | Token 统计、成本分析 |
| 日志 | ✅ | 日志查看、级别过滤 |
| 配置 | ✅ | Gateway 配置编辑 |
| Chat/Channels/Agents | ✅ | openclaw-core 原生 UI 嵌入 |

### 待开发

| 页面 | 状态 |
|------|------|
| Limits | Placeholder |
| Memory | Placeholder |
| Files | Placeholder |

## 核心 API

### IPC 通道 (preload → main)

```javascript
window.openclaw.gateway.start()
window.openclaw.gateway.stop()
window.openclaw.gateway.restart()
window.openclaw.gateway.detailedStatus()
window.openclaw.gateway.onStatusChange(callback)
window.openclaw.gateway.getConfig()
window.openclaw.gateway.updateConfig(config)
window.openclaw.gateway.getLogs()
window.openclaw.gateway.readLogFile(filename)
```

### Dashboard API (前端 → dashboard-server)

| 端点 | 说明 |
|------|------|
| GET /api/sessions | 会话列表 |
| GET /api/system | 系统资源 |
| GET /api/usage | Token 使用统计 |
| GET /api/costs | 成本数据 |
| GET /api/overview/metrics | 概览指标 |
| GET /api/activities | 活动列表 |

## 配置文件

位置：`~/.openclaw/config.json`

```json
{
  "gateway": {
    "port": 18789
  },
  "channels": {
    "telegram": { "enabled": true }
  }
}
```

## 开发注意

1. **openclaw-core 子模块**: 构建时会自动安装依赖，如遇问题可手动执行：
   ```bash
   cd openclaw-core && pnpm install && pnpm build
   ```

2. **开发模式**: `npm run dev` 同时启动 Vite 和 Electron，端口 5173

3. **类型定义**: 窗口 API 类型见 `src/renderer/types/index.ts`

## 相关文档

- [openclaw-core 技术文档](docs/openclaw-core-technical-doc.md)
- [主进程技术文档](docs/main-process-technical-doc.md)
- [渲染进程技术文档](docs/renderer-technical-doc.md)

## License

MIT
