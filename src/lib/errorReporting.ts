// Frontend error reporting.
//
// 28k lines of TypeScript and no tests means the only way a rendering bug is
// discovered today is somebody filing feedback about it, which almost nobody
// does - they just leave. This is the other half of the backend's Sentry: what
// breaks in the browser never reaches the server logs at all.
//
// Two decisions worth knowing about:
//
// 1. The SDK is loaded lazily, after the app has mounted. It is around 35 kB
//    gzipped, and the landing page is the one page whose job is conversion -
//    it should not carry an error reporter into its critical path. The cost of
//    that choice is a window at startup where Sentry is not listening yet, so
//    the handlers below run from the first line of the app and replay whatever
//    they caught once the SDK arrives. Load-time errors are exactly the ones
//    worth having.
//
// 2. Nothing that identifies a person or their money is attached. No user
//    context, no request bodies, no breadcrumbs carrying input values - a
//    stack trace and a URL are enough to fix a bug, and everything this app
//    renders is somebody's account balance.

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
const ENVIRONMENT = (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ?? 'production'

type BufferedError = { error: unknown; source: 'error' | 'unhandledrejection' }

let buffered: BufferedError[] = []
let loaded = false

function bufferError(event: ErrorEvent) {
  if (!loaded) buffered.push({ error: event.error ?? event.message, source: 'error' })
}

function bufferRejection(event: PromiseRejectionEvent) {
  if (!loaded) buffered.push({ error: event.reason, source: 'unhandledrejection' })
}

export function initErrorReporting() {
  if (!DSN) return

  // Catch anything thrown while the SDK is still on its way over.
  window.addEventListener('error', bufferError)
  window.addEventListener('unhandledrejection', bufferRejection)

  const start = () =>
    import('@sentry/react')
      .then((Sentry) => {
        Sentry.init({
          dsn: DSN,
          environment: ENVIRONMENT,
          // Off by default in the SDK, spelled out because this is the setting
          // that would start shipping IP addresses and form values.
          sendDefaultPii: false,
          // Errors only. Tracing and session replay both cost quota and would
          // record what people type into a budget.
          tracesSampleRate: 0,
          // Browser extensions and injected scripts throw inside our page and
          // are not our bugs; they used to be most of the noise in any web
          // error tracker.
          ignoreErrors: ['ResizeObserver loop', 'Non-Error promise rejection captured'],
          denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i],
        })

        loaded = true
        window.removeEventListener('error', bufferError)
        window.removeEventListener('unhandledrejection', bufferRejection)
        for (const item of buffered) Sentry.captureException(item.error)
        buffered = []
      })
      .catch(() => {
        // An ad blocker or an offline run. Reporting is not worth a console
        // error of its own.
        window.removeEventListener('error', bufferError)
        window.removeEventListener('unhandledrejection', bufferRejection)
        buffered = []
      })

  // requestIdleCallback where it exists (Safari only got it recently), a short
  // timeout everywhere else. Read off a local rather than testing `in window`,
  // which narrows window itself and leaves the fallback branch unreachable.
  const idle = (window as Window & { requestIdleCallback?: typeof requestIdleCallback })
    .requestIdleCallback
  if (typeof idle === 'function') {
    idle(start, { timeout: 4000 })
  } else {
    window.setTimeout(start, 2000)
  }
}
