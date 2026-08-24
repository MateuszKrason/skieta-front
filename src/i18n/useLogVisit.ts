import { useEffect } from 'react'
import { api } from '../api/client'
import { useLanguage } from './LanguageContext'

const SESSION_FLAG = 'myfaj_visit_logged'

/** Fire-and-forget, once per browser tab session (not on every internal
 * navigation) — powers the admin "visits per language variant" stat (see
 * AdminStatystyki.tsx). Fires for anonymous visitors too, since the backend
 * endpoint is public and the landing page needs to be represented. */
export function useLogVisit() {
  const { language } = useLanguage()

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_FLAG)) return
    sessionStorage.setItem(SESSION_FLAG, '1')
    api.post('/auth/language-visits/', { language, path: window.location.pathname }).catch(() => {})
    // Only ever fires once per tab session — deliberately not re-running when
    // `language` changes later (a mid-session language switch isn't a new visit).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
