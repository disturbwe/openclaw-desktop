import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, Badge, Tooltip } from 'antd'
import {
  DashboardOutlined,
  UnorderedListOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  CloudOutlined,
  FolderOutlined,
  WifiOutlined,
  FileTextOutlined,
  SettingOutlined,
  MessageOutlined,
  LinkOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  MonitorOutlined,
  BugOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAppStore } from '@/stores/appStore'
import { pluginRegistry } from '@/plugins/registry'
import { GatewayControl } from '@/components/gateway'
import type { GatewayStatus } from '@/types'
import './Sidebar.css'

export const Sidebar: React.FC = () => {
  const { t } = useTranslation()
  const { currentPage, setCurrentPage } = useAppStore()
  const pluginPages = pluginRegistry.getHook('page:register')
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null)

  // 获取并监听Gateway状态
  useEffect(() => {
    if (window.openclaw?.gateway?.detailedStatus) {
      window.openclaw.gateway.detailedStatus().then(setGatewayStatus).catch(console.error)
    }

    const unsubscribe = window.openclaw?.gateway?.onStatusChange?.((data: { status: GatewayStatus }) => {
      setGatewayStatus(data.status)
    })

    const interval = setInterval(() => {
      window.openclaw?.gateway?.detailedStatus?.().then(setGatewayStatus).catch(console.error)
    }, 5000)

    return () => {
      unsubscribe?.()
      clearInterval(interval)
    }
  }, [])

  // 格式化运行时间
  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  // 菜单项
  const menuItems: MenuProps['items'] = useMemo(() => {
    const builtInItems: MenuProps['items'] = [
      // Core pages (React native)
      { key: 'overview', icon: <DashboardOutlined />, label: t('nav.overview') },
      { key: 'sessions', icon: <UnorderedListOutlined />, label: t('nav.sessions') },
      { key: 'costs', icon: <DollarOutlined />, label: t('nav.costs') },
      { type: 'divider' },
      // WebView pages (embedded native UI)
      { key: 'chat', icon: <MessageOutlined />, label: t('nav.chat') || 'Chat' },
      { key: 'channels', icon: <LinkOutlined />, label: t('nav.channels') || 'Channels' },
      { key: 'agents', icon: <TeamOutlined />, label: t('nav.agents') || 'Agents' },
      { key: 'cron', icon: <ClockCircleOutlined />, label: t('nav.cron') || 'Cron' },
      { key: 'skills', icon: <BulbOutlined />, label: t('nav.skills') || 'Skills' },
      { key: 'nodes', icon: <MonitorOutlined />, label: t('nav.nodes') || 'Nodes' },
      { type: 'divider' },
      // Other pages
      { key: 'limits', icon: <ThunderboltOutlined />, label: t('nav.limits') },
      { key: 'memory', icon: <CloudOutlined />, label: t('nav.memory') },
      { key: 'files', icon: <FolderOutlined />, label: t('nav.files') },
      { key: 'feed', icon: <WifiOutlined />, label: t('nav.feed') },
      { key: 'logs', icon: <FileTextOutlined />, label: t('nav.logs') },
      { key: 'config', icon: <SettingOutlined />, label: t('nav.settings') || '设置' },
    ]

    // 添加插件页面
    if (pluginPages.length > 0) {
      builtInItems.push({ type: 'divider' })
      pluginPages.forEach((page) => {
        builtInItems.push({
          key: page.id,
          icon: <span>{page.icon}</span>,
          label: page.label,
        })
      })
    }

    return builtInItems
  }, [t, pluginPages])

  // 状态颜色
  const getStatusColor = () => {
    switch (gatewayStatus?.state) {
      case 'running': return 'success'
      case 'starting':
      case 'stopping': return 'warning'
      case 'error': return 'error'
      default: return 'default'
    }
  }

  const statusText = () => {
    if (!gatewayStatus) return t('gateway.stopped') || '已停止'
    switch (gatewayStatus.state) {
      case 'running': return t('gateway.running')
      case 'starting': return t('gateway.starting') || '启动中...'
      case 'stopping': return t('gateway.stopping') || '停止中...'
      case 'error': return t('gateway.error') || '错误'
      default: return t('gateway.stopped') || '已停止'
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="logo">🐾</span>
        <span className="brand">OpenClaw</span>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[currentPage]}
        onClick={({ key }) => setCurrentPage(key)}
        items={menuItems}
        style={{
          flex: 1,
          border: 'none',
          background: 'transparent',
        }}
      />

      <div className="sidebar-footer">
        <Tooltip
          title={
            gatewayStatus?.state === 'running'
              ? `Port: ${gatewayStatus.port} · Uptime: ${formatUptime(gatewayStatus.uptime)}`
              : undefined
          }
        >
          <div className={`gateway-status ${gatewayStatus?.state || 'stopped'}`}>
            <Badge status={getStatusColor() as 'success' | 'warning' | 'error' | 'default'} />
            <span className="status-text">{statusText()}</span>
            <GatewayControl compact />
          </div>
        </Tooltip>
      </div>
    </aside>
  )
}