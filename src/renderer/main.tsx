import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './styles/base.css'
import './i18n' // 初始化 i18n
import { loadBuiltInPlugins } from './plugins'

// Load plugins before rendering
loadBuiltInPlugins()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#667eea',
          borderRadius: 10,
          colorBgContainer: '#ffffff',
          colorBgElevated: '#f8f9fd',
          colorBorder: '#e8ecf1',
          boxShadowSecondary: '0 4px 12px rgba(102, 126, 234, 0.1)',
        },
        components: {
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: 'linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%)',
            itemHoverBg: 'rgba(102, 126, 234, 0.08)',
          },
          Card: {
            colorBgContainer: '#ffffff',
          },
          Statistic: {
            contentFontSize: 24,
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)