// Where to go once the visitor has signed in or created an account - set by
// pages that need an account to open, such as a shared expense link, so the
// person lands back on what they were invited to instead of the dashboard.
// Kept for the browser tab only, and only ever a path on this site.

const KEY = 'skieta.returnTo'

function isLocalPath(path: string) {
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')
}

export function rememberReturnTo(path: string) {
  if (!isLocalPath(path)) return
  try {
    sessionStorage.setItem(KEY, path)
  } catch {
    // Blocked storage: the person simply lands on the usual page after signing in.
  }
}

/** Read once: the path is forgotten as soon as it is used. */
export function takeReturnTo(): string | null {
  try {
    const path = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    return path && isLocalPath(path) ? path : null
  } catch {
    return null
  }
}
