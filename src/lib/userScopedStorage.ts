/** The bits of localStorage that belong to whoever is signed in, rather than
 * to the device. Both are database ids, and a database id means nothing -
 * or worse, means something wrong - to the next person to sign in here.
 *
 * Everything else the app keeps locally (theme, language, which account
 * sections are collapsed, dismissed nudges) is a property of this browser
 * and deliberately survives a sign-out. */
export const LAST_ACCOUNT_KEY_PREFIX = 'skieta.lastTransactionAccount.'
export const LAST_CATEGORY_KEY_PREFIX = 'skieta.lastTransactionCategory.'

const USER_SCOPED_PREFIXES = [LAST_ACCOUNT_KEY_PREFIX, LAST_CATEGORY_KEY_PREFIX]

export function clearUserScopedStorage() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (USER_SCOPED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key)
      }
    }
  } catch {
    // Private browsing / blocked site data - nothing was ever stored, so
    // there is nothing to clear either.
  }
}
