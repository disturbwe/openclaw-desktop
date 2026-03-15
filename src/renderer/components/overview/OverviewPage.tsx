import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Row, Col, Progress, Spin } from 'antd'
import { useSystemApi } from '@/hooks/useApi'
import './OverviewPage.css'

export const OverviewPage: React.FC = () => {
  const { t } = useTranslation()
  const [systemStats, setSystemStats] = useState<{ cpu: number; ram: number; disk: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const { getSystemStats } = useSystemApi()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sysRes = await getSystemStats()
        // 适配 API 返回的嵌套结构：{ cpu: {usage}, memory: {percent}, disk: {percent} }
        setSystemStats({
          cpu: sysRes.cpu?.usage || 0,
          ram: sysRes.memory?.percent || 0,
          disk: sysRes.disk?.percent || 0
        })
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [getSystemStats])

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
        <h1 className="page-title">{t('overview.title')}</h1>
        <p className="page-subtitle">{t('overview.subtitle')}</p>
      </div>

      {/* 系统资源 */}
      <Card title={t('overview.systemResources')} style={{ marginBottom: 24 }}>
        <Row gutter={[48, 24]} justify="center">
          <Col xs={24} sm={8}>
            <div className="gauge-container">
              <Progress
                type="dashboard"
                percent={systemStats?.cpu || 0}
                strokeColor="#6366f1"
                trailColor="rgba(99, 102, 241, 0.1)"
                size={120}
              />
              <div className="gauge-label">CPU</div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="gauge-container">
              <Progress
                type="dashboard"
                percent={systemStats?.ram || 0}
                strokeColor="#10b981"
                trailColor="rgba(16, 185, 129, 0.1)"
                size={120}
              />
              <div className="gauge-label">RAM</div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="gauge-container">
              <Progress
                type="dashboard"
                percent={systemStats?.disk || 0}
                strokeColor="#a855f7"
                trailColor="rgba(168, 85, 247, 0.1)"
                size={120}
              />
              <div className="gauge-label">DISK</div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}