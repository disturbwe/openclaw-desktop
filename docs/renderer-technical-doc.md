# OpenClaw Desktop - 渲染进程技术文档

> 自动生成于 2026-03-14

## 1. 模块概述

渲染进程是 Electron 应用的 UI 层，基于 React 19 构建，提供：
- 多页面仪表盘界面
- 实时数据展示
- Gateway 状态监控
- 插件系统扩展
- 国际化支持 (i18n)

---

## 2. 文件结构

```
src/renderer/
├── main.tsx              # 应用入口
├── App.tsx               # 主应用组件
├── App.css               # 应用样式
├── i18n.ts               # 国际化配置
│
├── components/           # UI 组件
│   ├── layout/           # 布局组件
│   │   ├── Sidebar.tsx   # 侧边栏
│   │   └── StatusBar.tsx # 状态栏
│   │
│   ├── common/           # 通用组件
│   │   ├── Button.tsx    # 按钮
│   │   ├── Card.tsx      # 卡片
│   │   └── Chip.tsx      # 标签
│   │
│   ├── overview/         # 概览页面
│   │   └── OverviewPage.tsx
│   │
│   ├── sessions/         # 会话页面
│   │   └── SessionsPage.tsx
│   │
│   ├── costs/            # 成本页面
│   │   └── CostsPage.tsx
│   │
│   ├── feed/             # 实时动态页面
│   │   └── LiveFeedPage.tsx
│   │
│   ├── logs/             # 日志页面
│   │   └── LogsPage.tsx
│   │
│   └── config/           # 配置页面
│       └── ConfigPage.tsx
│
├── stores/               # 状态管理
│   └── appStore.ts       # Zustand stores
│
├── hooks/                # 自定义 Hooks
│   ├── useApi.ts         # API 请求
│   └── useTheme.ts       # 主题管理
│
├── plugins/              # 插件系统
│   ├── index.ts          # 插件加载
│   ├── registry.ts       # 插件注册表
│   └── examples/         # 示例插件
│
├── types/                # TypeScript 类型
│   └── index.ts
│
├── locales/              # 国际化资源
│   ├── zh.json           # 中文
│   └── en.json           # 英文
│
└── styles/               # 样式文件
    └── base.css
```

---

## 3. 核心组件详解

### 3.1 App.tsx - 主应用组件

**路由策略**：基于 Zustand 状态的简单路由（非 React Router）

**页面映射**：

| 页面 ID | 组件 | 描述 |
|---------|------|------|
| `overview` | `<OverviewPage />` | 概览 |
| `sessions` | `<SessionsPage />` | 会话列表 |
| `costs` | `<CostsPage />` | 成本统计 |
| `limits` | `<PlaceholderPage />` | 限制管理 (待实现) |
| `memory` | `<PlaceholderPage />` | 内存管理 (待实现) |
| `files` | `<PlaceholderPage />` | 文件管理 (待实现) |
| `feed` | `<LiveFeedPage />` | 实时动态 |
| `logs` | `<LogsPage />` | 日志查看 |
| `config` | `<ConfigPage />` | 配置管理 |

**布局结构**：

```tsx
<div className="app">
  <Sidebar />     {/* 侧边导航 */}
  <main className="main">
    {renderPage()}  {/* 页面内容 */}
  </main>
  <StatusBar />   {/* 底部状态栏 */}
</div>
```

**插件页面集成**：

```tsx
// 优先检查插件注册的页面
const pluginPages = pluginRegistry.getHook('page:register');
const pluginPage = pluginPages.find(p => p.id === currentPage);
if (pluginPage) {
  const PageComponent = pluginPage.component;
  return (
    <React.Suspense fallback={<div>{t('common.loading')}</div>}>
      <PageComponent />
    </React.Suspense>
  );
}
```

### 3.2 状态管理 (Zustand)

**Store 结构**：

