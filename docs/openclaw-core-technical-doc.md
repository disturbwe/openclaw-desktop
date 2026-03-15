# OpenClaw Core 技术文档

> 自动生成于 2026-03-14

## 1. 项目概述

**OpenClaw Core** 是一个多渠道 AI 网关核心库，提供可扩展的消息平台集成能力。它允许开发者构建能够跨多个消息平台（Telegram、Discord、WhatsApp、Slack 等 30+ 平台）运行的 AI 代理应用。

### 核心特性

- **多渠道集成**: 支持 30+ 消息平台
- **嵌入式网关**: 可嵌入桌面应用（Electron、Tauri 等）
- **插件系统**: 可扩展的插件架构
- **ACP 协议**: Agent Client Protocol 实现
- **多平台支持**: Android、iOS、macOS、Node.js

---

## 2. 项目结构

```
openclaw-core/
├── src/                          # 源代码
│   ├── acp/                      # Agent Client Protocol
│   │   ├── client.ts             # ACP 客户端
│   │   ├── server.ts             # ACP 服务器
│   │   ├── session.ts            # 会话管理
│   │   ├── translator.ts         # 协议转换器
│   │   ├── control-plane/        # 控制平面管理
│   │   └── runtime/              # 运行时组件
│   │
│   ├── agents/                   # 代理管理
│   │   ├── auth-profiles.ts      # 认证配置管理
│   │   ├── auth-profiles/        # 认证子模块
│   │   │   ├── oauth.ts          # OAuth 认证
│   │   │   ├── credential-state.ts
│   │   │   └── doctor.ts         # 诊断工具
│   │   ├── acp-spawn.ts          # ACP 进程生成
│   │   └── apply-patch.ts        # 补丁应用
│   │
│   ├── channels/                 # 渠道/通道管理
│   │   ├── dock.ts               # 渠道对接核心
│   │   ├── registry.ts           # 渠道注册表
│   │   ├── session.ts            # 会话管理
│   │   ├── targets.ts            # 消息目标处理
│   │   ├── typing.ts             # 输入状态
│   │   ├── status-reactions.ts   # 状态反应
│   │   ├── allowlists/           # 白名单管理
│   │   ├── plugins/              # 渠道插件
│   │   ├── transport/            # 传输层
│   │   └── web/                  # Web 渠道
│   │
│   ├── cli/                      # 命令行接口
│   │   ├── program/              # CLI 程序构建
│   │   ├── deps.ts               # 依赖注入
│   │   ├── prompt.ts             # 交互提示
│   │   └── profile.ts            # 配置文件管理
│   │
│   ├── config/                   # 配置管理
│   │   ├── config.ts             # 配置加载
│   │   └── sessions.ts           # 会话存储
│   │
│   ├── embedded/                 # 嵌入式 API
│   │   └── index.ts              # 嵌入式网关接口
│   │
│   ├── gateway/                  # 网关服务
│   │   └── server.impl.ts        # 网关服务器实现
│   │
│   ├── plugin-sdk/               # 插件开发 SDK
│   │   └── index.ts              # SDK 入口
│   │
│   ├── plugins/                  # 内置插件
│   │
│   ├── memory/                   # 内存/上下文管理
│   │
│   ├── context-engine/           # 上下文引擎
│   │
│   ├── infra/                    # 基础设施
│   │   ├── binaries.ts           # 二进制管理
│   │   ├── dotenv.ts             # 环境变量
│   │   ├── ports.ts              # 端口管理
│   │   └── warning-filter.ts     # 警告过滤
│   │
│   ├── logging/                  # 日志系统
│   │
│   ├── process/                  # 进程管理
│   │
│   ├── providers/                # AI 提供者
│   │
│   ├── routing/                  # 路由系统
│   │
│   ├── security/                 # 安全模块
│   │
│   ├── sessions/                 # 会话管理
│   │
│   ├── tui/                      # 终端 UI
│   │
│   └── utils.ts                  # 工具函数
│
├── extensions/                   # 扩展模块
├── apps/                         # 平台应用
│   ├── android/                  # Android 应用
│   ├── ios/                      # iOS 应用
│   └── macos/                    # macOS 应用
│
├── dist/                         # 构建输出
├── docs/                         # 文档
└── openclaw.mjs                  # CLI 入口
```

---

## 3. 核心模块详解

### 3.1 ACP (Agent Client Protocol)

ACP 是 OpenClaw 的核心协议，用于处理 AI 代理与客户端之间的通信。

**主要组件**:

| 文件 | 描述 |
|------|------|
| `client.ts` | ACP 客户端实现 |
| `server.ts` | ACP 服务器实现 |
| `session.ts` | 会话生命周期管理 |
| `translator.ts` | 协议消息转换 |
| `control-plane/manager.ts` | 控制平面管理器 |
| `runtime/registry.ts` | 运行时注册表 |

