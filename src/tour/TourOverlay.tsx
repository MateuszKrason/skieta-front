import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { useTour } from './TourContext'

interface Box {
  top: number
  left: number
  width: number
  height: number
}

// The same data-tour value can exist twice at once (desktop nav vs. the
// mobile hamburger menu's mirrored list) - only one is ever actually
// visible depending on viewport width, so pick whichever has real size
// instead of blindly taking the first DOM match.
function visibleTarget(selector: string): Element | null {
  const candidates = document.querySelectorAll(`[data-tour="${selector}"]`)
  for (const el of candidates) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return el
  }
  return null
}

function useTargetBox(selector: string | undefined): Box | null {
  const [box, setBox] = useState<Box | null>(null)

  useEffect(() => {
    setBox(null)
    if (!selector) return

    let cancelled = false
    let attempts = 0

    function measure() {
      const el = visibleTarget(selector!)
      if (!el) return false
      const rect = el.getBoundingClientRect()
      setBox({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
      return true
    }

    function tryMeasure() {
      if (cancelled) return
      if (measure()) return
      if (attempts < 40) {
        attempts += 1
        setTimeout(tryMeasure, 50)
      }
    }

    const el = visibleTarget(selector)
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    tryMeasure()

    function onUpdate() {
      measure()
    }
    window.addEventListener('resize', onUpdate)
    window.addEventListener('scroll', onUpdate, true)
    return () => {
      cancelled = true
      window.removeEventListener('resize', onUpdate)
      window.removeEventListener('scroll', onUpdate, true)
    }
  }, [selector])

  return box
}

export default function TourOverlay() {
  const { active, step, stepIndex, stepCount, next, prev, skip } = useTour()
  const { t } = useLanguage()
  const box = useTargetBox(step?.target)

  if (!active || !step) return null

  const pad = 6
  const spot = box
    ? { top: box.top - pad, left: box.left - pad, width: box.width + pad * 2, height: box.height + pad * 2 }
    : null

  const tooltipWidth = 320
  const viewportW = window.innerWidth
  const viewportH = window.innerHeight
  let tooltipTop = spot ? spot.top + spot.height + 12 : viewportH / 2 - 90
  if (spot && tooltipTop + 190 > viewportH) {
    tooltipTop = Math.max(12, spot.top - 12 - 170)
  }
  const tooltipLeft = spot
    ? Math.min(Math.max(12, spot.left), viewportW - tooltipWidth - 12)
    : viewportW / 2 - tooltipWidth / 2

  return (
    <div className="fixed inset-0 z-[100]">
      {spot ? (
        <>
          <div className="absolute bg-black/60" style={{ top: 0, left: 0, right: 0, height: Math.max(0, spot.top) }} />
          <div className="absolute bg-black/60" style={{ top: spot.top + spot.height, left: 0, right: 0, bottom: 0 }} />
          <div className="absolute bg-black/60" style={{ top: spot.top, left: 0, width: Math.max(0, spot.left), height: spot.height }} />
          <div
            className="absolute bg-black/60"
            style={{ top: spot.top, left: spot.left + spot.width, right: 0, height: spot.height }}
          />
          <div
            className="pointer-events-none absolute rounded-lg ring-2 ring-accent-400"
            style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}

      <div
        className="absolute rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-xl"
        style={{ top: tooltipTop, left: tooltipLeft, width: tooltipWidth }}
      >
        <p className="text-xs font-medium text-accent-600 dark:text-accent-400">
          {stepIndex + 1} / {stepCount}
        </p>
        <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{t(step.title)}</h3>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{t(step.body)}</p>
        <div className="mt-3 flex items-center justify-between">
          <button onClick={skip} className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:underline">
            {t('Pomiń przewodnik')}
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                onClick={prev}
                className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {t('Wstecz')}
              </button>
            )}
            <button
              onClick={next}
              className="rounded-md bg-accent-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-700"
            >
              {stepIndex >= stepCount - 1 ? t('Zakończ') : t('Dalej')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
