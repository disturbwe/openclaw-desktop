import { useCallback } from 'react'

const API_BASE = 'http://localhost:7000'

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

export function useApi() {
  const fetchData = useCallback(async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    const { method = 'GET', body, headers = {} } = options

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }, [])

  return { fetchData }
}

export function useSessionsApi() {
  const { fetchData } = useApi()

  const getSessions = useCallback(() => {
    return fetchData<{ sessions: Array<{
      id: string
      agentId: string
      model: string
      status: string
      startTime: string
      endTime?: string
      messageCount: number
      tokensUsed: number
      cost: number
      snippet?: string
    }> }>('/api/sessions')
  }, [fetchData])

  return { getSessions }
}

export function useSystemApi() {
  const { fetchData } = useApi()

  const getSystemStats = useCallback(() => {
    return fetchData<{
      cpu: number
      ram: number
      disk: number
      temperature?: number
      uptime: number
    }>('/api/system')
  }, [fetchData])

  const getHealthHistory = useCallback(() => {
    return fetchData<Array<{
      time: string
      cpu: number
      ram: number
      disk: number
      temperature?: number
    }>>('/api/health-history')
  }, [fetchData])

  return { getSystemStats, getHealthHistory }
}

export function useUsageApi() {
  const { fetchData } = useApi()

  const getUsage = useCallback(() => {
    return fetchData<{
      claude: {
        tokensUsed: number
        requestCount: number
        cost: number
        models: Record<string, { tokens: number; cost: number }>
      }
      gemini?: {
        tokensUsed: number
        requestCount: number
        cost: number
        models: Record<string, { tokens: number; cost: number }>
      }
    }>('/api/usage')
  }, [fetchData])

  const getCosts = useCallback(() => {
    return fetchData<{
      total: number
      byModel: Record<string, number>
      byDay: Array<{ date: string; amount: number }>
    }>('/api/costs')
  }, [fetchData])

  return { getUsage, getCosts }
}