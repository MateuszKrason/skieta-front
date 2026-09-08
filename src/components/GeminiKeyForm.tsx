import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'

// Shared by the account settings panel and by the prompt that appears the
// moment a scan fails for want of a key (see GeminiKeyPrompt below). Both
// need the identical save-and-validate behaviour, and the second one only
// exists because sending someone to Settings mid-task was where most people
// gave up on receipt scanning entirely.
export function GeminiKeyForm({ onSaved }: { onSaved?: () => void }) {
  const { t } = useLanguage()
  const { updateProfile } = useAuth()
  const queryClient = useQueryClient()
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  const saveMutation = useMutation({
    mutationFn: () => api.put('/auth/gemini-key/', { api_key: apiKey }),
    onSuccess: () => {
      setApiKey('')
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['gemini-key-status'] })
      // Flips the receipt buttons from "show me the instructions" back to
      // "open the camera" straight away, without waiting for the next
      // /auth/me/ round trip.
      updateProfile({ has_gemini_api_key: true })
      onSaved?.()
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się zapisać klucza.'))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    saveMutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <a
        href="https://aistudio.google.com/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline"
      >
        {t('Pobierz darmowy klucz Google →')}
      </a>
      <input
        type="text"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder={t('Wklej klucz Gemini')}
        required
        className="input"
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? t('Sprawdzanie klucza…') : t('Zapisz klucz')}
      </button>
    </form>
  )
}

const SETUP_STEPS = [
  'Otwórz Google AI Studio i kliknij "Create API key" - jest darmowy i zajmuje minutę.',
  'Skopiuj wygenerowany klucz.',
  'Wklej go poniżej. Przechowujemy go zaszyfrowany i używamy wyłącznie do odczytania Twoich paragonów.',
]

/** Shown in place of the old one-line "add a key in settings" note. Someone
 * who just photographed a receipt is as motivated as they will ever be to set
 * this up - sending them to another page to do it, with no instructions on
 * either end, threw that away. The whole setup happens here instead, and the
 * scan can be retried without leaving the page. */
export function GeminiKeyPrompt() {
  const { t } = useLanguage()
  const [saved, setSaved] = useState(false)

  if (saved) {
    return (
      <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-5">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
          {t('Klucz zapisany. Kliknij przycisk z paragonem jeszcze raz i wybierz zdjęcie.')}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {t('Jeszcze jeden krok: darmowy klucz Gemini')}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {t(
          'Paragony odczytuje Google Gemini na Twoim własnym, darmowym limicie - dzięki temu funkcja jest bezpłatna i nikt poza Tobą nie płaci za Twoje skany.',
        )}
      </p>
      <ol className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
        {SETUP_STEPS.map((step, i) => (
          <li key={step} className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-900 text-xs font-semibold text-amber-900 dark:text-amber-200">
              {i + 1}
            </span>
            {t(step)}
          </li>
        ))}
      </ol>
      <div className="mt-4 max-w-sm">
        <GeminiKeyForm onSaved={() => setSaved(true)} />
      </div>
    </div>
  )
}
