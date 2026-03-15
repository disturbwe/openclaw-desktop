import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Row, Col, Progress, Spin, message } from 'antd'
import {
  FileTextOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useSystemApi, useOverviewApi, useSessionsApi } from '@/hooks/useApi'
import { MetricCards, QuickActions, RecentSessions, ActivityFeed } from './index'
import type { OverviewMetrics, RecentSession, ActivityItem, GatewayStatus } from '@/types'
import './OverviewPage.css'

export const OverviewPage: React.FC = () => {
  const { t } = useTranslation()
  const [systemStats, setSystemStats] = useState<{ cpu: number; ram: number; disk: number } | null>(null)
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(true)

  const { getSystemStats } = useSystemApi()
  const { getOverviewMetrics, getRecentSessions, getActivities } = useOverviewApi()

  // 获取 Gateway 状态
  useEffect(() => {
    const fetchGatewayStatus = async () => {
      try {
        const status = await window.openclaw?.gateway?.detailedStatus?.()
        setGatewayStatus(status)
      } catch (err) {
        console.error('Failed to fetch gateway status:', err)
      }
    }

    fetchGatewayStatus()
    const interval = setInterval(fetchGatewayStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  // 获取系统资源
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sysRes = await getSystemStats()
        setSystemStats({
          cpu: typeof sysRes.cpu === 'object' ? (sysRes.cpu as any).usage : sysRes.cpu,
          ram: typeof sysRes.ram === 'object' ? (sysRes.ram as any).percent : sysRes.ram,
          disk: typeof sysRes.disk === 'object' ? (sysRes.disk as any).percent : sysRes.disk
        })
      } catch (err) {
        console.error('Failed to fetch system stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [getSystemStats])

  // 获取概览数据
  useEffect(() => {
    const fetchOverviewData = async () => {
      setMetricsLoading(true)
      try {
        // 获取 Gateway 详细状态
        const gwStatus = await window.openclaw?.gateway?.detailedStatus?.()

        // 获取真实指标数据
        try {
          const metricsRes = await getOverviewMetrics()
          setMetrics({
            ...metricsRes,
            gatewayUptime: gwStatus?.uptime || metricsRes.gatewayUptime || 0,
            activeChannels: Object.values(gwStatus?.channels || {}).filter((c: any) => c.connected).length || metricsRes.activeChannels
          })
        } catch (err) {
          console.error('Failed to fetch overview metrics:', err)
        }

        // 获取最近会话
        try {
          const sessionsRes = await getRecentSessions()
          setRecentSessions((sessionsRes.sessions || []).map(s => ({
            ...s,
            status: s.status as 'running' | 'completed' | 'aborted'
          })))
        } catch (err) {
          console.error('Failed to fetch recent sessions:', err)
        }

        // 获取活动列表
        try {
          const activitiesRes = await getActivities()
          setActivities((activitiesRes.activities || []).map(a => ({
            ...a,
            type: a.type as 'main' | 'sub' | 'cron' | 'group'
          })))
        } catch (err) {
          console.error('Failed to fetch activities:', err)
        }
      } catch (err) {
        console.error('Failed to fetch overview data:', err)
      } finally {
        setMetricsLoading(false)
      }
    }

    fetchOverviewData()
    const interval = setInterval(fetchOverviewData, 10000)
    return () => clearInterval(interval)
  }, [getOverviewMetrics, getRecentSessions, getActivities])

  // Gateway 控制函数
  const handleGatewayStart = useCallback(async () => {
    try {
      const success = await window.openclaw?.gateway?.start?.()
      if (success) {
        message.success(t('gateway.startSuccess') || 'Gateway 启动成功')
      } else {
        message.error(t('gateway.startFailed') || 'Gateway 启动失败')
      }
    } catch (err: any) {
      message.error(err.message || t('gateway.startFailed') || 'Gateway 启动失败')
    }
  }, [t])

  const handleGatewayStop = useCallback(async () => {
    try {
      const success = await window.openclaw?.gateway?.stop?.()
      if (success) {
        message.success(t('gateway.stopSuccess') || 'Gateway 已停止')
      }
    } catch (err: any) {
      message.error(err.message || t('gateway.stopFailed') || 'Gateway 停止失败')
    }
  }, [t])

  const handleGatewayRestart = useCallback(async () => {
    try {
      const success = await window.openclaw?.gateway?.restart?.()
      if (success) {
        message.success(t('gateway.restartSuccess') || 'Gateway 已重启')
      }
    } catch (err: any) {
      message.error(err.message || t('gateway.restartFailed') || 'Gateway 重启失败')
    }
  }, [t])

  // 导航函数
  const navigateTo = useCallback((page: string) => {
    window.openclaw?.navigate?.(`/${page}`)
  }, [])

  const handleNewSession = useCallback(() => {
    message.info(t('overview.newSessionComingSoon') || '新建会话功能开发中...')
  }, [t])

  const handleOpenLogs = useCallback(() => {
    navigateTo('logs')
  }, [navigateTo])

  const handleOpenConfig = useCallback(() => {
    navigateTo('config')
  }, [navigateTo])

  const handleOpenSessions = useCallback(() => {
    navigateTo('sessions')
  }, [navigateTo])

  const handleSessionClick = useCallback((sessionId: string) => {
    message.info(`${t('overview.viewSession') || '查看会话'}: ${sessionId}`)
    // TODO: 实现会话详情查看
  }, [t])

  if (loading) {
    return (
      <div className="overview-page loading">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="overview-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">
              <FileTextOutlined className="header-icon" />
              {t('overview.title') || '概览'}
            </h1>
            <p className="page-subtitle">{t('overview.subtitle') || 'OpenClaw Desktop 仪表盘'}</p>
          </div>
          <div className="header-actions">
            <Progress
              type="circle"
              percent={systemStats?.cpu || 0}
              size={60}
              strokeColor="#6366f1"
              trailColor="rgba(99, 102, 241, 0.1)"
              format={(p) => <span style={{ fontSize: '12px' }}>CPU</span>}
            />
            <Progress
              type="circle"
              percent={systemStats?.ram || 0}
              size={60}
              strokeColor="#10b981"
              trailColor="rgba(16, 185, 129, 0.1)"
              format={(p) => <span style={{ fontSize: '12px' }}>RAM</span>}
            />
          </div>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <MetricCards metrics={metrics} loading={metricsLoading} />

      {/* 主要内容区域 - 两列布局 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 左侧：系统资源和最近会话 */}
        <Col xs={24} xl={16}>
          <Row gutter={[16, 16]}>
            {/* 系统资源 */}
            <Col span={24}>
              <Card
                className="system-resources"
                title={<><ThunderboltOutlined /> {t('overview.systemResources') || '系统资源'}</>}
                size="small"
              >
                <Row gutter={[32, 16]} justify="center">
                  <Col xs={8}>
                    <div className="gauge-container">
                      <Progress
                        type="dashboard"
                        percent={systemStats?.cpu || 0}
                        strokeColor="#6366f1"
                        trailColor="rgba(99, 102, 241, 0.1)"
                        size={100}
                      />
                      <div className="gauge-label">CPU</div>
                    </div>
                  </Col>
                  <Col xs={8}>
                    <div className="gauge-container">
                      <Progress
                        type="dashboard"
                        percent={systemStats?.ram || 0}
                        strokeColor="#10b981"
                        trailColor="rgba(16, 185, 129, 0.1)"
                        size={100}
                      />
                      <div className="gauge-label">RAM</div>
                    </div>
                  </Col>
                  <Col xs={8}>
                    <div className="gauge-container">
                      <Progress
                        type="dashboard"
                        percent={systemStats?.disk || 0}
                        strokeColor="#a855f7"
                        trailColor="rgba(168, 85, 247, 0.1)"
                        size={100}
                      />
                      <div className="gauge-label">DISK</div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* 最近会话 */}
            <Col span={24}>
              <RecentSessions
                sessions={recentSessions}
                loading={metricsLoading}
                onSessionClick={handleSessionClick}
              />
            </Col>
          </Row>
        </Col>

        {/* 右侧：快速操作和活动流 */}
        <Col xs={24} xl={8}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <QuickActions
                gatewayStatus={gatewayStatus}
                onGatewayStart={handleGatewayStart}
                onGatewayStop={handleGatewayStop}
                onGatewayRestart={handleGatewayRestart}
                onNewSession={handleNewSession}
                onOpenLogs={handleOpenLogs}
                onOpenConfig={handleOpenConfig}
                onOpenSessions={handleOpenSessions}
              />
            </Col>
            <Col span={24}>
              <ActivityFeed
                activities={activities}
                loading={metricsLoading}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  )
}

export default OverviewPage
