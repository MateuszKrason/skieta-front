import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { api, tokenStore } from '../api/client'
import { useLanguage, type Language } from '../i18n/LanguageContext'
import { useTheme } from '../theme/ThemeContext'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (
    username: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    baseCurrency: string,
    inviteToken: string,
    language: Language,
    termsAccepted: boolean,
  ) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  updateProfile: (patch: Partial<User['profile']>) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { setTheme } = useTheme()
  const { setLanguage } = useLanguage()
  // Only apply the account's configured color variant/language once per
  // session (app load, or right after login/register) — not on every later
  // refreshUser() call, so a quick local toggle mid-session isn't silently
  // overwritten by an unrelated profile save.
  const hasSyncedPreferences = useRef(false)

  function syncPreferencesFromUser(data: User) {
    if (!hasSyncedPreferences.current) {
      hasSyncedPreferences.current = true
      setTheme(data.profile.color_variant)
      setLanguage(data.profile.language)
    }
  }

  async function fetchMe() {
    try {
      const { data } = await api.get<User>('/auth/me/')
      setUser(data)
      syncPreferencesFromUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tokenStore.getAccess()) {
      fetchMe()
    } else {
      setLoading(false)
    }
  }, [])

  async function login(username: string, password: string) {
    const { data } = await api.post('/auth/login/', { username, password })
    tokenStore.set(data.access, data.refresh)
    await fetchMe()
  }

  async function register(
    username: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    baseCurrency: string,
    inviteToken: string,
    language: Language,
    termsAccepted: boolean,
  ) {
    const { data } = await api.post('/auth/register/', {
      username,
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      base_currency: baseCurrency,
      invite_token: inviteToken,
      language,
      terms_accepted: termsAccepted,
    })
    tokenStore.set(data.access, data.refresh)
    setUser(data.user)
    syncPreferencesFromUser(data.user)
  }

  function logout() {
    tokenStore.clear()
    setUser(null)
    hasSyncedPreferences.current = false
  }

  // Applies a known profile change (e.g. a color/language toggle) straight
  // to local state instead of waiting on a PATCH-then-refetch round trip.
  // Quick-toggle buttons used to re-fetch `/auth/me/` after saving, but two
  // clicks close together fire two independent request pairs with no
  // guaranteed resolution order — whichever GET happens to land last "wins",
  // which isn't necessarily the last thing the user actually clicked. Since
  // the caller already knows the exact value it just asked the server to
  // save, applying it locally (via the functional setState form, so rapid
  // calls still apply in the order they were made) can't go stale like that.
  function updateProfile(patch: Partial<User['profile']>) {
    setUser((prev) => (prev ? { ...prev, profile: { ...prev.profile, ...patch } } : prev))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser: fetchMe, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
