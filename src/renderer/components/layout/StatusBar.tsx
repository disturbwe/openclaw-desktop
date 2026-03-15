import React from 'react'
import { useTranslation } from 'react-i18next'
import { Space, Tag, Button } from 'antd'
import { SunOutlined, MoonOutlined } from '@ant-design/icons'
import { useTheme } from '@/hooks/useTheme'
import './StatusBar.css'

export const StatusBar: React.FC = () => {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  return (
    <footer className="status-bar">
      <Space size="middle">
        <Tag color="success">
          <span className="status-dot" />
          {t('app.connected')}
        </Tag>
        <Tag>{t('app.port')}: 7000</Tag>
        <Tag>{t('app.agent')}: main</Tag>
      </Space>

      <Space>
        <Tag>v1.0.0</Tag>
        <Button
          type="text"
          size="small"
          onClick={toggleTheme}
          icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
        />
      </Space>
    </footer>
  )
}