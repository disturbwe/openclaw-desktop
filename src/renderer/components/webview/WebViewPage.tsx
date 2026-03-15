import React from 'react'
import { WebViewContainer } from './WebViewContainer'

interface WebViewPageProps {
  /** Page path for the native UI */
  path: string
  /** Hide control-ui sidebar for embedded mode */
  hideSidebar?: boolean
}

/**
 * WebView Page Component
 *
 * A wrapper that integrates the WebViewContainer into the app's routing system.
 */
export const WebViewPage: React.FC<WebViewPageProps> = ({ path, hideSidebar = true }) => {
  return (
    <div className="webview-page" style={{ height: '100%' }}>
      <WebViewContainer
        path={path}
        hideSidebar={hideSidebar}
      />
    </div>
  )
}

// Pre-configured page components
export const ChatPage: React.FC = () => (
  <WebViewPage path="/chat" />
)

export const ChannelsPage: React.FC = () => (
  <WebViewPage path="/channels" />
)

export const AgentsPage: React.FC = () => (
  <WebViewPage path="/agents" />
)

export const CronPage: React.FC = () => (
  <WebViewPage path="/cron" />
)

export const SkillsPage: React.FC = () => (
  <WebViewPage path="/skills" />
)

export const NodesPage: React.FC = () => (
  <WebViewPage path="/nodes" />
)

export const DebugPage: React.FC = () => (
  <WebViewPage path="/debug" />
)

export const UsagePage: React.FC = () => (
  <WebViewPage path="/usage" />
)

export default WebViewPage