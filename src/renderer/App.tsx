import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Layout, Result } from 'antd'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatusBar } from '@/components/layout/StatusBar'
import { OverviewPage } from '@/components/overview'
import { SessionsPage } from '@/components/sessions'
import { CostsPage } from '@/components/costs'
import { LiveFeedPage } from '@/components/feed'
import { LogsPage } from '@/components/logs'
import { ConfigPage } from '@/components/config'
import { ChatPage, ChannelsPage, AgentsPage, CronPage, SkillsPage, NodesPage, DebugPage, UsagePage } from '@/components/webview'
import { useAppStore } from '@/stores/appStore'
import { pluginRegistry } from '@/plugins/registry'
import './App.css'

const { Sider, Content } = Layout

// 路由映射
const ROUTE_MAP: Record<string, string> = {
  '/': 'overview',
  '/overview': 'overview',
  '/sessions': 'sessions',
  '/costs': 'costs',
  '/feed': 'feed',
  '/logs': 'logs',
  '/config': 'config',
  '/chat': 'chat',
  '/channels': 'channels',
  '/agents': 'agents',
  '/cron': 'cron',
  '/skills': 'skills',
  '/nodes': 'nodes',
  '/debug': 'debug',
  '/usage': 'usage-webview',
}

// Placeholder page component
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
  const { t } = useTranslation()
  return (
    <div className="placeholder-page">
      <Result
        status="info"
        title={title}
        subTitle={t('common.comingSoon')}
      />
    </div>
  )
}

const App: React.FC = () => {
  const { t } = useTranslation()
  const { currentPage, setCurrentPage } = useAppStore()
  const pluginPages = pluginRegistry.getHook('page:register')

  // 监听导航消息
  useEffect(() => {
    if (window.openclaw?.onNavigate) {
      const unsubscribe = window.openclaw.onNavigate((data: { path: string }) => {
        const page = ROUTE_MAP[data.path] || 'overview'
        setCurrentPage(page)
      })
      return unsubscribe
    }
  }, [setCurrentPage])

  const renderPage = () => {
    // Check plugin pages first
    const pluginPage = pluginPages.find(p => p.id === currentPage)
    if (pluginPage) {
      const PageComponent = pluginPage.component
      return (
        <React.Suspense fallback={<div className="loading-placeholder">{t('common.loading')}</div>}>
          <PageComponent />
        </React.Suspense>
      )
    }

    // Built-in pages
    switch (currentPage) {
      case 'overview':
        return <OverviewPage />
      case 'sessions':
        return <SessionsPage />
      case 'costs':
        return <CostsPage />
      case 'limits':
        return <PlaceholderPage title={t('nav.limits')} />
      case 'memory':
        return <PlaceholderPage title={t('nav.memory')} />
      case 'files':
        return <PlaceholderPage title={t('nav.files')} />
      case 'feed':
        return <LiveFeedPage />
      case 'logs':
        return <LogsPage />
      case 'config':
        return <ConfigPage />
      // WebView pages - embedded native UI
      case 'chat':
        return <ChatPage />
      case 'channels':
        return <ChannelsPage />
      case 'agents':
        return <AgentsPage />
      case 'cron':
        return <CronPage />
      case 'skills':
        return <SkillsPage />
      case 'nodes':
        return <NodesPage />
      case 'debug':
        return <DebugPage />
      case 'usage-webview':
        return <UsagePage />
      default:
        return <OverviewPage />
    }
  }

  return (
    <Layout className="app-layout">
      <Sider
        width={240}
        className="app-sider"
      >
        <Sidebar />
      </Sider>
      <Layout className="app-main-layout">
        <Content className="app-content">
          {renderPage()}
        </Content>
        <StatusBar />
      </Layout>
    </Layout>
  )
}

export default App