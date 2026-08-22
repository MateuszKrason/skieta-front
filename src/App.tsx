import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './auth/AuthContext'
import { useLanguage } from './i18n/LanguageContext'
import AdminRoute from './components/AdminRoute'
import EditorRoute from './components/EditorRoute'
import ProtectedRoute from './components/ProtectedRoute'
import ArticleDetail from './pages/ArticleDetail'
import Landing from './pages/Landing'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Banking from './pages/Banking'
import Planowanie from './pages/Planowanie'
import Timeline from './pages/Timeline'
import Account from './pages/Account'
import AdminLayout from './pages/admin/AdminLayout'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserDetail from './pages/admin/AdminUserDetail'
import AdminFeedback from './pages/admin/AdminFeedback'
import AdminStatystyki from './pages/admin/AdminStatystyki'
import AdminRole from './pages/admin/AdminRole'
import AdminAccessRequests from './pages/admin/AdminAccessRequests'
import Redakcja from './pages/Redakcja'
import GieldaLayout from './pages/gielda/GieldaLayout'
import Portfel from './pages/gielda/Portfel'
import Dywidendy from './pages/gielda/Dywidendy'
import AnalizaSpolek from './pages/gielda/AnalizaSpolek'
import AnalysisLayout from './pages/analysis/AnalysisLayout'
import Bilans from './pages/analysis/Bilans'
import Przychody from './pages/analysis/Przychody'
import Wydatki from './pages/analysis/Wydatki'
import Kategorie from './pages/analysis/Kategorie'

const PAGE_TITLES: [string, string][] = [
  ['/polityka-prywatnosci', 'Polityka prywatności'],
  ['/', 'Panuj nad swoimi finansami'],
  ['/logowanie', 'Logowanie'],
  ['/register', 'Rejestracja'],
  ['/zapomnialem-hasla', 'Reset hasła'],
  ['/reset-hasla', 'Reset hasła'],
  ['/zweryfikuj-email', 'Weryfikacja e-mail'],
  ['/onboarding', 'Dodaj posiadane rzeczy'],
  ['/moje-konto', 'Moje konto'],
  ['/redakcja', 'Redakcja artykułów'],
  ['/admin/uzytkownicy/', 'Szczegóły użytkownika'],
  ['/admin/uzytkownicy', 'Panel administratora'],
  ['/admin/feedback', 'Panel administratora'],
  ['/admin', 'Panel administratora'],
  ['/konta', 'Konta i lokaty'],
  ['/planowanie', 'Planowanie budżetu'],
  ['/timeline', 'Timeline'],
  ['/gielda/portfel', 'Portfel'],
  ['/gielda/dywidendy', 'Dywidendy'],
  ['/gielda/analiza-spolek', 'Analiza spółek'],
  ['/gielda', 'Giełda'],
  ['/analiza/bilans', 'Bilans'],
  ['/analiza/przychody', 'Przychody'],
  ['/analiza/wydatki', 'Wydatki'],
  ['/analiza/kategorie', 'Kategorie'],
  ['/analiza', 'Budżet'],
  ['/dashboard', 'Dashboard'],
]

function AdminIndexRedirect() {
  const { user } = useAuth()
  if (user?.is_staff) return <Navigate to="uzytkownicy" replace />
  if (user?.profile.permissions.includes('stats.view')) return <Navigate to="statystyki" replace />
  return <Navigate to="/dashboard" replace />
}

function useDocumentTitle() {
  const location = useLocation()
  const { t } = useLanguage()
  useEffect(() => {
    const match = PAGE_TITLES.find(([path]) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)))
    document.title = match ? `${t(match[1])} – skieta` : 'skieta'
  }, [location.pathname, t])
}

// Only the routes that are actually public/crawlable (see robots.txt) get a
// canonical tag pointing at themselves — everything else (the app itself,
// behind login) points back at the landing page, since that's the one real
// entry point search engines should treat as canonical for those paths.
const CANONICAL_SELF_PATHS = ['/', '/polityka-prywatnosci']

function useCanonicalLink() {
  const location = useLocation()
  useEffect(() => {
    let tag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!tag) {
      tag = document.createElement('link')
      tag.rel = 'canonical'
      document.head.appendChild(tag)
    }
    const isSelfCanonical =
      CANONICAL_SELF_PATHS.includes(location.pathname) || location.pathname.startsWith('/artykuly/')
    const path = isSelfCanonical ? location.pathname : '/'
    tag.href = `${window.location.origin}${path}`
  }, [location.pathname])
}

export default function App() {
  useDocumentTitle()
  useCanonicalLink()
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/witaj" element={<Navigate to="/" replace />} />
      <Route path="/polityka-prywatnosci" element={<PrivacyPolicy />} />
      <Route path="/artykuly/:slug" element={<ArticleDetail />} />
      <Route path="/logowanie" element={<Login />} />
      <Route path="/login" element={<Navigate to="/logowanie" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/zapomnialem-hasla" element={<ForgotPassword />} />
      <Route path="/reset-hasla" element={<ResetPassword />} />
      <Route path="/zweryfikuj-email" element={<VerifyEmail />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/konta" element={<Banking />} />
          <Route path="/planowanie" element={<Planowanie />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/moje-konto" element={<Account />} />
          <Route element={<EditorRoute />}>
            <Route path="/redakcja" element={<Redakcja />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminIndexRedirect />} />
              <Route path="uzytkownicy" element={<AdminUsers />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="statystyki" element={<AdminStatystyki />} />
              <Route path="prosby-o-dostep" element={<AdminAccessRequests />} />
              <Route path="role" element={<AdminRole />} />
            </Route>
            <Route path="/admin/uzytkownicy/:id" element={<AdminUserDetail />} />
          </Route>

          <Route path="/gielda" element={<GieldaLayout />}>
            <Route index element={<Navigate to="portfel" replace />} />
            <Route path="portfel" element={<Portfel />} />
            <Route path="dywidendy" element={<Dywidendy />} />
            <Route path="analiza-spolek" element={<AnalizaSpolek />} />
          </Route>

          <Route path="/analiza" element={<AnalysisLayout />}>
            <Route index element={<Navigate to="bilans" replace />} />
            <Route path="bilans" element={<Bilans />} />
            <Route path="przychody" element={<Przychody />} />
            <Route path="wydatki" element={<Wydatki />} />
            <Route path="kategorie" element={<Kategorie />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
