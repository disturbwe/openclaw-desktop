import React, { useState, useCallback, useEffect } from 'react'
import { Spin, Result, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import './WebViewContainer.css'

// Extend Window interface for openclaw API
declare global {
  interface Window {
    openclaw: {
      gateway: {
        getConfig: () => Promise<{
          gateway?: {
            auth?: {
              token?: string
            }
          }
        } | null>
      }
    }
  }
}

// control-ui is served from the main process dashboard server
const CONTROL_UI_BASE_URL = 'http://localhost:7000/control-ui'
const GATEWAY_WS_URL = 'ws://localhost:18789'

interface WebViewContainerProps {
  /** UI path relative to control-ui root, e.g., '/chat', '/overview' */
  path: string
  /** Base URL for control-ui, defaults to local dashboard server */
  baseUrl?: string
  /** Height of the iframe, defaults to '100%' */
  height?: string | number
  /** Hide control-ui sidebar for embedded mode */
  hideSidebar?: boolean
}

/**
 * Get Gateway token from embedded gateway config
 */
async function getGatewayToken(): Promise<string | null> {
  try {
    const config = await window.openclaw.gateway.getConfig()
    return config?.gateway?.auth?.token || null
  } catch {
    return null
  }
}

/**
 * WebView Container Component
 *
 * Loads openclaw-core native UI pages via iframe.
 * The control-ui is built and served from the main process dashboard server.
 * Automatically injects Gateway token for seamless authentication.
 */
export const WebViewContainer: React.FC<WebViewContainerProps> = ({
  path,
  baseUrl = CONTROL_UI_BASE_URL,
  height = '100%',
  hideSidebar = false,
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(true)

  // Fetch Gateway token on mount
  useEffect(() => {
    let mounted = true

    async function fetchToken() {
      setTokenLoading(true)
      // Retry a few times as token might be generated during gateway startup
      for (let i = 0; i < 5; i++) {
        const t = await getGatewayToken()
        if (t && mounted) {
          setToken(t)
          setTokenLoading(false)
          return
        }
        await new Promise(r => setTimeout(r, 1000))
      }
      if (mounted) {
        setTokenLoading(false)
      }
    }

    fetchToken()
    return () => { mounted = false }
  }, [])

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  // Build URL with gatewayUrl and token in hash if available
  const hashParams = new URLSearchParams()
  hashParams.set('gatewayUrl', GATEWAY_WS_URL)
  if (token) {
    hashParams.set('token', token)
  }
  const fullUrl = `${baseUrl}${normalizedPath}#${hashParams.toString()}`

  const handleLoad = useCallback(() => {
    setLoading(false)
    setError(null)
  }, [])

  const handleError = useCallback(() => {
    setLoading(false)
    setError('Failed to load page')
  }, [])

  const handleReload = useCallback(() => {
    setLoading(true)
    setError(null)
    // Force reload by updating key
    const iframe = document.querySelector(`iframe[src="${fullUrl}"]`) as HTMLIFrameElement
    if (iframe) {
      iframe.src = fullUrl
    }
  }, [fullUrl])

  if (error) {
    return (
      <div className="webview-error">
        <Result
          status="error"
          title="无法加载页面"
          subTitle={`无法加载 control-ui。请确保应用已正确构建。`}
          extra={
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleReload}
            >
              重试
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="webview-container" style={{ height }}>
      {(loading || tokenLoading) && (
        <div className="webview-loading">
          <Spin size="large" tip={tokenLoading ? "获取认证令牌..." : "加载中..."} />
        </div>
      )}
      <iframe
        src={fullUrl}
        className={`webview-iframe ${hideSidebar ? 'webview-iframe--no-sidebar' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        title={`OpenClaw UI - ${path}`}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}

export default WebViewContainer