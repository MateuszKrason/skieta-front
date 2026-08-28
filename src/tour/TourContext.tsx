import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { TOUR_STEPS, type TourStep } from './tourSteps'

interface TourContextValue {
  active: boolean
  step: TourStep | null
  stepIndex: number
  stepCount: number
  next: () => void
  prev: () => void
  skip: () => void
  start: () => void
}

const TourContext = createContext<TourContextValue | undefined>(undefined)

export function TourProvider({ children }: { children: ReactNode }) {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const autoStarted = useRef(false)

  const steps = useMemo(
    () => TOUR_STEPS.filter((s) => !s.interest || !user?.profile || user.profile[s.interest]),
    [user],
  )

  // Auto-start once per account, the very first time it loads the app after
  // registering - never again afterwards, regardless of how many times this
  // provider remounts within the session.
  useEffect(() => {
    if (!autoStarted.current && user && !user.profile.has_seen_tour) {
      autoStarted.current = true
      setStepIndex(0)
      setActive(true)
    }
  }, [user])

  const step = active ? (steps[stepIndex] ?? null) : null

  useEffect(() => {
    if (step?.path && step.path !== location.pathname) {
      navigate(step.path)
    }
    // Only re-run when the step itself changes - not on every location
    // change, which would otherwise fight the user navigating manually
    // mid-tour (e.g. via browser back).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function finish() {
    setActive(false)
    updateProfile({ has_seen_tour: true })
    api.patch('/auth/me/', { has_seen_tour: true }).catch(() => {})
  }

  function next() {
    if (stepIndex >= steps.length - 1) {
      finish()
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  function prev() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  function start() {
    setStepIndex(0)
    setActive(true)
  }

  return (
    <TourContext.Provider value={{ active, step, stepIndex, stepCount: steps.length, next, prev, skip: finish, start }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}
