import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Radio, Button, Tag, Empty, Space, Alert } from 'antd'
import { PauseCircleOutlined, PlayCircleOutlined, WifiOutlined, WarningOutlined } from '@ant-design/icons'
import './LiveFeedPage.css'

interface FeedMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  timestamp: string
  model?: string
}

const API_BASE = 'http://localhost:7000'

export const LiveFeedPage: React.FC = () => {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<FeedMessage[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [filter, setFilter] = useState<'all' | 'user' | 'assistant' | 'tool'>('all')
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const pauseRef = useRef(isPaused)

  useEffect(() => {
    pauseRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE}/api/live`)

    eventSource.onopen = () => {
      setIsConnected(true)
      setConnectionError(null)
    }

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      // 跳过连接确认消息
      if (data.status === 'connected') return

      // 解析消息
      const newMsg: FeedMessage = {
        id: data.id || Date.now().toString(),
        sessionId: data.session || data.sessionId || 'unknown',
        role: (data.role as 'user' | 'assistant' | 'tool') || 'assistant',
        content: data.content || data.text || '',
        timestamp: data.timestamp || new Date().toISOString(),
        model: data.model
      }

      setMessages(prev => {
        if (pauseRef.current) return prev
        const updated = [newMsg, ...prev]
        return updated.slice(0, 100) // 保留最近 100 条
      })
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      setConnectionError(t('feed.connectionLost'))
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [t])

  useEffect(() => {
    if (feedRef.current && !isPaused) {
      feedRef.current.scrollTop = 0
    }
  }, [messages, isPaused])

  const filteredMessages = messages.filter(m => filter === 'all' || m.role === filter)

  const getRoleTag = (role: string) => {
    const config: Record<string, { color: string; text: string }> = {
      user: { color: 'blue', text: t('feed.user') },
      assistant: { color: 'purple', text: t('feed.assistant') },
      tool: { color: 'cyan', text: t('feed.tool') },
    }
    const { color, text } = config[role] || { color: 'default', text: role }
    return <Tag color={color}>{text}</Tag>
  }

  return (
    <div className="live-feed-page">
      <div className="page-header">
        <h1 className="page-title">{t('feed.title')}</h1>
        <p className="page-subtitle">{t('feed.subtitle')}</p>
      </div>

      {/* 连接状态提示 */}
      {!isConnected && !connectionError && (
        <Alert
          type="info"
          message={t('feed.connecting')}
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {connectionError && (
        <Alert
          type="error"
          message={connectionError}
          icon={<WarningOutlined />}
          closable
          onClose={() => setConnectionError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {isConnected && (
        <Alert
          type="success"
          message={t('feed.connected')}
          icon={<WifiOutlined />}
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      <div className="feed-controls">
        <Radio.Group
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="all">{t('feed.all')}</Radio.Button>
          <Radio.Button value="user">{t('feed.user')}</Radio.Button>
          <Radio.Button value="assistant">{t('feed.assistant')}</Radio.Button>
          <Radio.Button value="tool">{t('feed.tool')}</Radio.Button>
        </Radio.Group>

        <Button
          type={isPaused ? 'primary' : 'default'}
          icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
          onClick={() => setIsPaused(!isPaused)}
          disabled={!isConnected}
        >
          {isPaused ? t('feed.resume') : t('feed.pause')}
        </Button>
      </div>

      <Card>
        <div className="feed-stream" ref={feedRef}>
          {filteredMessages.length === 0 ? (
            <Empty
              description={isConnected ? t('feed.noMessages') : t('feed.waitingForConnection')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            filteredMessages.map((msg) => (
              <div key={msg.id} className={`feed-item role-${msg.role}`}>
                <div className="feed-header">
                  <Space>
                    <Tag color="default">{msg.sessionId}</Tag>
                    {msg.model && <Tag color="purple">{msg.model}</Tag>}
                    {getRoleTag(msg.role)}
                    <span className="feed-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </Space>
                </div>
                <div className="feed-content">{msg.content}</div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
