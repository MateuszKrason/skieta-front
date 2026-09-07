// Turns a photo of a paragon into a proposed transaction (store, date,
// amount) using the user's OWN Gemini API key - never a key this app pays
// for. Runs here rather than in the Django backend for one reason: gunicorn
// there runs a single synchronous worker (see backend/startup.sh), so a
// multi-second wait on Gemini's vision call would stall every other visitor
// for its duration. An edge function has no such shared worker to block, and
// scales independently of the Django app.
//
// The photo itself never reaches Django at all. The only two things this
// function tells Django about are: "give me this user's Gemini key" (one
// fast, small request - see accounts.views.GeminiApiKeyRevealView) and
// nothing else. The parsed result goes straight back to the browser, which
// shows it as an editable preview and only then saves it as a normal
// transaction through the existing /api/budget/transactions/ endpoint - this
// function never writes anything itself.

const API_BASE = 'https://api.skieta.com/api'
const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const REVEAL_TIMEOUT_MS = 5000
// Vision calls are slower than a plain text prompt - long enough for a real
// photo, short enough that a hung request doesn't tie up the function
// indefinitely.
const GEMINI_TIMEOUT_MS = 25000

const MAX_PHOTO_BYTES = 8 * 1024 * 1024

const EXTRACTION_PROMPT = `Odczytaj ten paragon fiskalny i zwróć dane zakupu w formacie JSON.

Zasady:
- amount: końcowa kwota do zapłaty (SUMA/RAZEM), jako string z kropką dziesiętną, np. "23.47".
- currency: kod waluty ISO, domyślnie "PLN" jeśli brak innej informacji.
- date: data transakcji w formacie YYYY-MM-DD.
- store_name: nazwa sklepu z nagłówka paragonu (nie NIP, nie adres).
- description: bardzo krótkie podsumowanie zakupu po polsku, np. "Zakupy spożywcze" (maks. 60 znaków).

Jeśli któregoś pola nie da się odczytać, ustaw je na null. Nie zgaduj kwoty ani daty - null jest lepszy niż błędna wartość.`

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    store_name: { type: ['STRING', 'NULL'] },
    date: { type: ['STRING', 'NULL'] },
    amount: { type: ['STRING', 'NULL'] },
    currency: { type: ['STRING', 'NULL'] },
    description: { type: ['STRING', 'NULL'] },
  },
  required: ['store_name', 'date', 'amount', 'currency', 'description'],
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/** Server-to-server: this app's own Django backend, authenticated with the
 * same access token the browser used to reach this function. Never exposed
 * to the browser - see GeminiApiKeyRevealView's docstring for why this is
 * the one endpoint allowed to return the plaintext key at all. */
async function fetchUsersGeminiKey(authHeader: string): Promise<string | null> {
  const response = await fetch(`${API_BASE}/auth/gemini-key/reveal/`, {
    headers: { Authorization: authHeader },
    signal: AbortSignal.timeout(REVEAL_TIMEOUT_MS),
  })
  if (!response.ok) return null
  const data = await response.json()
  return data.api_key ?? null
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buffer)
  // Chunked to stay well under the argument-count limits String.fromCharCode
  // hits on large typed arrays - a phone photo can be several MB.
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

interface ParsedReceipt {
  store_name: string | null
  date: string | null
  amount: string | null
  currency: string | null
  description: string | null
}

function isValidParsedReceipt(value: unknown): value is ParsedReceipt {
  if (!value || typeof value !== 'object') return false
  const keys = ['store_name', 'date', 'amount', 'currency', 'description']
  return keys.every((key) => {
    const v = (value as Record<string, unknown>)[key]
    return v === null || typeof v === 'string'
  })
}

export default async (request: Request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ detail: 'Method not allowed.' }, 405)
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return jsonResponse({ detail: 'Brak autoryzacji.' }, 401)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return jsonResponse({ detail: 'Nieprawidłowe dane formularza.' }, 400)
  }

  const photo = form.get('photo')
  if (!(photo instanceof File)) {
    return jsonResponse({ detail: 'Brak zdjęcia paragonu.' }, 400)
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return jsonResponse({ detail: 'Zdjęcie jest za duże (limit 8 MB).' }, 400)
  }

  let apiKey: string | null
  try {
    apiKey = await fetchUsersGeminiKey(authHeader)
  } catch {
    return jsonResponse({ detail: 'Nie udało się zweryfikować konta - spróbuj ponownie.' }, 502)
  }
  if (!apiKey) {
    // A distinct error code the frontend checks for, so it can point the
    // user at Settings instead of showing a generic failure - this is by far
    // the most common way this endpoint fails, since the key is opt-in.
    return jsonResponse({ error: 'no_gemini_key', detail: 'Nie ustawiono klucza Gemini.' }, 403)
  }

  const base64Photo = await fileToBase64(photo)

  let geminiResponse: Response
  try {
    geminiResponse = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: EXTRACTION_PROMPT },
              { inlineData: { mimeType: photo.type || 'image/jpeg', data: base64Photo } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    })
  } catch {
    return jsonResponse({ detail: 'Nie udało się połączyć z Gemini - spróbuj ponownie.' }, 502)
  }

  if (!geminiResponse.ok) {
    // Never echo Gemini's own error body back - it can quote the request,
    // and the request contains the user's key in the URL.
    const status = geminiResponse.status === 400 ? 400 : 502
    return jsonResponse(
      { detail: 'Gemini nie rozpoznało paragonu - spróbuj innego zdjęcia albo wpisz dane ręcznie.' },
      status,
    )
  }

  let parsed: unknown
  try {
    const payload = await geminiResponse.json()
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
    parsed = JSON.parse(text)
  } catch {
    return jsonResponse(
      { detail: 'Nie udało się odczytać odpowiedzi Gemini - spróbuj innego zdjęcia.' },
      502,
    )
  }

  if (!isValidParsedReceipt(parsed)) {
    return jsonResponse({ detail: 'Nieoczekiwana odpowiedź Gemini - spróbuj ponownie.' }, 502)
  }

  return jsonResponse(parsed)
}

export const config = { path: '/receipt-scan' }
