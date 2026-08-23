import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './auth/AuthContext'
import { useLanguage } from './i18n/LanguageContext'
import AdminRoute from './components/AdminRoute'
import EditorRoute from './components/EditorRoute'
import ProtectedRoute from './components/ProtectedRoute'
import { PageLoader } from './components/Loader'
import ArticleDetail from './pages/ArticleDetail'
import Landing from './pages/Landing'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import NotFound from './pages/NotFound'

// Lazy-loaded: everything below only renders behind a login, so none of it
// needs to ship in the bundle a first-time (logged-out) visitor downloads —
// PageSpeed flagged ~224 KiB of this chunk as unused on the public landing
// page before this split.
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Banking = lazy(() => import('./pages/Banking'))
const Planowanie = lazy(() => import('./pages/Planowanie'))
const Timeline = lazy(() => import('./pages/Timeline'))
const Account = lazy(() => import('./pages/Account'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail'))
const AdminFeedback = lazy(() => import('./pages/admin/AdminFeedback'))
const AdminStatystyki = lazy(() => import('./pages/admin/AdminStatystyki'))
const AdminRole = lazy(() => import('./pages/admin/AdminRole'))
const AdminAccessRequests = lazy(() => import('./pages/admin/AdminAccessRequests'))
const AdminGroupInvites = lazy(() => import('./pages/admin/AdminGroupInvites'))
const Redakcja = lazy(() => import('./pages/Redakcja'))
const GieldaLayout = lazy(() => import('./pages/gielda/GieldaLayout'))
const Portfel = lazy(() => import('./pages/gielda/Portfel'))
const Dywidendy = lazy(() => import('./pages/gielda/Dywidendy'))
const AnalizaSpolek = lazy(() => import('./pages/gielda/AnalizaSpolek'))
const AnalysisLayout = lazy(() => import('./pages/analysis/AnalysisLayout'))
const Bilans = lazy(() => import('./pages/analysis/Bilans'))
const Przychody = lazy(() => import('./pages/analysis/Przychody'))
const Wydatki = lazy(() => import('./pages/analysis/Wydatki'))
const Kategorie = lazy(() => import('./pages/analysis/Kategorie'))
const InvestmentCalculator = lazy(() => import('./pages/InvestmentCalculator'))

const PAGE_TITLES: [string, string][] = [
  ['/polityka-prywatnosci', 'Polityka prywatności'],
  ['/regulamin', 'Regulamin usługi'],
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
  ['/budzet/bilans', 'Bilans'],
  ['/budzet/przychody', 'Przychody'],
  ['/budzet/wydatki', 'Wydatki'],
  ['/budzet/kategorie', 'Kategorie'],
  ['/budzet', 'Budżet'],
  ['/analiza', 'Analiza'],
  ['/dashboard', 'Dashboard'],
]

function AdminIndexRedirect() {
  const { user } = useAuth()
  if (user?.is_staff) return <Navigate to="uzytkownicy" replace />
  if (user?.profile.permissions.includes('stats.view')) return <Navigate to="statystyki" replace />
  if (user?.profile.permissions.includes('invites.manage')) return <Navigate to="zaproszenia-grupowe" replace />
  return <Navigate to="/dashboard" replace />
}

function useDocumentTitle() {
  const location = useLocation()
  const { t } = useLanguage()
  useEffect(() => {
    const match = PAGE_TITLES.find(([path]) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)))
    document.title = match ? `${t(match[1])} - skieta` : 'skieta'
  }, [location.pathname, t])
}

// Only the routes that are actually public/crawlable (see robots.txt) get a
// canonical tag pointing at themselves — everything else (the app itself,
// behind login) points back at the landing page, since that's the one real
// entry point search engines should treat as canonical for those paths.
const CANONICAL_SELF_PATHS = ['/', '/polityka-prywatnosci', '/regulamin']

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
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/witaj" element={<Navigate to="/" replace />} />
      <Route path="/polityka-prywatnosci" element={<PrivacyPolicy />} />
      <Route path="/regulamin" element={<Terms />} />
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
              <Route path="zaproszenia-grupowe" element={<AdminGroupInvites />} />
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

          <Route path="/budzet" element={<AnalysisLayout />}>
            <Route index element={<Navigate to="bilans" replace />} />
            <Route path="bilans" element={<Bilans />} />
            <Route path="przychody" element={<Przychody />} />
            <Route path="wydatki" element={<Wydatki />} />
            <Route path="kategorie" element={<Kategorie />} />
          </Route>

          <Route path="/analiza" element={<InvestmentCalculator />} />
          {/* Old budget-analysis URLs, kept working under their new /budzet
              path now that /analiza means the investment calculator instead. */}
          <Route path="/analiza/bilans" element={<Navigate to="/budzet/bilans" replace />} />
          <Route path="/analiza/przychody" element={<Navigate to="/budzet/przychody" replace />} />
          <Route path="/analiza/wydatki" element={<Navigate to="/budzet/wydatki" replace />} />
          <Route path="/analiza/kategorie" element={<Navigate to="/budzet/kategorie" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  )
}
