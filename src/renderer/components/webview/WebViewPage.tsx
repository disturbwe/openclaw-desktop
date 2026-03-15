import React from 'react'
import { WebViewContainer } from './WebViewContainer'

interface WebViewPageProps {
  /** Page path for the native UI */
  path: string
  /** Page title for accessibility */
  title?: string
  /** Hide control-ui sidebar for embedded mode */
  hideSidebar?: boolean
}

/**
 * WebView Page Component
 *
 * A wrapper that integrates the WebViewContainer into the app's routing system.
 */
export const WebViewPage: React.FC<WebViewPageProps> = ({ path, title, hideSidebar = true }) => {
  return (
    <div className="webview-page" style={{ height: '100%' }}>
      <WebViewContainer
        path={path}
        title={title}
        hideSidebar={hideSidebar}
      />
    </div>
  )
}

// Pre-configured page components
export const ChatPage: React.FC = () => (
  <WebViewPage path="/chat" title="Chat" />
)

export const ChannelsPage: React.FC = () => (
  <WebViewPage path="/channels" title="Channels" />
)

export const AgentsPage: React.FC = () => (
  <WebViewPage path="/agents" title="Agents" />
)

export const CronPage: React.FC = () => (
  <WebViewPage path="/cron" title="Cron Jobs" />
)

export const SkillsPage: React.FC = () => (
  <WebViewPage path="/skills" title="Skills" />
)

export const NodesPage: React.FC = () => (
  <WebViewPage path="/nodes" title="Nodes" />
)

export const DebugPage: React.FC = () => (
  <WebViewPage path="/debug" title="Debug" />
)

export const UsagePage: React.FC = () => (
  <WebViewPage path="/usage" title="Usage" />
)

export default WebViewPage