import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Button, Space, Alert, Typography, Divider } from 'antd'
import { SaveOutlined, FormatPainterOutlined, UndoOutlined } from '@ant-design/icons'
import './ConfigPage.css'

const { Paragraph, Text } = Typography

export const ConfigPage: React.FC = () => {
  const { t } = useTranslation()
  const [config, setConfig] = useState<string>('')
  const [originalConfig, setOriginalConfig] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // 加载配置
  useEffect(() => {
    window.openclaw?.gateway?.getConfig?.().then((cfg) => {
      if (cfg) {
        const formatted = JSON.stringify(cfg, null, 2)
        setConfig(formatted)
        setOriginalConfig(formatted)
      }
    }).catch(err => {
      setError(err.message)
    })
  }, [])

  // 保存配置
  const handleSave = async () => {
    setError(null)
    setSaving(true)

    try {
      const parsed = JSON.parse(config)
      await window.openclaw?.gateway?.updateConfig?.(parsed)
      setOriginalConfig(config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // 格式化JSON
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(config)
      setConfig(JSON.stringify(parsed, null, 2))
      setError(null)
    } catch (err: any) {
      setError((t('config.invalidJson') || 'JSON 格式错误') + ': ' + err.message)
    }
  }

  // 重置
  const handleReset = () => {
    setConfig(originalConfig)
    setError(null)
  }

  // 检查是否有修改
  const hasChanges = config !== originalConfig

  // 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (hasChanges && !saving) {
          handleSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [config, originalConfig, saving])

  return (
    <div className="config-page">
      <div className="page-header">
        <h1 className="page-title">{t('config.title') || '配置'}</h1>
        <p className="page-subtitle">{t('config.subtitle') || '编辑 OpenClaw 配置文件'}</p>
      </div>

      <Card>
        <div className="config-toolbar">
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              disabled={!hasChanges || saving}
              loading={saving}
            >
              {t('config.save') || '保存'}
            </Button>
            <Button icon={<FormatPainterOutlined />} onClick={handleFormat}>
              {t('config.format') || '格式化'}
            </Button>
            <Button
              icon={<UndoOutlined />}
              onClick={handleReset}
              disabled={!hasChanges}
            >
              {t('config.reset') || '重置'}
            </Button>
          </Space>

          <Space>
            {saved && <Text type="success">{t('config.saved') || '已保存'}</Text>}
            {hasChanges && <Text type="warning">{t('config.unsaved') || '未保存'}</Text>}
          </Space>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <textarea
          className="config-editor"
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          spellCheck={false}
          placeholder={t('config.placeholder') || '配置内容...'}
        />

        <Divider />

        <div className="config-help">
          <h4>{t('config.help') || '配置说明'}</h4>
          <ul>
            <li><code>models</code> - {t('config.modelsDesc') || '模型配置 (providers, API keys)'}</li>
            <li><code>channels</code> - {t('config.channelsDesc') || '频道配置'}</li>
            <li><code>diagnostics</code> - {t('config.diagnosticsDesc') || '诊断设置'}</li>
            <li><code>logging.level</code> - {t('config.loggingDesc') || '日志级别 (debug, info, warn, error)'}</li>
            <li><code>plugins</code> - {t('config.pluginsDesc') || '插件配置'}</li>
          </ul>
          <Paragraph type="secondary">
            {t('config.note') || '部分配置修改后需要重启 Gateway 才能生效'}
          </Paragraph>
        </div>
      </Card>
    </div>
  )
}