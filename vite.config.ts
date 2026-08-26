import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Mirrors public/_headers (applied by Netlify in production) so local dev
// and `vite preview` send the same security headers — keep the two in sync.
const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com; font-src 'self' data:; connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
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
})
