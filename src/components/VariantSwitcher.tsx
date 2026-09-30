import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { useTheme, type Theme } from '../theme/ThemeContext'

// Each swatch is the variant itself, its page colour and its accent split
// diagonally, so a visitor can tell what they are picking before reading the
// label. Three explicit choices rather than the app's one cycling button: on
// the landing page nobody knows yet that there are three to cycle through.
const VARIANTS: { value: Theme; label: string; ground: string; accent: string }[] = [
  { value: 'light', label: 'Jasny', ground: '#ffffff', accent: '#059669' },
  { value: 'dark', label: 'Ciemny', ground: '#0f172a', accent: '#34d399' },
  { value: 'pink', label: 'Lawendowy', ground: '#f6f2ff', accent: '#8b5cf6' },
]

export default function VariantSwitcher() {
  const { theme, setTheme } = useTheme()
  const { user, updateProfile } = useAuth()
  const { t } = useLanguage()

  function choose(next: Theme) {
    if (next === theme) return
    setTheme(next)
    if (!user) return
    // A signed-in visitor's choice belongs to the account, as it does from the
    // app's own toggle - otherwise the next session puts the old one back.
    updateProfile({ color_variant: next })
    api.patch('/auth/me/', { color_variant: next }).catch(() => {
      // The shared read-only demo refuses profile changes; the colours still change for this visit.
    })
  }

  return (
    <div role="group" aria-label={t('Wariant kolorystyczny')} className="flex items-center gap-1.5">
      {VARIANTS.map((variant) => {
        const active = theme === variant.value
        return (
          <button
            key={variant.value}
            type="button"
            aria-pressed={active}
            aria-label={t(variant.label)}
            title={t(variant.label)}
            onClick={() => choose(variant.value)}
            className={`h-6 w-6 shrink-0 rounded-full border transition ${
              active
                ? 'border-transparent ring-2 ring-accent-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950'
                : 'border-slate-300 hover:scale-110 dark:border-slate-600'
            }`}
            style={{ background: `linear-gradient(135deg, ${variant.ground} 50%, ${variant.accent} 50%)` }}
          />
        )
      })}
    </div>
  )
}
