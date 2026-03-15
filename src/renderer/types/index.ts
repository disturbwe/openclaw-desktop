// API Response Types
export interface Session {
  id: string
  agentId: string
  model: string
  status: 'running' | 'completed' | 'aborted'
  startTime: string
  endTime?: string
  messageCount: number
  tokensUsed: number
  cost: number
  snippet?: string
}

export interface SystemStats {
  cpu: number
  ram: number
  disk: number
  temperature?: number
  uptime: number
}

export interface UsageData {
  claude: {
    tokensUsed: number
    requestCount: number
    cost: number
    models: Record<string, { tokens: number; cost: number }>
  }
  gemini?: {
    tokensUsed: number
    requestCount: number
    cost: number
    models: Record<string, { tokens: number; cost: number }>
  }
}

export interface ActivityItem {
  id: string
  type: 'main' | 'sub' | 'cron' | 'group'
  name: string
  snippet?: string
  model?: string
  timestamp: string
  running?: boolean
}

export interface CostData {
  total: number
  byModel: Record<string, number>
  byDay: Array<{ date: string; amount: number }>
  bySession: Array<{ sessionId: string; amount: number }>
}

// Plugin Types
export interface MenuItem {
  icon: string
  label: string
  page?: string
  action?: () => void
}

export interface PageDefinition {
  id: string
  label: string
  icon: string
  component: React.LazyExoticComponent<React.ComponentType>
}

export interface MetricCardDefinition {
  id: string
  label: string
  icon: string
  getValue: () => string | number | Promise<string | number>
}

export interface OpenClawPlugin {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  onLoad?: () => void
  onUnload?: () => void
  hooks?: {
    'sidebar:menu'?: MenuItem[]
    'page:register'?: PageDefinition[]
    'metric:card'?: MetricCardDefinition[]
  }
  config?: Record<string, unknown>
}

// App State
export interface AppState {
  currentPage: string
  sidebarCollapsed: boolean
  theme: 'dark' | 'light'
}

export interface SessionsState {
  sessions: Session[]
  loading: boolean
  error: string | null
}

export interface SettingsState {
  autoRefresh: boolean
  refreshInterval: number
  theme: 'dark' | 'light' | 'system'
}

// Gateway Types
export interface GatewayStatus {
  state: 'starting' | 'running' | 'stopping' | 'stopped' | 'error'
  port: number
  uptime: number
  connections: number
  channels: Record<string, ChannelStatus>
  lastError?: string
}

export interface ChannelStatus {
  enabled: boolean
  connected: boolean
  error?: string
}

export interface LogEntry {
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'trace'
  subsystem: string
  message: string
}

export interface LogFile {
  name: string
  path: string
  size: number
  modified: Date
}

// Overview Page Types
export interface OverviewMetrics {
  totalSessions: number
  runningSessions: number
  todayTokens: {
    input: number
    output: number
    total: number
  }
  todayCost: number
  gatewayUptime: number
  activeChannels: number
}

export interface RecentSession {
  id: string
  name: string
  model: string
  startTime: string
  messageCount: number
  cost: number
  status: 'running' | 'completed' | 'aborted'
}

export interface CostSummary {
  total: number
  today: number
  thisWeek: number
  byModel: Record<string, number>
  trend: Array<{ date: string; amount: number }>
}

// Window interface extension for openclaw API
declare global {
  interface Window {
    openclaw: {
      gateway: {
        start: () => Promise<boolean>
        stop: () => Promise<boolean>
        restart: () => Promise<boolean>
        status: () => Promise<string>
        detailedStatus: () => Promise<GatewayStatus>
        onStatusChange: (callback: (data: { status: GatewayStatus }) => void) => () => void
        getConfig: () => Promise<Record<string, unknown> | null>
        updateConfig: (config: Record<string, unknown>) => Promise<void>
        getLogs: () => Promise<LogEntry[]>
        getLogFiles: () => Promise<LogFile[]>
        readLogFile: (filename: string) => Promise<string | null>
      }
      app: {
        quit: () => void
        minimize: () => void
      }
      onNavigate: (callback: (data: { path: string }) => void) => () => void
      navigate: (path: string) => Promise<void>
      platform: string
      versions: {
        node: string
        chrome: string
        electron: string
      }
    }
  }
}

export {}