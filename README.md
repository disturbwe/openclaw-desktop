# OpenClaw Desktop

> 🚀 下一代 AI 代理网关桌面应用 - 让 AI 智能体跨平台无缝运行

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-34-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![OpenClaw Core](https://img.shields.io/badge/OpenClaw_Core-2026.3-purple.svg)](https://github.com/openclaw/openclaw-core)

---

## 📖 目录

- [简介](#-简介)
- [核心特性](#-核心特性)
- [架构设计](#-架构设计)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [功能模块](#-功能模块)
- [支持的渠道](#-支持的渠道)
- [项目结构](#-项目结构)
- [开发指南](#-开发指南)
- [配置说明](#-配置说明)
- [常见问题](#-常见问题)
- [贡献指南](#-贡献指南)

---

## 🌟 简介

**OpenClaw Desktop** 是一款功能强大的桌面应用，集成了 **OpenClaw Core** 网关服务，为 AI 代理提供企业级多渠道通信能力。

### 核心价值

| 能力 | 描述 |
|------|------|
| 🔄 **多渠道集成** | 支持 30+ 消息平台，AI 代理一次开发，全平台运行 |
| 🔌 **嵌入式网关** | 内置 OpenClaw Core，零外部依赖，开箱即用 |
| 📊 **实时监控** | 可视化监控消息流转、会话状态、系统资源 |
| 🧩 **插件扩展** | 灵活的插件系统，支持自定义渠道和功能扩展 |
| 🛡️ **安全隔离** | ContextBridge + IPC 通信，确保应用安全性 |

---

## ✨ 核心特性

### 🎯 网关管理
- **一键控制**: 启动/停止/重启嵌入式网关，实时状态反馈
- **配置热更新**: 无需重启即可修改网关参数
- **日志追踪**: 分级日志系统，支持实时流式查看和历史查询

### 📱 全渠道支持
- **即时通讯**: Telegram, Discord, WhatsApp, Slack, Signal
- **社交平台**: 微信，飞书，钉钉，LINE
- **邮件服务**: Gmail, Outlook, IMAP
- **短信服务**: Android SMS, Twilio
- **持续扩展**: 30+ 平台支持，更多渠道不断添加中

### 📈 监控仪表盘
- **系统资源**: CPU、内存、磁盘实时仪表盘
- **会话追踪**: 查看历史会话、消息计数、Token 消耗
- **成本分析**: 按模型、按日期、按会话统计 AI 成本
- **活动流**: 实时展示 AI 代理运行状态

### 🎨 现代化 UI
- **响应式设计**: 自适应窗口大小，最佳视觉体验
- **深色主题**: 护眼的深色配色方案
- **国际化**: i18next 多语言支持
- **流畅动画**: 优雅的状态过渡效果

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                     OpenClaw Desktop                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    渲染进程 (Renderer)                       ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐  ││
│  │  │ Overview     │ │ Sessions     │ │ Costs / Logs / ...  │  ││
│  │  │ Dashboard    │ │ 会话管理     │ │ 其他功能页面        │  ││
│  │  └──────────────┘ ┴──────────────┘ ┴─────────────────────┘  ││
│  │                          │                                   ││
│  │                    (IPC via contextBridge)                  ││
│  └──────────────────────────┼───────────────────────────────────┘│
│                             │                                     │
│  ┌──────────────────────────┼───────────────────────────────────┐│
│  │                    主进程 (Main)                              ││
│  │  ┌──────────────┐ ┌─────┴──────┐ ┌──────────────────────┐   ││
│  │  │ BrowserWindow│ │ IPC Handler│ │ Dashboard Server     │   ││
│  │  │ 窗口管理     │ │ 通信桥接   │ │ API 服务器 (/api/*)   │   ││
│  │  └──────────────┘ └────────────┘ └──────────────────────┘   ││
│  │                          │                                   ││
│  │              ┌───────────┴───────────┐                      ││
│  │              │  Embedded Gateway     │                      ││
│  │              │  (OpenClaw Core)      │                      ││
│  │              └───────────┬───────────┘                      ││
│  └──────────────────────────┼───────────────────────────────────┘│
│                             │                                     │
└─────────────────────────────┼─────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │ 30+ 消息平台  │    │  AI Providers │    │  插件系统    │
  │ Telegram     │    │  Claude       │    │  自定义渠道  │
  │ Discord      │    │  OpenAI       │    │  扩展功能    │
  │ WhatsApp     │    │  Ollama       │    │              │
  └──────────────┘    └──────────────┘    └──────────────┘
```

---

## 🛠️ 技术栈

### 核心框架

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **主进程** | Electron | 34.x | 桌面应用框架 |
| **渲染进程** | React | 19.x | UI 组件库 |
| **构建工具** | Vite | 8.x | 快速开发和构建 |
| **状态管理** | Zustand | 5.x | 轻量级状态管理 |
| **数据请求** | TanStack Query | 5.x | 服务端状态管理 |
| **UI 组件** | Ant Design | 6.x | 企业级组件库 |
| **图标** | Ant Design Icons | 6.x | 图标库 |
| **国际化** | i18next | 25.x | 多语言支持 |
| **路由** | React Router | 7.x | 页面路由 |

### 网关核心

| 组件 | 技术 | 描述 |
|------|------|------|
| **OpenClaw Core** | TypeScript/Node.js | 核心网关服务 |
| **ACP** | Agent Client Protocol | 代理通信协议 |
| **Channels** | 多渠道适配层 | 统一消息接口 |
| **Plugins** | 插件 SDK | 扩展开发框架 |

### IPC 通信

```javascript
// 预加载脚本 (preload/index.js)
contextBridge.exposeInMainWorld('openclaw', {
  gateway: {
    start: () => ipcRenderer.invoke('gateway:start'),
    onStatusChange: (cb) => { /* 事件监听 */ }
  },
  navigate: (path) => ipcRenderer.invoke('navigate', path)
});
```

---

## 🚀 快速开始

### 环境要求

- **Node.js**: 18.x 或更高版本
- **pnpm**: 推荐包管理器 (或使用 npm)
- **Git**: 用于克隆子模块

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd OpenClaw-Desktop

# 安装主项目依赖
npm install

# 安装 openclaw-core 依赖（自动执行）
# postinstall 脚本会自动处理
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 或分别启动
npm run dev:vite    # 仅启动 Vite
npm run dev:all     # 同时启动 Vite + Electron
```

### 构建应用

```bash
# 构建当前平台
npm run build

# 构建 Windows 版本
npm run build:win

# 仅构建渲染进程
npm run build:renderer

# 仅构建 UI 组件
npm run build:ui
```

### 打包发布

构建产物位于 `release/` 目录，包含可执行安装程序。

---

## 📦 功能模块

### 1. 概览仪表盘 (Overview)

```tsx
// 核心功能
- 系统资源实时监控 (CPU/RAM/Disk)
- Gateway 状态快速控制
- 最近会话列表
- 活动流展示
- 快速操作入口
```

### 2. 网关控制 (Gateway Control)

```tsx
// GatewayControl.tsx
- 启动/停止/重启网关
- 实时状态显示
- 错误处理和提示
- 状态变化订阅
```

### 3. 会话管理 (Sessions)

```tsx
// SessionsPage.tsx
- 会话列表展示
- 状态过滤 (运行/完成/中止)
- 搜索功能
- 排序 (时间/消息数/Token/成本)
- 分页显示
```

### 4. 成本分析 (Costs)

```tsx
// CostsPage.tsx
- 总体成本统计
- 按模型分类统计
- 按日期趋势展示
- 按会话明细展示
```

### 5. 日志查看 (Logs)

```tsx
// LogsPage.tsx
- 实时日志流
- 日志级别过滤
- 日志文件浏览
- 日志内容查看
```

### 6. 配置管理 (Config)

```tsx
// ConfigPage.tsx
- 网关配置编辑
- 渠道配置
- AI Provider 配置
- 配置保存/应用
```

---

## 🌐 支持的渠道

| 类别 | 平台 | SDK |
|------|------|-----|
| **即时通讯** | Telegram | grammy |
| | Discord | @discordjs/voice |
| | WhatsApp | @whiskeysockets/baileys |
| | Slack | @slack/bolt |
| | Signal | libsignal |
| **社交平台** | 微信 | WeChaty |
| | 飞书 | @larksuiteoapi/node-sdk |
| | 钉钉 | DingTalk SDK |
| | LINE | @line/bot-sdk |
| | Matrix | matrix-js-sdk |
| **邮件** | Gmail | Google API |
| | Outlook | Microsoft Graph |
| | IMAP | imapflow |
| **短信** | Android SMS | 本地集成 |
| | Twilio | twilio |
| **其他** | IRC | irc-framework |
| | Nostr | nostr-tools |
| | Twitch | tmi.js |

> 💡 提示：更多渠道支持请参考 [OpenClaw Core 文档](openclaw-core/docs/)

---

## 📁 项目结构

```
OpenClaw-Desktop/
├── src/
│   ├── main/                     # Electron 主进程
│   │   ├── index.js              # 应用入口，窗口管理，IPC 注册
│   │   ├── dashboard-server.js   # Dashboard API 服务器
│   │   ├── embedded-gateway.js   # 嵌入式网关管理
│   │   ├── tray.js               # 系统托盘
│   │   └── ...
│   │
│   ├── preload/                  # 预加载脚本 (IPC 桥接)
│   │   └── index.js              # contextBridge 暴露 API
│   │
│   └── renderer/                 # React 渲染进程
│       ├── components/           # UI 组件
│       │   ├── overview/         # 概览页面
│       │   │   ├── OverviewPage.tsx
│       │   │   ├── MetricCards.tsx
│       │   │   ├── QuickActions.tsx
│       │   │   ├── RecentSessions.tsx
│       │   │   └── ActivityFeed.tsx
│       │   ├── gateway/          # 网关控制
│       │   │   └── GatewayControl.tsx
│       │   ├── sessions/         # 会话管理
│       │   │   └── SessionsPage.tsx
│       │   ├── costs/            # 成本分析
│       │   │   └── CostsPage.tsx
│       │   ├── logs/             # 日志查看
│       │   │   └── LogsPage.tsx
│       │   ├── config/           # 配置管理
│       │   │   └── ConfigPage.tsx
│       │   ├── webview/          # WebView 容器
│       │   │   └── WebViewPage.tsx
│       │   └── layout/           # 布局组件
│       │       ├── Sidebar.tsx
│       │       └── StatusBar.tsx
│       │
│       ├── hooks/                # 自定义 Hooks
│       │   ├── useApi.ts         # API 请求封装
│       │   └── ...
│       │
│       ├── types/                # TypeScript 类型
│       │   └── index.ts
│       │
│       ├── locales/              # 国际化文件
│       │   ├── en.json
│       │   └── zh.json
│       │
│       ├── App.tsx               # 应用根组件
│       └── main.tsx              # 渲染入口
│
├── openclaw-core/                # OpenClaw Core 子模块
│   ├── src/
│   │   ├── acp/                  # Agent Client Protocol
│   │   ├── channels/             # 渠道管理
│   │   ├── embedded/             # 嵌入式 API
│   │   ├── plugin-sdk/           # 插件 SDK
│   │   └── ...
│   └── dist/                     # 构建产物
│
├── docs/                         # 技术文档
│   ├── openclaw-core-technical-doc.md
│   ├── main-process-technical-doc.md
│   ├── renderer-technical-doc.md
│   └── preload-technical-doc.md
│
├── assets/                       # 静态资源
│   └── icon.ico
│
├── package.json                  # 项目配置
├── tsconfig.json                 # TypeScript 配置
└── vite.config.ts                # Vite 配置
```

---

## 📝 开发指南

### 添加新页面

1. 在 `src/renderer/components/` 创建新组件
2. 在 `App.tsx` 中注册路由
3. 在 `Sidebar.tsx` 添加菜单项

### 添加 IPC 通道

```javascript
// 1. 在主进程 (index.js) 添加 handler
ipcMain.handle('custom:action', async (event, data) => {
  // 处理逻辑
  return result;
});

// 2. 在预加载脚本 (preload/index.js) 暴露 API
contextBridge.exposeInMainWorld('openclaw', {
  custom: {
    action: (data) => ipcRenderer.invoke('custom:action', data)
  }
});

// 3. 在渲染进程使用
const result = await window.openclaw.custom.action(data);
```

### 扩展渠道支持

1. 在 `openclaw-core/extensions/` 创建渠道扩展
2. 实现 `Channel` 接口
3. 在配置中启用渠道

### 插件开发

参考 [OpenClaw Core 插件 SDK](openclaw-core/src/plugin-sdk/) 文档。

---

## ⚙️ 配置说明

### 环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件
OPENCLAW_GATEWAY_TOKEN=your_token
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 网关配置 (JSON)

```json
{
  "gateway": {
    "port": 18789,
    "bind": "localhost"
  },
  "channels": {
    "telegram": { "enabled": true, "token": "..." },
    "discord": { "enabled": true, "token": "..." },
    "whatsapp": { "enabled": false }
  },
  "providers": {
    "anthropic": { "apiKey": "..." },
    "openai": { "apiKey": "..." },
    "ollama": { "baseUrl": "http://localhost:11434" }
  }
}
```

### 配置文件位置

| 系统 | 路径 |
|------|------|
| Windows | `%USERPROFILE%\.openclaw\config.json` |
| macOS | `~/.openclaw/config.json` |
| Linux | `~/.openclaw/config.json` |

---

## ❓ 常见问题

### Q: 网关无法启动？

**A**: 检查以下几点：
1. 端口 18789 是否被占用
2. 查看 `~/.openclaw/logs/` 日志文件
3. 确认配置文件格式正确

### Q: 如何查看日志？

**A**: 两种方式：
1. 应用内：点击导航栏「日志」查看实时日志
2. 文件系统：`~/.openclaw/logs/` 目录查看历史日志

### Q: 支持哪些 AI 模型？

**A**: 支持主流 AI 提供者：
- **Claude** (Anthropic)
- **GPT** (OpenAI)
- **Gemini** (Google)
- **Ollama** (本地运行)
- 以及任何兼容 OpenAI API 格式的服务

### Q: 如何添加新渠道？

**A**: 参考「开发指南 - 扩展渠道支持」章节，或查看 [OpenClaw Core 文档](openclaw-core/docs/)。

### Q: 应用卡住或无响应？

**A**: 尝试：
1. 完全退出应用（包括系统托盘）
2. 清理 `~/.openclaw/` 缓存
3. 重新启动应用

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 贡献流程

1. **Fork** 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交 **Pull Request**

### 开发规范

- 遵循 ESLint 和 Prettier 规范
- 为新功能添加测试
- 更新相关文档
- 使用语义化提交信息

### 提交信息格式

```
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | test | chore
scope: 影响范围（可选）
subject: 简短描述
```

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [OpenClaw Core](https://github.com/openclaw/openclaw-core) - 核心网关库
- [Electron](https://www.electronjs.org/) - 跨平台桌面框架
- [React](https://react.dev/) - UI 库
- [Ant Design](https://ant.design/) - 设计系统
- [Vite](https://vite.dev/) - 构建工具
- [Zustand](https://zustand-demo.pmnd.rs/) - 状态管理

---

## 📬 联系方式

- **GitHub Issues**: [提交问题](https://github.com/openclaw/openclaw-desktop/issues)
- **讨论区**: [GitHub Discussions](https://github.com/openclaw/openclaw-desktop/discussions)

---

> ⚠️ **注意**: 本项目仅供学习和研究使用。使用本项目时，请遵守各平台的服务条款和 API 使用规范，合法合规地使用 AI 代理服务。

---

<p align="center">Made with ❤️ by OpenClaw Team</p>