**类型定义** (`acp/types.ts`):

```typescript
type AcpSession = {
  sessionId: SessionId;
  sessionKey: string;
  cwd: string;
  createdAt: number;
  lastTouchedAt: number;
  abortController: AbortController | null;
  activeRunId: string | null;
};

type AcpServerOptions = {
  gatewayUrl?: string;
  gatewayToken?: string;
  gatewayPassword?: string;
  defaultSessionKey?: string;
  requireExistingSession?: boolean;
  resetSession?: boolean;
  provenanceMode?: AcpProvenanceMode;
};
```

### 3.2 Channels (渠道管理)

多渠道集成是 OpenClaw 的核心功能，支持 30+ 消息平台。

**支持的平台** (通过 plugin-sdk 导出):

| 平台 | 导出路径 |
|------|----------|
| Telegram | `openclaw/plugin-sdk/telegram` |
| Discord | `openclaw/plugin-sdk/discord` |
| Slack | `openclaw/plugin-sdk/slack` |
| WhatsApp | `openclaw/plugin-sdk/whatsapp` |
| Signal | `openclaw/plugin-sdk/signal` |
| iMessage | `openclaw/plugin-sdk/imessage` |
| Matrix | `openclaw/plugin-sdk/matrix` |
| IRC | `openclaw/plugin-sdk/irc` |
| LINE | `openclaw/plugin-sdk/line` |
| Microsoft Teams | `openclaw/plugin-sdk/msteams` |
| Google Chat | `openclaw/plugin-sdk/googlechat` |
| Feishu (飞书) | `openclaw/plugin-sdk/feishu` |
| Nostr | `openclaw/plugin-sdk/nostr` |
| Twitch | `openclaw/plugin-sdk/twitch` |
| Mattermost | `openclaw/plugin-sdk/mattermost` |
| Zalo | `openclaw/plugin-sdk/zalo` |
| ... | 更多平台 |

**核心文件**:

- `dock.ts` - 渠道对接核心逻辑 (21KB)
- `registry.ts` - 渠道注册表
- `session.ts` - 渠道会话管理
- `targets.ts` - 消息目标路由
- `status-reactions.ts` - 状态反应处理

### 3.3 Embedded Gateway (嵌入式网关)

为桌面应用提供简化的 API 接口。

**使用示例**:

```typescript
import { createEmbeddedGateway } from 'openclaw/embedded';

const gateway = await createEmbeddedGateway({
  port: 18789,
  onLog: (entry) => console.log(entry),
  onStatusChange: (status) => console.log(status),
  onReady: () => console.log('Gateway ready'),
  onError: (error) => console.error(error),
});

await gateway.start();

// 获取状态
const status = gateway.getStatus();
// { state: 'running', port: 18789, uptime: 12345, connections: 5, channels: {} }

// 停止网关
await gateway.stop('User requested');
```

**接口定义**:

```typescript
interface EmbeddedGateway {
  start(): Promise<void>;
  stop(reason?: string): Promise<void>;
  getStatus(): GatewayStatus;
  getConfig(): OpenClawConfig | null;
  updateConfig(config: Partial<OpenClawConfig>): Promise<void>;
  subscribeToLogs(callback: (entry: LogEntry) => void): () => void;
}

interface GatewayStatus {
  state: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  port: number;
  uptime: number;
  connections: number;
  channels: Record<string, ChannelStatus>;
  lastError?: string;
}
```

### 3.4 Agents (代理管理)

处理 AI 代理的认证和配置管理。

**主要功能**:

- `auth-profiles.ts` - 认证配置管理
- `auth-profiles/oauth.ts` - OAuth 认证流程
- `auth-profiles/credential-state.ts` - 凭证状态管理
- `auth-profiles/doctor.ts` - 认证诊断工具
- `acp-spawn.ts` - ACP 进程生成
- `api-key-rotation.ts` - API 密钥轮换

---

## 4. CLI 命令

OpenClaw 提供丰富的命令行工具：

```bash
# 启动网关
openclaw gateway

# 开发模式
openclaw --dev gateway

# 启动 TUI (终端 UI)
openclaw tui

# 代理 RPC 模式
openclaw agent --mode rpc --json

# 构建
pnpm build

# 测试
pnpm test
pnpm test:live          # 实时测试
pnpm test:e2e           # 端到端测试

# 代码检查
pnpm lint
pnpm format
pnpm check
```

---

## 5. 配置

### 环境变量

| 变量 | 描述 |
|------|------|
| `OPENCLAW_SKIP_CHANNELS` | 跳过渠道初始化 |
| `OPENCLAW_PROFILE` | 运行配置 (dev/production) |
| `OPENCLAW_NO_RESPAWN` | 禁用进程重生 |
| `NODE_DISABLE_COMPILE_CACHE` | 禁用编译缓存 |

