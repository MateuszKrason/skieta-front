import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function EditorRoute() {
  const { user } = useAuth()
  if (!user?.is_staff && !user?.profile.is_editor) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
