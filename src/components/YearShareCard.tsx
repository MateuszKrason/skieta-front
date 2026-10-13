import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { ShareLine } from '../lib/yearReview'

const WIDTH = 1080
const HEIGHT = 1350
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

/** Shrinks the type until the text fits the width, so a long category name is never cut off. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxWidth: number): number {
  let current = size
  ctx.font = `${weight} ${current}px ${FONT}`
  while (ctx.measureText(text).width > maxWidth && current > 28) {
    current -= 4
    ctx.font = `${weight} ${current}px ${FONT}`
  }
  return current
}

function draw(canvas: HTMLCanvasElement, title: string, subtitle: string, lines: ShareLine[], footer: string, logo: HTMLImageElement | null) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const margin = 96

  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  background.addColorStop(0, '#022c22')
  background.addColorStop(1, '#065f46')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.textBaseline = 'alphabetic'
  let brandX = margin
  if (logo) {
    ctx.drawImage(logo, margin, 84, 72, 72)
    brandX += 92
  }
  ctx.fillStyle = '#6ee7b7'
  ctx.font = `700 56px ${FONT}`
  ctx.fillText('skieta', brandX, 140)

  ctx.fillStyle = '#ffffff'
  fitFont(ctx, title, 800, 104, WIDTH - 2 * margin)
  ctx.fillText(title, margin, 330)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = `500 40px ${FONT}`
  ctx.fillText(subtitle, margin, 392)

  // The lines share the space between the heading and the footer evenly,
  // whether there are two of them or four.
  const top = 480
  const bottom = HEIGHT - 190
  const slot = lines.length > 0 ? (bottom - top) / lines.length : 0
  lines.forEach((line, index) => {
    const y = top + slot * index
    ctx.fillStyle = '#6ee7b7'
    fitFont(ctx, line.value, 800, 116, WIDTH - 2 * margin)
    ctx.fillText(line.value, margin, y + 104)
    ctx.fillStyle = 'rgba(255,255,255,0.88)'
    fitFont(ctx, line.label, 500, 40, WIDTH - 2 * margin)
    ctx.fillText(line.label, margin, y + 160)
  })

  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.fillRect(margin, HEIGHT - 150, WIDTH - 2 * margin, 2)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  fitFont(ctx, footer, 500, 36, WIDTH - 2 * margin)
  ctx.fillText(footer, margin, HEIGHT - 84)
}

interface Props {
  year: number
  title: string
  subtitle: string
  lines: ShareLine[]
  amounts: boolean
  onAmountsChange: (value: boolean) => void
}

// The picture people post: drawn in the browser from numbers already on the
// page, so nothing about the account leaves the device until the person
// presses a button themselves.
export default function YearShareCard({ year, title, subtitle, lines, amounts, onAmountsChange }: Props) {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [logo, setLogo] = useState<HTMLImageElement | null>(null)
  // Sharing a file is a phone feature; a desktop browser gets the download only.
  const [canShare] = useState(() => {
    try {
      const probe = new File([''], 'probe.png', { type: 'image/png' })
      return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] })
    } catch {
      return false
    }
  })
  const [failed, setFailed] = useState(false)
  const footer = t('skieta.com · budżet i inwestycje w jednym miejscu')

  useEffect(() => {
    const image = new Image()
    image.onload = () => setLogo(image)
    image.src = '/favicon.svg'
  }, [])

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, title, subtitle, lines, footer, logo)
  }, [title, subtitle, lines, footer, logo])

  function asBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!canvasRef.current) return resolve(null)
      canvasRef.current.toBlob(resolve, 'image/png')
    })
  }

  async function download() {
    setFailed(false)
    const blob = await asBlob()
    if (!blob) return setFailed(true)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `moj-rok-${year}-skieta.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  async function share() {
    setFailed(false)
    const blob = await asBlob()
    if (!blob) return setFailed(true)
    try {
      await navigator.share({ files: [new File([blob], `moj-rok-${year}-skieta.png`, { type: 'image/png' })], title })
    } catch {
      // Closing the share sheet is not an error worth reporting.
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-label={`${title}. ${lines.map((line) => `${line.value} ${line.label}`).join('. ')}`}
        className="w-full max-w-xs rounded-xl shadow-md"
      />
      <div className="space-y-4">
        <p className="max-w-prose text-sm text-slate-600 dark:text-slate-400">
          {t(
            'Obrazek powstaje w Twojej przeglądarce i nigdzie nie jest wysyłany. Domyślnie nie ma na nim żadnej kwoty, tylko procenty, liczby i nazwy.',
          )}
        </p>
        <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" className="mt-0.5" checked={amounts} onChange={(e) => onAmountsChange(e.target.checked)} />
          <span>{t('Pokaż na obrazku odłożoną kwotę')}</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={download}>
            {t('Pobierz obrazek')}
          </button>
          {canShare && (
            <button
              type="button"
              className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              onClick={share}
            >
              {t('Udostępnij')}
            </button>
          )}
        </div>
        {failed && <p className="text-sm text-red-600 dark:text-red-400">{t('Nie udało się przygotować obrazka.')}</p>}
      </div>
    </div>
  )
}
