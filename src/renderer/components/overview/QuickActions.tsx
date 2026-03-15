import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Button, Space, Tooltip } from 'antd'
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  SettingOutlined,
  BulbOutlined,
} from '@ant-design/icons'
import type { GatewayStatus } from '@/types'
import './QuickActions.css'

interface QuickActionsProps {
  gatewayStatus?: GatewayStatus | null
  onGatewayStart?: () => void
  onGatewayStop?: () => void
  onGatewayRestart?: () => void
  onNewSession?: () => void
  onOpenLogs?: () => void
  onOpenConfig?: () => void
  onOpenSessions?: () => void
}

/**
 * 快速操作面板 - 提供常用功能的快捷入口
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  gatewayStatus,
  onGatewayStart,
  onGatewayStop,
  onGatewayRestart,
  onNewSession,
  onOpenLogs,
  onOpenConfig,
  onOpenSessions,
}) => {
  const { t } = useTranslation()

  const isRunning = gatewayStatus?.state === 'running'
  const isStarting = gatewayStatus?.state === 'starting'
  const isStopping = gatewayStatus?.state === 'stopping'

  return (
    <Card
      className="quick-actions"
      title={t('overview.quickActions.title') || '快速操作'}
      size="small"
    >
      <Space direction="vertical" className="quick-actions-space" style={{ width: '100%' }}>
        {/* Gateway 控制 */}
        <div className="action-group">
          <div className="action-group-title">
            {t('overview.quickActions.gateway') || 'Gateway 控制'}
          </div>
          <Space wrap>
            <Tooltip
              title={
                isRunning
                  ? t('overview.quickActions.gatewayRunning') || '运行中'
                  : isStarting
                  ? t('overview.quickActions.gatewayStarting') || '启动中...'
                  : t('overview.quickActions.startGateway') || '启动 Gateway'
              }
            >
              <Button
                icon={<PlayCircleOutlined />}
                onClick={onGatewayStart}
                disabled={isRunning || isStarting}
                type={isRunning ? 'primary' : 'default'}
                size="large"
              >
                {isRunning ? (t('common.running') || '运行') : (t('common.start') || '启动')}
              </Button>
            </Tooltip>

            <Tooltip
              title={
                !isRunning
                  ? t('overview.quickActions.gatewayStopped') || '已停止'
                  : isStopping
                  ? t('overview.quickActions.gatewayStopping') || '停止中...'
                  : t('overview.quickActions.stopGateway') || '停止 Gateway'
              }
            >
              <Button
                icon={<StopOutlined />}
                onClick={onGatewayStop}
                disabled={!isRunning || isStopping}
                danger
                size="large"
              >
                {t('common.stop') || '停止'}
              </Button>
            </Tooltip>

            <Tooltip title={t('overview.quickActions.restartGateway') || '重启 Gateway'}>
              <Button
                icon={<ReloadOutlined />}
                onClick={onGatewayRestart}
                disabled={!isRunning && !isStarting}
                size="large"
              >
                {t('common.restart') || '重启'}
              </Button>
            </Tooltip>
          </Space>
        </div>

        {/* 快捷入口 */}
        <div className="action-group">
          <div className="action-group-title">
            {t('overview.quickActions.shortcuts') || '快捷入口'}
          </div>
          <Space wrap>
            <Tooltip title={t('overview.quickActions.newSession') || '新建会话'}>
              <Button
                icon={<PlusCircleOutlined />}
                onClick={onNewSession}
                size="large"
              >
                {t('overview.quickActions.newSession') || '新建会话'}
              </Button>
            </Tooltip>

            <Tooltip title={t('overview.quickActions.sessions') || '会话列表'}>
              <Button
                icon={<UnorderedListOutlined />}
                onClick={onOpenSessions}
                size="large"
              >
                {t('nav.sessions') || '会话'}
              </Button>
            </Tooltip>

            <Tooltip title={t('overview.quickActions.logs') || '查看日志'}>
              <Button
                icon={<FileTextOutlined />}
                onClick={onOpenLogs}
                size="large"
              >
                {t('nav.logs') || '日志'}
              </Button>
            </Tooltip>

            <Tooltip title={t('overview.quickActions.config') || '打开配置'}>
              <Button
                icon={<SettingOutlined />}
                onClick={onOpenConfig}
                size="large"
              >
                {t('nav.settings') || '配置'}
              </Button>
            </Tooltip>

            <Tooltip title={t('overview.quickActions.skills') || '技能管理'}>
              <Button
                icon={<BulbOutlined />}
                onClick={() => {}}
                size="large"
              >
                {t('nav.skills') || '技能'}
              </Button>
            </Tooltip>
          </Space>
        </div>
      </Space>
    </Card>
  )
}

export default QuickActions