```typescript
// 应用状态
interface AppStore {
  currentPage: string;
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  setCurrentPage: (page: string) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

// 数据状态
interface DataStore {
  systemStats: SystemStats | null;
  sessions: SessionsState;
  activities: ActivityItem[];
  usageData: UsageData | null;
  gatewayStatus: GatewayStatus | null;
  // setters...
}

// 设置状态
interface SettingsStore {
  autoRefresh: boolean;
  refreshInterval: number;
  theme: 'dark' | 'light' | 'system';
  // setters...
}
```

**使用示例**：

```tsx
const { currentPage } = useAppStore();
const { systemStats, setSystemStats } = useDataStore();
```

### 3.3 API Hooks

**useApi** - 基础 API 请求：

```typescript
const { fetchData } = useApi();
const data = await fetchData<T>('/api/endpoint', { method: 'GET' });
```

**useSessionsApi** - 会话 API：

```typescript
const { getSessions } = useSessionsApi();
const { sessions } = await getSessions();
```

**useSystemApi** - 系统 API：

```typescript
const { getSystemStats, getHealthHistory } = useSystemApi();
```

**useUsageApi** - 使用统计 API：

```typescript
const { getUsage, getCosts } = useUsageApi();
```

---

## 4. 插件系统

### 4.1 插件接口定义

```typescript
interface OpenClawPlugin {
  id: string;                    // 唯一标识
  name: string;                  // 显示名称
  version: string;               // 版本号
  description?: string;          // 描述
  author?: string;               // 作者

  onLoad?: () => void;           // 加载时回调
  onUnload?: () => void;         // 卸载时回调

  hooks?: {
    'sidebar:menu'?: MenuItem[];      // 侧边栏菜单项
    'page:register'?: PageDefinition[]; // 注册页面
    'metric:card'?: MetricCardDefinition[]; // 指标卡片
  };

  config?: Record<string, unknown>;  // 插件配置
}
```

### 4.2 插件注册表

```typescript
class PluginRegistry {
  private plugins = new Map<string, OpenClawPlugin>();
  private hooks = {
    'sidebar:menu': [] as MenuItem[],
    'page:register': [] as PageDefinition[],
    'metric:card': [] as MetricCardDefinition[],
  };

  register(plugin: OpenClawPlugin): void;
  unregister(pluginId: string): void;
  getHook<K extends keyof typeof this.hooks>(name: K): typeof this.hooks[K];
  getAllPlugins(): OpenClawPlugin[];
  getPlugin(id: string): OpenClawPlugin | undefined;
}

export const pluginRegistry = new PluginRegistry();
```

### 4.3 扩展点

**侧边栏菜单**：

```typescript
interface MenuItem {
  icon: string;        // 图标 (emoji 或图标类名)
  label: string;       // 显示文本
  page?: string;       // 跳转页面 ID
  action?: () => void; // 点击回调
}
```

**页面注册**：

```typescript
interface PageDefinition {
  id: string;          // 页面 ID
  label: string;       // 显示名称
  icon: string;        // 图标
  component: React.LazyExoticComponent<React.ComponentType>; // 懒加载组件
}
```

**指标卡片**：

```typescript
interface MetricCardDefinition {
  id: string;
  label: string;
  icon: string;
  getValue: () => string | number | Promise<string | number>;
}
```

### 4.4 示例插件

```typescript
const examplePlugin: OpenClawPlugin = {
  id: 'com.example.demo',
  name: 'Demo Plugin',
  version: '1.0.0',
  description: 'An example plugin',
  author: 'OpenClaw',

  onLoad: () => {
    console.log('Plugin loaded');
  },

  hooks: {
    'sidebar:menu': [
      { icon: '🎯', label: 'Demo', page: 'demo' }
    ],
    'page:register': [
      {
        id: 'demo',
        label: 'Demo Page',
        icon: '🎯',
        component: React.lazy(() => import('./DemoPage'))
      }
    ]
  }
};

pluginRegistry.register(examplePlugin);
```

---

## 5. 国际化 (i18n)

### 5.1 配置

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en }
    },
    lng: 'zh',           // 默认中文
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false
    }
  });
```

### 5.2 使用方式

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('nav.overview')}</h1>;
};
```

### 5.3 语言文件结构

