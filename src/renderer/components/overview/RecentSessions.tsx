import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Table, Tag, Empty, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ClockCircleOutlined, MessageOutlined, DollarOutlined } from '@ant-design/icons'
import type { RecentSession } from '@/types'
import './RecentSessions.css'

const { Text } = Typography

interface RecentSessionsProps {
  sessions?: RecentSession[]
  loading?: boolean
  onSessionClick?: (sessionId: string) => void
}

/**
 * 格式化持续时间
 */
const formatDuration = (startTime: string): string => {
  const start = new Date(startTime).getTime()
  const now = Date.now()
  const diff = now - start
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${diff % 60000 / 1000 | 0}s`
  return `${Math.floor(diff / 1000)}s`
}

/**
 * 状态标签
 */
const getStatusTag = (status: string, t: (key: string) => string): React.ReactNode => {
  const config: Record<string, { color: string; text: string }> = {
    running: { color: 'success', text: t('sessions.running') || '运行中' },
    completed: { color: 'processing', text: t('sessions.completed') || '已完成' },
    aborted: { color: 'warning', text: t('sessions.aborted') || '已中止' },
  }
  const { color, text } = config[status] || { color: 'default', text: status }
  return <Tag color={color}>{text}</Tag>
}

/**
 * 最近会话列表组件
 */
export const RecentSessions: React.FC<RecentSessionsProps> = ({
  sessions = [],
  loading = false,
  onSessionClick,
}) => {
  const { t } = useTranslation()

  // 表格列定义
  const columns: ColumnsType<RecentSession> = useMemo(() => [
    {
      title: t('overview.recentSessions.status') || '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => getStatusTag(status, t),
    },
    {
      title: t('overview.recentSessions.name') || '会话',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record: RecentSession) => (
        <div className="session-name">
          <Text strong>{name || record.id.substring(0, 12)}</Text>
          <br />
          <Text type="secondary" className="session-model">{record.model}</Text>
        </div>
      ),
    },
    {
      title: t('overview.recentSessions.started') || '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (time: string) => (
        <div className="time-container">
          <ClockCircleOutlined className="time-icon" />
          <span>{new Date(time).toLocaleString()}</span>
        </div>
      ),
    },
    {
      title: t('overview.recentSessions.duration') || '时长',
      key: 'duration',
      width: 80,
      render: (_: unknown, record: RecentSession) => (
        <Text className="duration">{formatDuration(record.startTime)}</Text>
      ),
    },
    {
      title: t('overview.recentSessions.messages') || '消息',
      dataIndex: 'messageCount',
      key: 'messageCount',
      width: 70,
      align: 'right',
      render: (count: number) => (
        <span className="mono">
          <MessageOutlined style={{ marginRight: 4 }} />
          {count.toLocaleString()}
        </span>
      ),
    },
    {
      title: t('overview.recentSessions.cost') || '成本',
      dataIndex: 'cost',
      key: 'cost',
      width: 80,
      align: 'right',
      render: (cost: number) => (
        <span className="mono cost">
          <DollarOutlined style={{ marginRight: 4 }} />
          ${cost.toFixed(4)}
        </span>
      ),
    },
  ], [t])

  return (
    <Card
      className="recent-sessions"
      title={t('overview.recentSessions.title') || '最近会话'}
      extra={
        <Text type="secondary" className="recent-sessions-count">
          {sessions.length} {t('overview.recentSessions.subtitle') || '个会话'}
        </Text>
      }
      size="small"
    >
      <Table
        dataSource={sessions}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        scroll={{ x: 600 }}
        onRow={(record) => ({
          onClick: () => onSessionClick?.(record.id),
          style: { cursor: 'pointer' },
        })}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('overview.recentSessions.noSessions') || '暂无会话'}
            />
          ),
        }}
      />
    </Card>
  )
}

export default RecentSessions