### 配置文件

配置通过 `config/config.ts` 加载，支持：

- JSON 配置文件
- 环境变量覆盖
- 命令行参数

---

## 6. 插件系统

### Plugin SDK

OpenClaw 提供完整的插件开发 SDK：

```typescript
// 核心插件 API
import { createPlugin } from 'openclaw/plugin-sdk/core';

// 平台特定 SDK
import { createTelegramPlugin } from 'openclaw/plugin-sdk/telegram';
import { createDiscordPlugin } from 'openclaw/plugin-sdk/discord';
import { createSlackPlugin } from 'openclaw/plugin-sdk/slack';
```

### 内置插件

位于 `src/plugins/` 和 `extensions/` 目录，包括：

- `voice-call` - 语音通话
- `memory-core` - 核心内存
- `memory-lancedb` - LanceDB 内存存储
- `diagnostics-otel` - OpenTelemetry 诊断
- `device-pair` - 设备配对
- `phone-control` - 手机控制

---

## 7. 技术栈

### 核心依赖

| 类别 | 依赖 | 版本 |
|------|------|------|
| 运行时 | Node.js | >=22.16.0 |
| 语言 | TypeScript | ^5.9.3 |
| 包管理 | pnpm | 10.23.0 |
| Web 框架 | Hono | 4.12.7 |
| HTTP | Express | ^5.2.1 |
| WebSocket | ws | ^8.19.0 |
| 验证 | Zod | ^4.3.6 |
| Schema | @sinclair/typebox | 0.34.48 |

### 平台 SDK

| 平台 | SDK |
|------|-----|
| Telegram | grammy ^1.41.1 |
| Discord | @discordjs/voice ^0.19.1 |
| Slack | @slack/bolt ^4.6.0 |
| WhatsApp | @whiskeysockets/baileys 7.0.0-rc.9 |
| LINE | @line/bot-sdk ^10.6.0 |
| Feishu | @larksuiteoapi/node-sdk ^1.59.0 |

### AI/ML

| 功能 | 依赖 |
|------|------|
| MCP | @modelcontextprotocol/sdk 1.27.1 |
| ACP | @agentclientprotocol/sdk 0.16.1 |
| Bedrock | @aws-sdk/client-bedrock ^3.1009.0 |
| PDF | pdfjs-dist ^5.5.207 |
| TTS | node-edge-tts ^1.2.10 |

### 开发工具

| 工具 | 用途 |
|------|------|
| tsdown | 构建 |
| Vitest | 测试 |
| oxlint | Linting |
| oxfmt | 格式化 |

---

## 8. 构建与发布

### 构建

```bash
# 完整构建
pnpm build

# Docker 构建
pnpm build:docker

# 仅 SDK 类型定义
pnpm build:plugin-sdk:dts
```

### 发布模块

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./embedded": "./dist/embedded/index.js",
    "./plugin-sdk": "./dist/plugin-sdk/index.js",
    "./plugin-sdk/core": "./dist/plugin-sdk/core.js",
    "./plugin-sdk/telegram": "./dist/plugin-sdk/telegram.js",
    "./plugin-sdk/discord": "./dist/plugin-sdk/discord.js"
    // ... 更多导出
  }
}
```

---

## 9. 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Desktop Application                       │
│                    (Electron / Tauri / etc.)                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Embedded Gateway API                        │
│                      (src/embedded/index.ts)                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Gateway Server                           │
│                      (src/gateway/server.impl.ts)                │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  ACP Server   │     │    Channels   │     │  Plugin SDK   │
│  (src/acp/)   │     │(src/channels/)|     │(src/plugin-sdk)│
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  AI Providers │     │ 30+ Messaging │     │   Extensions   │
│   (Claude,    │     │   Platforms   │     │   (Voice,     │
│   OpenAI...)  │     │(Telegram,     │     │   Memory...)   │
│               │     │ Discord...)   │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## 10. 在 OpenClaw-Desktop 中的使用

OpenClaw-Desktop 项目通过嵌入 `openclaw-core` 子模块来提供 AI 网关功能：

```javascript
// src/main/gateway.js 或 dashboard-server.js
import { createEmbeddedGateway } from 'openclaw-core/embedded';

const gateway = await createEmbeddedGateway({
  port: 18789,
  onLog: (entry) => sendToRenderer('log', entry),
  onStatusChange: (status) => sendToRenderer('status', status),
});
```

---

## 11. 相关链接

- **GitHub**: https://github.com/openclaw/openclaw
- **Issues**: https://github.com/openclaw/openclaw/issues
- **License**: MIT
- **Version**: 2026.3.14

---

*此文档由 Claude 自动生成，基于源码分析。*