import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, List, Tag, Timeline, Empty, Typography, Spin } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  ScheduleOutlined,
} from '@ant-design/icons'
import type { ActivityItem } from '@/types'
import './ActivityFeed.css'

const { Text, Paragraph } = Typography

interface ActivityFeedProps {
  activities?: ActivityItem[]
  loading?: boolean
  onLoadMore?: () => void
}

/**
 * 获取活动类型对应的图标和颜色
 */
const getActivityIcon = (type: string, t: (key: string) => string) => {
  switch (type) {
    case 'main':
      return { icon: <ThunderboltOutlined />, color: '#1890ff', label: t('activity.type.main') || '主任务' }
    case 'sub':
      return { icon: <TeamOutlined />, color: '#52c41a', label: t('activity.type.sub') || '子任务' }
    case 'cron':
      return { icon: <ScheduleOutlined />, color: '#faad14', label: t('activity.type.cron') || '定时任务' }
    case 'group':
      return { icon: <SyncOutlined />, color: '#722ed1', label: t('activity.type.group') || '组任务' }
    default:
      return { icon: <ClockCircleOutlined />, color: '#8c8c8c', label: type }
  }
}

/**
 * 格式化时间
 */
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return date.toLocaleDateString()
}

/**
 * 实时活动流组件
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities = [],
  loading = false,
  onLoadMore,
}) => {
  const { t } = useTranslation()

  if (loading && activities.length === 0) {
    return (
      <Card
        className="activity-feed"
        title={t('overview.activityFeed.title') || '实时活动'}
        size="small"
      >
        <div className="activity-feed-loading">
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card
        className="activity-feed"
        title={t('overview.activityFeed.title') || '实时活动'}
        size="small"
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('overview.activityFeed.noActivities') || '暂无活动'}
        />
      </Card>
    )
  }

  return (
    <Card
      className="activity-feed"
      title={t('overview.activityFeed.title') || '实时活动'}
      extra={
        <Text type="secondary" className="activity-feed-count">
          {activities.length} {t('overview.activityFeed.subtitle') || '条活动'}
        </Text>
      }
      size="small"
    >
      <Timeline
        className="activity-timeline"
        items={activities.slice(0, 10).map((activity) => {
          const { icon, color, label } = getActivityIcon(activity.type, t)
          const isRunning = activity.running

          return {
            key: activity.id,
            color: isRunning ? 'green' : 'gray',
            dot: (
              <div className={`timeline-dot ${isRunning ? 'running' : ''}`} style={{ color }}>
                {icon}
              </div>
            ),
            children: (
              <div className="activity-item">
                <div className="activity-header">
                  <Text strong className="activity-name">{activity.name}</Text>
                  <Tag color={color}>{label}</Tag>
                  {isRunning && (
                    <Tag icon={<SyncOutlined spin />} color="processing">
                      {t('common.running') || '运行中'}
                    </Tag>
                  )}
                </div>
                {activity.snippet && (
                  <Paragraph
                    copyable={{ text: activity.snippet }}
                    className="activity-snippet"
                    ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                  >
                    {activity.snippet}
                  </Paragraph>
                )}
                <div className="activity-footer">
                  <Text type="secondary" className="activity-time">
                    <ClockCircleOutlined /> {formatTime(activity.timestamp)}
                  </Text>
                  {activity.model && (
                    <Tag className="activity-model">{activity.model}</Tag>
                  )}
                </div>
              </div>
            ),
          }
        })}
      />
      {activities.length > 10 && (
        <div className="activity-load-more">
          <a onClick={onLoadMore}>{t('common.loadMore') || '加载更多'}</a>
        </div>
      )}
    </Card>
  )
}

export default ActivityFeed
