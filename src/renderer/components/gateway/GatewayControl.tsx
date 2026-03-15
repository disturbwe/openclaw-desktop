import React, { useState, useEffect, useCallback } from 'react'
import { Button, Tooltip, Space, Modal, message } from 'antd'
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { GatewayStatus } from '@/types'
import './GatewayControl.css'

interface GatewayControlProps {
  /** Show as compact inline control */
  compact?: boolean
}

/**
 * Gateway Control Component
 *
 * Provides UI for starting, stopping, and restarting the OpenClaw Gateway.
 */
export const GatewayControl: React.FC<GatewayControlProps> = ({ compact = false }) => {
  const [status, setStatus] = useState<GatewayStatus | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  // Fetch initial status
  useEffect(() => {
    fetchStatus()

    // Subscribe to status changes
    const unsubscribe = window.openclaw?.gateway?.onStatusChange?.((data: { status: GatewayStatus }) => {
      setStatus(data.status)
      setLoading(null)
    })

    // Poll for status updates
    const interval = setInterval(fetchStatus, 5000)

    return () => {
      unsubscribe?.()
      clearInterval(interval)
    }
  }, [])

  const fetchStatus = async () => {
    try {
      const s = await window.openclaw?.gateway?.detailedStatus?.()
      setStatus(s)
    } catch (err) {
      console.error('Failed to fetch gateway status:', err)
    }
  }

  const handleStart = useCallback(async () => {
    setLoading('starting')
    try {
      await window.openclaw?.gateway?.start?.()
      message.success('Gateway started')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      message.error(`Failed to start: ${errorMessage}`)
      setLoading(null)
    }
  }, [])

  const handleStop = useCallback(async () => {
    Modal.confirm({
      title: 'Stop Gateway',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to stop the Gateway? This will disconnect all active sessions.',
      okText: 'Stop',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        setLoading('stopping')
        try {
          await window.openclaw?.gateway?.stop?.()
          message.success('Gateway stopped')
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          message.error(`Failed to stop: ${errorMessage}`)
          setLoading(null)
        }
      },
    })
  }, [])

  const handleRestart = useCallback(async () => {
    Modal.confirm({
      title: 'Restart Gateway',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to restart the Gateway? This will temporarily disconnect all active sessions.',
      okText: 'Restart',
      okButtonProps: { danger: false },
      cancelText: 'Cancel',
      onOk: async () => {
        setLoading('restarting')
        try {
          await window.openclaw?.gateway?.restart?.()
          message.success('Gateway restarted')
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          message.error(`Failed to restart: ${errorMessage}`)
          setLoading(null)
        }
      },
    })
  }, [])

  const isRunning = status?.state === 'running'
  const isStopped = status?.state === 'stopped' || !status
  const isStarting = status?.state === 'starting' || loading === 'starting'
  const isStopping = status?.state === 'stopping' || loading === 'stopping'
  const isLoading = loading !== null

  if (compact) {
    return (
      <Space size="small" className="gateway-control-compact">
        {isRunning && !isLoading && (
          <>
            <Tooltip title="Stop Gateway">
              <Button
                type="text"
                size="small"
                icon={<StopOutlined />}
                onClick={handleStop}
                danger
              />
            </Tooltip>
            <Tooltip title="Restart Gateway">
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleRestart}
              />
            </Tooltip>
          </>
        )}
        {isStopped && !isLoading && (
          <Tooltip title="Start Gateway">
            <Button
              type="text"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={handleStart}
              style={{ color: '#52c41a' }}
            />
          </Tooltip>
        )}
        {isLoading && (
          <LoadingOutlined spin style={{ color: '#1890ff' }} />
        )}
      </Space>
    )
  }

  return (
    <div className="gateway-control">
      <Space>
        {isRunning && !isLoading && (
          <>
            <Button
              icon={<StopOutlined />}
              onClick={handleStop}
              danger
            >
              Stop
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRestart}
            >
              Restart
            </Button>
          </>
        )}
        {isStopped && !isLoading && (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStart}
          >
            Start Gateway
          </Button>
        )}
        {isStarting && (
          <Button loading>
            Starting...
          </Button>
        )}
        {isStopping && (
          <Button loading>
            Stopping...
          </Button>
        )}
      </Space>
    </div>
  )
}

export default GatewayControl