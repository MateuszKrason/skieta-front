import { useEffect, useRef, type RefObject } from 'react'

/** Closes an open dropdown/menu on an outside click or Escape - the small
 * bit of plumbing every popup menu in the header needs (the account menu,
 * and the camera/gallery picker on the receipt-scan button). Attach the
 * returned ref to the menu's outermost container. */
export function useDismissableMenu<T extends HTMLElement>(open: boolean, onClose: () => void): RefObject<T | null> {
  const containerRef = useRef<T>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) onClose()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  return containerRef
}
