import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'

const GOOGLE_KEY_URL = 'https://aistudio.google.com/apikey'

// Every Google-issued key starts with this. Used only for a nudge, never to
// block a save: if Google ever changes the prefix, a hint that has gone stale
// must not convince anyone their perfectly good key is broken.
const KEY_PREFIX = 'AIza'

// Quotes and stray whitespace, which is what comes along when a key is
// pasted out of a notes app or a chat message.
const SURROUNDING_QUOTES = /^["']+|["']+$/g

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/60 text-xs font-semibold text-accent-800 dark:text-accent-200">
        {number}
      </span>
      <div className="flex-1 space-y-2 pt-0.5">{children}</div>
    </li>
  )
}

// Shared by the account settings panel and by the prompt that appears the
// moment a scan fails for want of a key (see GeminiKeyPrompt below), so both
// give the identical walkthrough instead of one of them being the good copy.
//
// Written for someone who has never heard the phrase "API key". The earlier
// version said "open Google AI Studio and click Create API key", which
// assumes the reader knows what a key is, expects a developer console, is
// not thrown by the page being in English, and knows what to do when Google
// asks which project to use. Each of those is a place where somebody who
// just wanted to photograph a receipt simply stops.
export function GeminiKeyForm({ onSaved }: { onSaved?: () => void }) {
  const { t } = useLanguage()
  const { updateProfile } = useAuth()
  const queryClient = useQueryClient()
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  // An invisible trailing space failing the save with "this key doesn't
  // work" would send someone back to Google to fetch a key that was fine.
  const cleanedKey = apiKey.trim().replace(SURROUNDING_QUOTES, '')
  const looksWrong = cleanedKey !== '' && !cleanedKey.startsWith(KEY_PREFIX)

  const saveMutation = useMutation({
    mutationFn: () => api.put('/auth/gemini-key/', { api_key: cleanedKey }),
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
    <div className="space-y-4">
      <ol className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
        <Step number={1}>
          <p>
            {t(
              'Kliknij przycisk poniżej. Otworzy się strona Google - jest po angielsku, więc się nie zrażaj. Zaloguj się swoim zwykłym kontem Google, tym od Gmaila.',
            )}
          </p>
          <a
            href={GOOGLE_KEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700"
          >
            {t('Otwórz stronę Google →')}
          </a>
        </Step>
        <Step number={2}>
          <p>
            {t(
              'Na tej stronie kliknij niebieski przycisk „Create API key”. Jeśli Google poprosi o wybranie projektu, wybierz dowolny z listy albo pozwól mu utworzyć nowy.',
            )}
          </p>
        </Step>
        <Step number={3}>
          <p>
            {t(
              'Pokaże się okienko z długim ciągiem znaków zaczynającym się od „AIza”. Skopiuj go w całości - obok jest ikonka kopiowania.',
            )}
          </p>
        </Step>
        <Step number={4}>
          <form onSubmit={onSubmit} className="space-y-2">
            <label className="block">
              <span className="block">{t('Wróć tutaj i wklej skopiowany ciąg w to pole:')}</span>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy…"
                required
                autoComplete="off"
                spellCheck={false}
                className="input mt-1 max-w-sm"
              />
            </label>
            {looksWrong && (
              <p className="max-w-sm text-xs text-amber-600 dark:text-amber-400">
                {t(
                  'To nie wygląda na ciąg od Google - powinien zaczynać się od „AIza”. Sprawdź, czy skopiowałeś/aś całość.',
                )}
              </p>
            )}
            {error && <p className="max-w-sm text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t('Sprawdzam u Google…') : t('Zapisz i włącz skanowanie')}
            </button>
          </form>
        </Step>
      </ol>

      {/* Folded away rather than in the flow: someone who just wants the
          feature working should not have to read a justification first, but
          anyone hesitating over pasting a Google credential into a website
          deserves a straight answer without having to go looking for it. */}
      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-accent-700 dark:text-accent-400">
          {t('Po co to jest i czy to bezpieczne?')}
        </summary>
        <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-400">
          {t(
            'Odczytanie zdjęcia to praca, za którą ktoś płaci Google. Gdybyśmy robili to na własny rachunek, skanowanie musiałoby być płatne albo mocno ograniczone - dzięki Twojemu własnemu, darmowemu limitowi jest bezpłatne. Wklejany ciąg działa jak hasło do tej jednej rzeczy: nie daje dostępu do Twojej poczty, dysku ani niczego innego na koncie Google. U nas leży zaszyfrowany, a w ustawieniach konta skasujesz go jednym kliknięciem.',
          )}
        </p>
      </details>
    </div>
  )
}

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
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {t('Zanim zeskanujesz pierwszy paragon')}
      </h2>
      <p className="mt-1 mb-4 text-sm text-slate-600 dark:text-slate-400">
        {t(
          'Zdjęcia paragonów odczytuje za Ciebie Google. Trzeba mu to raz zezwolić - zajmuje to jakieś dwie minuty, nie wymaga karty płatniczej i nic nie kosztuje.',
        )}
      </p>
      <GeminiKeyForm onSaved={() => setSaved(true)} />
    </div>
  )
}
