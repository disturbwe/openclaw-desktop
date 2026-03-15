# OpenClaw Desktop

> 多功能 AI 网关桌面应用 - 让 AI 代理跨平台运行

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-34-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

## 简介

OpenClaw Desktop 是一个功能强大的桌面应用，集成了 **OpenClaw Core** 网关服务，让你能够轻松管理和运行跨平台的 AI 代理。

通过 OpenClaw，你可以：
- 将 AI 代理连接到 30+ 个消息平台（Telegram、Discord、WhatsApp、Slack 等）
- 在本地运行嵌入式网关，无需外部依赖
- 通过美观的 UI 管理所有渠道和会话
- 实时监控 AI 代理状态和消息流转

## 核心特性

- **多渠道集成**: 支持 Telegram、Discord、WhatsApp、Slack、微信、飞书等 30+ 平台
- **嵌入式网关**: 内置 OpenClaw Core，无需单独部署
- **实时监控**: 查看消息流转、会话状态和系统日志
- **插件系统**: 支持扩展插件，自定义功能
- **跨平台**: 支持 Windows、macOS、Linux

## 技术栈

| 层级 | 技术 |
|------|------|
| 主进程 | Electron 34, Node.js |
| 渲染进程 | React 19, Zustand, Vite |
| UI 组件 | Ant Design 6 |
| 国际化 | i18next |
| 网关核心 | OpenClaw Core (嵌入式) |
| IPC 通信 | contextBridge, ipcRenderer |

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动开发服务器（Vite + Electron）
npm run dev
```

### 构建应用

```bash
# 构建 Windows 版本
npm run build:win

# 构建所有平台
npm run build
```

## 项目结构

```
OpenClaw-Desktop/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── index.js    # 应用入口
│   │   ├── gateway.js  # 网关管理
│   │   └── tray.js     # 系统托盘
│   ├── preload/        # 预加载脚本 (IPC 桥接)
│   └── renderer/       # React 渲染进程 (UI)
├── openclaw-core/      # OpenClaw Core 子模块
├── docs/               # 技术文档
└── package.json
```

## 主要功能模块

### 1. 网关管理
- 启动/停止/重启嵌入式网关
- 查看网关状态和详细运行信息
- 配置网关参数

### 2. 渠道管理
- 添加和配置消息渠道
- 渠道状态监控
- 白名单管理

### 3. 会话查看
- 实时消息流
- 会话历史
- AI 交互记录

### 4. 系统监控
- 资源使用情况
- 日志查看
- 错误诊断

## 支持的渠道

| 类别 | 平台 |
|------|------|
| 即时通讯 | Telegram, WhatsApp, Discord, Slack |
| 社交平台 | 微信，飞书，钉钉 |
| 邮件 | Gmail, Outlook, IMAP |
| 短信 | Android SMS, Twilio |
| 其他 | 更多平台持续添加中... |

## 配置说明

### 环境变量

复制 `.env.example` 到 `.env` 并配置：

```bash
# 网关配置
OPENCLAW_GATEWAY_TOKEN=your_token_here

# AI 提供者配置
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 网关配置

通过 UI 界面或修改配置文件：

```json
{
  "gateway": {
    "port": 18789,
    "bind": "localhost"
  },
  "channels": {
    "telegram": { "enabled": true },
    "discord": { "enabled": true }
  }
}
```

## 开发指南

### 添加新渠道

1. 在 `openclaw-core/extensions/` 创建新的渠道扩展
2. 实现渠道接口
3. 在主应用中注册

### 自定义 UI

1. 修改 `src/renderer/` 下的组件
2. 使用 Ant Design 组件库
3. 支持主题定制

## 常见问题

### Q: 网关无法启动？
A: 检查端口 18789 是否被占用，或查看日志文件。

### Q: 如何查看日志？
A: 在应用内点击「系统」→「日志」，或查看 `~/.openclaw/logs/` 目录。

### Q: 支持哪些 AI 模型？
A: 支持 OpenAI、Anthropic、Ollama 等主流提供者。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 致谢

- [OpenClaw Core](https://github.com/OpenClaw/openclaw-core) - 核心网关库
- [Electron](https://www.electronjs.org/) - 跨平台桌面框架
- [React](https://react.dev/) - UI 库
- [Ant Design](https://ant.design/) - 设计系统

---

**注意**: 本项目仅供学习和研究使用。请遵守各平台的服务条款和 API 使用规范。
