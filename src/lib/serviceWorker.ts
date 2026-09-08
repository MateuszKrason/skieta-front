// Registers public/sw.js. See that file for what the worker does and, more
// importantly, what it deliberately refuses to cache.
//
// Production only: Vite's dev server serves modules it expects the browser to
// re-fetch on every change, and a worker sitting in front of that fights HMR
// in ways that look like the app being broken rather than the worker being
// wrong.
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  // After load, not during: registration competes for bandwidth with the
  // chunks the page is still fetching, and nothing on screen depends on it.
  window.addEventListener('load', () => {
    // A failed registration is not worth surfacing - it costs the user
    // installability and a warm cache, neither of which is something they
    // asked for on this page load, and the app works identically without it.
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
