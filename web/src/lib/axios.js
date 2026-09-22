import axios from 'axios'
import { useAuth } from '@clerk/react'
import { useCallback } from 'react'

// Every backend route is mounted under /api, so it lives in the baseURL and
// callers pass paths like "/auth/callback". Exported so the socket client
// dials the same host (it connects at the origin, not under /api).
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error)

    if (error.response) {
      console.error(
        `API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response.status,
      )
    } else if (error.request) {
      console.warn('API request failed: no response received', error.config?.url)
    }

    return Promise.reject(error)
  },
)

// The token is attached per call rather than by a request interceptor, so a
// request fired the instant a component mounts always carries a fresh token
// instead of racing a module-level value set from an effect.
export const useApi = () => {
  const { getToken } = useAuth()

  const apiWithAuth = useCallback(
    async (config) => {
      const token = await getToken()
      const headers = { ...(config.headers ?? {}) }
      if (token) headers.Authorization = `Bearer ${token}`

      return api({ ...config, headers })
    },
    [getToken],
  )

  return { apiWithAuth }
}
