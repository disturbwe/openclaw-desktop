import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Col, Row, Statistic, Progress, Tooltip } from 'antd'
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WifiOutlined,
  AlertOutlined,
} from '@ant-design/icons'
import type { OverviewMetrics } from '@/types'
import './MetricCards.css'

interface MetricCardsProps {
  metrics?: OverviewMetrics | null
  loading?: boolean
}

/**
 * 格式化数字，超过 1000 添加 K 后缀
 */
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

/**
 * 格式化持续时间（秒）为可读格式
 */
const formatUptime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) return `${hrs}h ${mins}m`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

/**
 * 指标卡片组件 - 显示概览页核心指标
 */
export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, loading }) => {
  const { t } = useTranslation()

  if (loading || !metrics) {
    return (
      <div className="metric-cards">
        <Row gutter={[16, 16]}>
          {[...Array(6)].map((_, i) => (
            <Col xs={24} sm={12} md={8} lg={4} key={i}>
              <Card className="metric-card loading">
                <Statistic title="---" value={0} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    )
  }

  // 计算运行时长
  const uptimeText = formatUptime(metrics.gatewayUptime / 1000)

  // 告警状态 - 当有任何异常时显示
  const hasWarning = metrics.runningSessions === 0 && metrics.totalSessions > 0

  return (
    <div className="metric-cards">
      <Row gutter={[16, 16]}>
        {/* 总会话数 */}
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="metric-card" hoverable>
            <Statistic
              title={t('overview.metrics.totalSessions') || '总会话'}
              value={metrics.totalSessions}
              prefix={<FileTextOutlined />}
              formatter={(val) => formatNumber(Number(val))}
            />
          </Card>
        </Col>

        {/* 运行中会话 */}
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="metric-card" hoverable>
            <Statistic
              title={t('overview.metrics.runningSessions') || '运行中'}
              value={metrics.runningSessions}
              prefix={
                metrics.runningSessions > 0 ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                )
              }
              valueStyle={{ color: metrics.runningSessions > 0 ? '#52c41a' : '#8c8c8c' }}
            />
          </Card>
        </Col>

        {/* 今日 Token */}
        <Col xs={24} sm={12} md={8} lg={5}>
          <Card className="metric-card" hoverable>
            <Statistic
              title={t('overview.metrics.todayTokens') || '今日 Token'}
              value={metrics.todayTokens.total}
              prefix={<ThunderboltOutlined />}
              formatter={(val) => formatNumber(Number(val))}
            />
            <div className="metric-detail">
              <span className="detail-label">
                {t('overview.metrics.input') || '输入'}: {formatNumber(metrics.todayTokens.input)}
              </span>
              <span className="detail-divider">|</span>
              <span className="detail-label">
                {t('overview.metrics.output') || '输出'}: {formatNumber(metrics.todayTokens.output)}
              </span>
            </div>
          </Card>
        </Col>

        {/* 今日成本 */}
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="metric-card" hoverable>
            <Statistic
              title={t('overview.metrics.todayCost') || '今日成本'}
              value={metrics.todayCost}
              prefix={<DollarOutlined />}
              precision={4}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        {/* Gateway 运行时长 */}
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="metric-card" hoverable>
            <Statistic
              title={t('overview.metrics.uptime') || '运行时长'}
              value={uptimeText}
              prefix={<SyncOutlined spin />}
              valueStyle={{ fontSize: '16px' }}
            />
          </Card>
        </Col>

        {/* 活动频道/告警 */}
        <Col xs={24} sm={12} md={8} lg={3}>
          <Tooltip
            title={
              hasWarning
                ? t('overview.metrics.noActiveSessions') || '当前无活跃会话'
                : t('overview.metrics.activeChannels') || '活动频道'
            }
          >
            <Card
              className={`metric-card ${hasWarning ? 'metric-card-warning' : ''}`}
              hoverable
            >
              <Statistic
                title={hasWarning ? (t('common.warning') || '告警') : (t('overview.metrics.channels') || '频道')}
                value={hasWarning ? 1 : metrics.activeChannels}
                prefix={
                  hasWarning ? (
                    <AlertOutlined style={{ color: '#faad14' }} />
                  ) : (
                    <WifiOutlined style={{ color: '#1890ff' }} />
                  )
                }
                valueStyle={{ color: hasWarning ? '#faad14' : '#1890ff' }}
              />
            </Card>
          </Tooltip>
        </Col>
      </Row>
    </div>
  )
}

export default MetricCards
