import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Row, Col, Statistic, Tabs, Progress, List, Empty, Spin, Tag } from 'antd'
import {
  DollarOutlined,
  FileTextOutlined,
  RobotOutlined,
  LineChartOutlined,
} from '@ant-design/icons'
import { useUsageApi, useSessionsApi } from '@/hooks/useApi'
import type { Session } from '@/types'
import './CostsPage.css'

// API 返回的原始数据格式
interface ApiCostData {
  total: number
  today?: number
  week?: number
  perModel: Record<string, number>
  perDay: Record<string, number>
}

export const CostsPage: React.FC = () => {
  const { t } = useTranslation()
  const [costData, setCostData] = useState<ApiCostData | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const { getCosts } = useUsageApi()
  const { getSessions } = useSessionsApi()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [costsRes, sessionsRes] = await Promise.all([
          getCosts(),
          getSessions(),
        ])
        // 适配 API 返回数据格式
        setCostData({
          total: costsRes.total || 0,
          today: (costsRes as any).today,
          week: (costsRes as any).week,
          perModel: (costsRes as any).perModel || costsRes.byModel || {},
          perDay: (costsRes as any).perDay || {},
        })
        setSessions((sessionsRes.sessions || []).map(s => ({
          ...s,
          status: s.status as 'running' | 'completed' | 'aborted'
        })))
      } catch (err) {
        console.error('Failed to fetch cost data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [getCosts, getSessions])

  // 适配 API 数据格式
  const adaptedData = useMemo(() => {
    if (!costData) {
      // fallback: 从 sessions 计算
      return {
        total: sessions.reduce((sum, s) => sum + s.cost, 0),
        byModel: sessions.reduce((acc, s) => {
          acc[s.model] = (acc[s.model] || 0) + s.cost
          return acc
        }, {} as Record<string, number>),
        byDay: [] as Array<{ date: string; amount: number }>,
      }
    }

    // 转换 perDay 对象为数组
    const byDay = Object.entries(costData.perDay || {})
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      total: costData.total || 0,
      byModel: costData.perModel || {},
      byDay,
    }
  }, [costData, sessions])

  const modelEntries = useMemo(() => {
    return Object.entries(adaptedData.byModel).sort((a, b) => b[1] - a[1])
  }, [adaptedData.byModel])

  const maxModelCost = Math.max(...modelEntries.map(([, cost]) => cost), 1)
  const maxDayCost = Math.max(...adaptedData.byDay.map(d => d.amount), 1)

  if (loading) {
    return (
      <div className="costs-page loading">
        <Spin size="large" />
      </div>
    )
  }

  const tabItems = [
    {
      key: 'overview',
      label: t('costs.overview'),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="metric-card">
              <Statistic
                title={t('costs.totalCost')}
                value={adaptedData.total}
                precision={2}
                prefix={<DollarOutlined style={{ color: '#10b981' }} />}
                suffix="USD"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="metric-card">
              <Statistic
                title={t('costs.sessions')}
                value={sessions.length}
                prefix={<FileTextOutlined style={{ color: '#6366f1' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="metric-card">
              <Statistic
                title={t('costs.modelsUsed')}
                value={modelEntries.length}
                prefix={<RobotOutlined style={{ color: '#a855f7' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="metric-card">
              <Statistic
                title={t('costs.avgPerSession')}
                value={sessions.length > 0 ? adaptedData.total / sessions.length : 0}
                precision={4}
                prefix={<LineChartOutlined style={{ color: '#f59e0b' }} />}
                suffix="USD"
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'byModel',
      label: t('costs.byModel'),
      children: modelEntries.length > 0 ? (
        <div className="model-bars">
          {modelEntries.map(([model, cost]) => (
            <div key={model} className="model-bar-item">
              <div className="model-bar-header">
                <Tag color="purple">{model}</Tag>
                <span className="model-cost">${cost.toFixed(4)}</span>
              </div>
              <Progress
                percent={((cost / maxModelCost) * 100)}
                showInfo={false}
                strokeColor="#6366f1"
                trailColor="rgba(99, 102, 241, 0.1)"
              />
              <span className="model-bar-percent">
                {((cost / adaptedData.total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      ) : (
        <Empty description={t('costs.noCostData')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ),
    },
    {
      key: 'timeline',
      label: t('costs.timeline'),
      children: adaptedData.byDay.length > 0 ? (
        <div className="timeline-chart">
          {adaptedData.byDay.map((day) => (
            <div key={day.date} className="timeline-bar">
              <div
                className="timeline-fill"
                style={{ height: `${(day.amount / maxDayCost) * 100}%` }}
              />
              <span className="timeline-label">
                {new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              </span>
              <span className="timeline-value">${day.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      ) : (
        <Empty description={t('costs.timelineHint')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ),
    },
  ]

  return (
    <div className="costs-page">
      <div className="page-header">
        <h1 className="page-title">{t('costs.title')}</h1>
        <p className="page-subtitle">{t('costs.subtitle')}</p>
      </div>

      <Card>
        <Tabs items={tabItems} />
      </Card>

      <Card title={t('costs.recentExpenses')} style={{ marginTop: 24 }}>
        {sessions.length > 0 ? (
          <List
            dataSource={sessions.slice(0, 10)}
            renderItem={(session) => (
              <List.Item className="expense-item">
                <List.Item.Meta
                  title={<Tag color="purple">{session.model}</Tag>}
                  description={new Date(session.startTime).toLocaleDateString()}
                />
                <span className="expense-cost">${session.cost.toFixed(4)}</span>
              </List.Item>
            )}
          />
        ) : (
          <Empty description={t('costs.noCostData')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  )
}