```json
// zh.json
{
  "nav": {
    "overview": "概览",
    "sessions": "会话",
    "costs": "成本"
  },
  "common": {
    "loading": "加载中...",
    "underConstruction": "功能建设中"
  }
}
```

---

## 6. 类型定义

### 6.1 核心类型

```typescript
// 会话
interface Session {
  id: string;
  agentId: string;
  model: string;
  status: 'running' | 'completed' | 'aborted';
  startTime: string;
  endTime?: string;
  messageCount: number;
  tokensUsed: number;
  cost: number;
  snippet?: string;
}

// 系统状态
interface SystemStats {
  cpu: number;
  ram: number;
  disk: number;
  temperature?: number;
  uptime: number;
}

// 使用数据
interface UsageData {
  claude: {
    tokensUsed: number;
    requestCount: number;
    cost: number;
    models: Record<string, { tokens: number; cost: number }>;
  };
  gemini?: { /* 同上 */ };
}

// 活动项
interface ActivityItem {
  id: string;
  type: 'main' | 'sub' | 'cron' | 'group';
  name: string;
  snippet?: string;
  model?: string;
  timestamp: string;
  running?: boolean;
}

// Gateway 状态
interface GatewayStatus {
  state: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  port: number;
  uptime: number;
  connections: number;
  channels: Record<string, ChannelStatus>;
  lastError?: string;
}

// 日志条目
interface LogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'trace';
  subsystem: string;
  message: string;
}
```

---

## 7. 与主进程通信

### 7.1 Preload API

渲染进程通过 `window.openclaw` 访问主进程 API：

```typescript
// Gateway 管理
window.openclaw.gateway.start();
window.openclaw.gateway.stop();
window.openclaw.gateway.restart();
window.openclaw.gateway.status();
window.openclaw.gateway.detailedStatus();

// 配置
window.openclaw.gateway.getConfig();
window.openclaw.gateway.updateConfig(config);

// 日志
window.openclaw.gateway.getLogs();
window.openclaw.gateway.getLogFiles();
window.openclaw.gateway.readLogFile(filename);

// 状态监听
const unsubscribe = window.openclaw.gateway.onStatusChange((data) => {
  console.log('Status:', data.status, data.error);
});
// 取消订阅
unsubscribe();

// 平台信息
window.openclaw.platform;  // 'win32' | 'darwin' | 'linux'
window.openclaw.versions;  // { node, chrome, electron }
```

### 7.2 使用示例

```tsx
const handleStart = async () => {
  const success = await window.openclaw.gateway.start();
  if (success) {
    toast.success('Gateway started');
  }
};

useEffect(() => {
  return window.openclaw.gateway.onStatusChange(({ status, error }) => {
    setGatewayStatus(status);
    if (error) toast.error(error);
  });
}, []);
```

---

## 8. 构建配置

### 8.1 Vite 配置

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer')
    }
  }
});
```

### 8.2 TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/renderer/*"]
    }
  }
}
```

---

## 9. 依赖项

| 包 | 版本 | 用途 |
|---|------|------|
| react | ^19.2.4 | UI 框架 |
| react-dom | ^19.2.4 | DOM 渲染 |
| react-router-dom | ^7.13.1 | 路由 |
| zustand | ^5.0.11 | 状态管理 |
| @tanstack/react-query | ^5.90.21 | 数据获取 |
| i18next | ^25.8.18 | 国际化 |
| react-i18next | ^16.5.8 | React i18n |

---

## 10. 开发指南

### 添加新页面

1. 在 `components/` 下创建页面组件
2. 在 `App.tsx` 的 `renderPage()` 中添加路由
3. 在 `Sidebar.tsx` 中添加导航项
4. 在 `locales/` 中添加翻译

### 添加新插件

1. 创建插件定义对象
2. 在 `plugins/index.ts` 中注册
3. 实现所需的 hooks

### 添加新 API

1. 在 `hooks/useApi.ts` 中添加新的 API hook
2. 在 `types/index.ts` 中添加类型定义
3. 在组件中使用 hook

---

*此文档由 Claude 自动生成，基于源码分析。*