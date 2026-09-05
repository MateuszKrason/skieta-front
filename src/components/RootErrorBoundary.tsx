import { Component, type ReactNode } from 'react'
import SockLogo from './SockLogo'

// Deliberately no useLanguage/useTheme/react-router hooks here: this is the
// last screen standing if literally anything above it - including those
// providers themselves - throws during render, so it can depend on nothing
// that could be the thing that just crashed. Hardcoded Polish text and a
// plain <a> instead of <Link> for the same reason.
function CrashFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center shadow-sm">
        <h1 className="mb-4 flex items-center justify-center gap-2 text-2xl font-bold text-accent-700 dark:text-accent-400">
          <SockLogo className="h-8 w-8" />
          skieta
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Coś poszło nie tak. Spróbuj odświeżyć stronę - Twoje dane są bezpieczne, to błąd wyświetlania.
        </p>
        <button type="button" onClick={() => window.location.reload()} className="btn-primary mt-5 w-full">
          Odśwież stronę
        </button>
        <a href="/" className="mt-4 inline-block text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline">
          Wróć do strony głównej
        </a>
      </div>
    </div>
  )
}

type Props = { children: ReactNode }
type State = { hasError: boolean }

/** Catches any render-time crash in the tree below it. Before this existed,
 * one broken component (a chart fed malformed data, a null field somewhere
 * in a 28k-line codebase with no tests) took the whole app to a blank white
 * screen with no way back short of the user guessing to hit refresh - see
 * errorReporting.ts for why nothing here catches those errors on its own.
 *
 * A plain class component on purpose, not @sentry/react's own ErrorBoundary:
 * that one needs the SDK loaded up front, which is exactly the ~35 kB
 * critical-path cost errorReporting.ts's lazy-load exists to avoid. This one
 * mounts for free and only reaches for Sentry, lazily, once something has
 * actually broken. */
export default class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    import('@sentry/react')
      .then((Sentry) => Sentry.captureException(error))
      .catch(() => {})
  }

  render() {
    if (this.state.hasError) return <CrashFallback />
    return this.props.children
  }
}
