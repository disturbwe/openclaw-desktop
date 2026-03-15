import { create } from 'zustand'
import type { AppState, SessionsState, SettingsState, SystemStats, ActivityItem, UsageData, GatewayStatus } from '@/types'

interface AppStore extends AppState {
  setCurrentPage: (page: string) => void
  toggleSidebar: () => void
  setTheme: (theme: 'dark' | 'light') => void
}

interface DataStore {
  systemStats: SystemStats | null
  sessions: SessionsState
  activities: ActivityItem[]
  usageData: UsageData | null
  gatewayStatus: GatewayStatus | null
  setSystemStats: (stats: SystemStats) => void
  setSessions: (sessions: SessionsState['sessions']) => void
  setActivities: (activities: ActivityItem[]) => void
  setUsageData: (data: UsageData) => void
  setGatewayStatus: (status: GatewayStatus | null) => void
}

interface SettingsStore extends SettingsState {
  setAutoRefresh: (enabled: boolean) => void
  setRefreshInterval: (interval: number) => void
  setTheme: (theme: SettingsState['theme']) => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentPage: 'overview',
  sidebarCollapsed: false,
  theme: 'light',
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
}))

export const useDataStore = create<DataStore>((set) => ({
  systemStats: null,
  sessions: { sessions: [], loading: false, error: null },
  activities: [],
  usageData: null,
  gatewayStatus: null,
  setSystemStats: (stats) => set({ systemStats: stats }),
  setSessions: (sessions) => set({ sessions: { sessions, loading: false, error: null } }),
  setActivities: (activities) => set({ activities }),
  setUsageData: (data) => set({ usageData: data }),
  setGatewayStatus: (status) => set({ gatewayStatus: status }),
}))

export const useSettingsStore = create<SettingsStore>((set) => ({
  autoRefresh: true,
  refreshInterval: 5000,
  theme: 'light',
  setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
  setRefreshInterval: (interval) => set({ refreshInterval: interval }),
  setTheme: (theme) => set({ theme }),
}))