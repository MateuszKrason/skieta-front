import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { useLanguage } from './i18n/LanguageContext'
import AdminRoute from './components/AdminRoute'
import ProtectedRoute from './components/ProtectedRoute'
import ArticleDetail from './pages/ArticleDetail'
import Landing from './pages/Landing'
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
import Admin from './pages/Admin'
import GieldaLayout from './pages/gielda/GieldaLayout'
import Portfel from './pages/gielda/Portfel'
import Dywidendy from './pages/gielda/Dywidendy'
import AnalizaSpolek from './pages/gielda/AnalizaSpolek'
import AnalysisLayout from './pages/analysis/AnalysisLayout'
import Bilans from './pages/analysis/Bilans'
import Przychody from './pages/analysis/Przychody'
import Wydatki from './pages/analysis/Wydatki'

const PAGE_TITLES: [string, string][] = [
  ['/witaj', 'Panuj nad swoimi finansami'],
  ['/login', 'Logowanie'],
  ['/register', 'Rejestracja'],
  ['/zapomnialem-hasla', 'Reset hasła'],
  ['/reset-hasla', 'Reset hasła'],
  ['/zweryfikuj-email', 'Weryfikacja e-mail'],
  ['/onboarding', 'Dodaj posiadane rzeczy'],
  ['/moje-konto', 'Moje konto'],
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
  ['/analiza', 'Analiza'],
  ['/', 'Dashboard'],
]

function useDocumentTitle() {
  const location = useLocation()
  const { t } = useLanguage()
  useEffect(() => {
    const match = PAGE_TITLES.find(([path]) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)))
    document.title = match ? `${t(match[1])} – Skieta` : 'Skieta'
  }, [location.pathname, t])
}

export default function App() {
  useDocumentTitle()
  return (
    <Routes>
      <Route path="/witaj" element={<Landing />} />
      <Route path="/artykuly/:slug" element={<ArticleDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/zapomnialem-hasla" element={<ForgotPassword />} />
      <Route path="/reset-hasla" element={<ResetPassword />} />
      <Route path="/zweryfikuj-email" element={<VerifyEmail />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/konta" element={<Banking />} />
          <Route path="/planowanie" element={<Planowanie />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/moje-konto" element={<Account />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
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
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
