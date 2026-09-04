import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'

export const ACCESS_TOKEN_KEY = 'myfaj_access'
export const REFRESH_TOKEN_KEY = 'myfaj_refresh'

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },
  setAccess: (access: string) => localStorage.setItem(ACCESS_TOKEN_KEY, access),
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

export const api = axios.create({ baseURL: BASE_URL })

// Endpoints that are meaningful only when logged out. Sending a stale token
// along with them used to have a nasty consequence on the login form: the
// response interceptor below treats "401 on a request that carried a token"
// as an expired session, so a simple wrong-password attempt by someone with a
// leftover token in local storage triggered a refresh, failed, and redirected
// to /logowanie - a full page reload that wiped the form and its error message.
// The user saw their input vanish with no explanation at all.
const UNAUTHENTICATED_PATHS = [
  '/auth/login/',
  '/auth/register/',
  '/auth/refresh/',
  '/auth/password-reset/',
  '/auth/password-reset-confirm/',
  '/auth/cancel-deletion/',
]

api.interceptors.request.use((config) => {
  if (UNAUTHENTICATED_PATHS.some((path) => config.url?.startsWith(path))) {
    return config
  }
  const token = tokenStore.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefresh()
  if (!refresh) return null
  try {
    const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh })
    tokenStore.setAccess(data.access)
    return data.access as string
  } catch {
    tokenStore.clear()
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    // Only a request that actually carried a token can have "expired" — a 401
    // from an unauthenticated call (e.g. a wrong-password login attempt) is a
    // normal rejection, not a session timeout, and must reach the caller's
    // own catch block instead of forcing a hard redirect to /logowanie.
    const hadToken = !!original?.headers?.Authorization
    if (error.response?.status === 401 && original && !original._retry && hadToken) {
      original._retry = true
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }
      const newAccess = await refreshPromise
      if (newAccess) {
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      }
      window.location.href = '/logowanie'
    }
    return Promise.reject(error)
  },
)
