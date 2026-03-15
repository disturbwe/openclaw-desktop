import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Table, Tag, Input, Radio, Space, Empty, Spin } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { ClockCircleOutlined, SearchOutlined } from '@ant-design/icons'
import { useSessionsApi } from '@/hooks/useApi'
import type { Session } from '@/types'
import './SessionsPage.css'

export const SessionsPage: React.FC = () => {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'aborted'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { getSessions } = useSessionsApi()

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await getSessions()
        setSessions(res.sessions || [])
      } catch (err) {
        console.error('Failed to fetch sessions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
    const interval = setInterval(fetchSessions, 10000)
    return () => clearInterval(interval)
  }, [getSessions])

  // 格式化持续时间
  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime()
    const endTime = end ? new Date(end).getTime() : Date.now()
    const seconds = Math.floor((endTime - startTime) / 1000)
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  // 状态标签
  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      running: { color: 'success', text: t('sessions.running') },
      completed: { color: 'processing', text: t('sessions.completed') },
      aborted: { color: 'warning', text: t('sessions.aborted') },
    }
    const { color, text } = config[status] || { color: 'default', text: status }
    return <Tag color={color}>{text}</Tag>
  }

  // 表格列定义
  const columns: ColumnsType<Session> = useMemo(() => [
    {
      title: t('sessions.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
      filterMultiple: false,
      filteredValue: filter === 'all' ? null : [filter],
      filters: [
        { text: t('sessions.all'), value: 'all' },
        { text: t('sessions.running'), value: 'running' },
        { text: t('sessions.completed'), value: 'completed' },
        { text: t('sessions.aborted'), value: 'aborted' },
      ],
    },
    {
      title: t('sessions.started'),
      dataIndex: 'startTime',
      key: 'startTime',
      width: 180,
      sorter: (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      render: (time: string) => (
        <span className="mono">
          <ClockCircleOutlined style={{ marginRight: 4, color: 'var(--text-muted)' }} />
          {new Date(time).toLocaleString()}
        </span>
      ),
    },
    {
      title: t('sessions.model'),
      dataIndex: 'model',
      key: 'model',
      width: 200,
      render: (model: string) => <Tag color="purple">{model}</Tag>,
    },
    {
      title: t('sessions.messages'),
      dataIndex: 'messageCount',
      key: 'messageCount',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.messageCount - b.messageCount,
      render: (count: number) => <span className="mono">{count.toLocaleString()}</span>,
    },
    {
      title: t('sessions.tokens'),
      dataIndex: 'tokensUsed',
      key: 'tokensUsed',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.tokensUsed - b.tokensUsed,
      render: (tokens: number) => <span className="mono">{tokens.toLocaleString()}</span>,
    },
    {
      title: t('sessions.cost'),
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.cost - b.cost,
      render: (cost: number) => <span className="mono cost">${cost.toFixed(4)}</span>,
    },
    {
      title: t('sessions.duration'),
      key: 'duration',
      width: 100,
      render: (_: unknown, record: Session) => (
        <span className="mono">{formatDuration(record.startTime, record.endTime)}</span>
      ),
    },
  ], [t, filter])

  // 过滤数据
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (filter !== 'all' && s.status !== filter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return s.model.toLowerCase().includes(q) ||
               s.id.toLowerCase().includes(q) ||
               (s.snippet && s.snippet.toLowerCase().includes(q))
      }
      return true
    })
  }, [sessions, filter, searchQuery])

  if (loading) {
    return (
      <div className="sessions-page loading">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="sessions-page">
      <div className="page-header">
        <h1 className="page-title">{t('sessions.title')}</h1>
        <p className="page-subtitle">{sessions.length} {t('sessions.subtitle')}</p>
      </div>

      <Card>
        <div className="toolbar">
          <Radio.Group value={filter} onChange={(e) => setFilter(e.target.value)}>
            <Radio.Button value="all">{t('sessions.all')}</Radio.Button>
            <Radio.Button value="running">{t('sessions.running')}</Radio.Button>
            <Radio.Button value="completed">{t('sessions.completed')}</Radio.Button>
            <Radio.Button value="aborted">{t('sessions.aborted')}</Radio.Button>
          </Radio.Group>

          <Input
            placeholder={t('sessions.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
        </div>

        <Table
          dataSource={filteredSessions}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `${total} sessions`,
          }}
          locale={{
            emptyText: <Empty description={t('sessions.noSessions')} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  )
}