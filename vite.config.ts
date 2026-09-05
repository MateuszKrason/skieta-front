// vitest/config's defineConfig, not vite's - it's the same function, but its
// type also recognises the `test` option below. Importing from plain 'vite'
// type-checks fine until `test` is added, then fails tsc with an opaque
// "does not exist in type 'UserConfigExport'" that has nothing to do with
// the actual config.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Mirrors public/_headers (applied by Netlify in production) so local dev
// and `vite preview` send the same security headers — keep the two in sync.
const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' https://cloud.umami.is; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://cloud.umami.is https://gateway.umami.is https://*.ingest.sentry.io https://*.ingest.de.sentry.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Not applied here: Vite's dev server injects its own inline HMR/React
    // Refresh preamble script, which a strict script-src would block. The
    // built app (what `preview` serves, and what Netlify actually deploys)
    // has no such inline script — see index.html/gtag-init.js.
  },
  preview: {
    headers: securityHeaders,
  },
  test: {
    // jsdom, not Node's default: format.ts reads localStorage (the saved UI
    // language) to pick a locale for Intl.NumberFormat, and Node has no such
    // global. Scope is deliberately narrow - the calculation layer
    // (lib/format.ts and friends), not components; see package.json's `test`
    // script, which `npm run build` now runs before `vite build` so a broken
    // tax or money calculation fails the build instead of reaching Netlify.
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
