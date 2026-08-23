import { useEffect } from 'react'

/** Tags the current page `noindex` for as long as `active` is true, restoring
 * whatever the meta tag said before on cleanup/deactivation - for pages that
 * technically return HTTP 200 (a static SPA can't do otherwise) but aren't
 * real content: the 404 catch-all, and a bad article slug. */
export function useNoindex(active: boolean) {
  useEffect(() => {
    if (!active) return
    let tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.name = 'robots'
      document.head.appendChild(tag)
    }
    const previous = tag.content
    tag.content = 'noindex'
    return () => {
      tag!.content = previous
    }
  }, [active])
}
