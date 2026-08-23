import { useEffect, useState } from 'react'

/** True when the viewport is at or below Tailwind's `sm` breakpoint (640px) -
 * for the rare case where a fixed-pixel SVG/chart dimension (Recharts axis
 * width, margins) needs to shrink on mobile, since CSS classes can't reach
 * inline SVG props like Recharts' `width`/`margin`. */
export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handler = () => setIsMobile(mql.matches)
    handler()
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
