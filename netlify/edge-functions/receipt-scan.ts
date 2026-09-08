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

Jeśli któregoś pola nie da się odczytać, zwróć dla niego pusty string "". Nie zgaduj kwoty ani daty - pusty string jest lepszy niż błędna wartość.`

// Every property is a plain "string", never a nullable type array
// (`type: ["string","null"]`) - that syntax is newer and less consistently
// supported across Gemini model versions, and this app has no way to test
// it live against a real key (see the module-level note above). A schema
// this basic - one flat object, five string properties, nothing optional -
// is the form structured output has supported since it launched, which
// matters most here precisely because a bad schema fails the *entire*
// request with no way to see why (see the note on hiding Gemini's error
// body below). "Not found" is expressed in-band as "" and converted back to
// null in normalizeParsedReceipt below, so callers still see the same
// store_name: string | null shape as before.
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    store_name: { type: 'string' },
    date: { type: 'string' },
    amount: { type: 'string' },
    currency: { type: 'string' },
    description: { type: 'string' },
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

const RECEIPT_FIELDS = ['store_name', 'date', 'amount', 'currency', 'description'] as const

/** Gemini returns "" for a field it couldn't read (see RESPONSE_SCHEMA above)
 * - normalized to null here so every other caller keeps working with the
 * same store_name: string | null shape this endpoint has always returned. */
function normalizeParsedReceipt(value: unknown): ParsedReceipt | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (!RECEIPT_FIELDS.every((key) => typeof record[key] === 'string')) return null
  const blankToNull = (s: unknown) => (typeof s === 'string' && s.trim() === '' ? null : (s as string))
  return {
    store_name: blankToNull(record.store_name),
    date: blankToNull(record.date),
    amount: blankToNull(record.amount),
    currency: blankToNull(record.currency),
    description: blankToNull(record.description),
  }
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
    // The body itself is never echoed to the browser - Gemini's error
    // responses can quote back parts of the request, which here includes
    // the user's own key in the URL - but the bare status code is safe, and
    // without it every failure looks identical from the UI. Logged in full
    // server-side (Netlify's own function logs, never the browser) so a
    // repeat failure is actually diagnosable next time instead of guessed at
    // a third time.
    const errorBody = await geminiResponse.text().catch(() => '')
    console.error(`Gemini generateContent failed: ${geminiResponse.status} ${errorBody}`)
    return jsonResponse(
      {
        detail: `Gemini nie rozpoznało paragonu (błąd ${geminiResponse.status}) - spróbuj innego zdjęcia albo wpisz dane ręcznie.`,
      },
      geminiResponse.status === 400 ? 400 : 502,
    )
  }

  let parsed: ParsedReceipt | null = null
  try {
    const payload = await geminiResponse.json()
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
    parsed = normalizeParsedReceipt(JSON.parse(text))
  } catch (err) {
    console.error('Failed to parse Gemini response as the expected receipt JSON:', err)
  }

  if (!parsed) {
    return jsonResponse(
      { detail: 'Nie udało się odczytać odpowiedzi Gemini - spróbuj innego zdjęcia.' },
      502,
    )
  }

  return jsonResponse(parsed)
}

export const config = { path: '/receipt-scan' }
