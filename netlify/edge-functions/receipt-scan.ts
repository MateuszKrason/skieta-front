// Turns a photo of a paragon into a proposed transaction (store, date,
// amount) using the user's OWN Gemini API key - never a key this app pays
// for. Runs here rather than in the Django backend for one reason: gunicorn
// there runs a single synchronous worker (see backend/startup.sh), so a
// multi-second wait on Gemini's vision call would stall every other visitor
// for its duration. An edge function has no such shared worker to block, and
// scales independently of the Django app.
//
// The photo itself never reaches Django at all. This function only ever
// reads two small things from Django: the user's Gemini key (see
// accounts.views.GeminiApiKeyRevealView) and their own expense category
// names, so Gemini can propose one of the user's real categories instead of
// inventing text that would never match anything in the dropdown. The
// parsed result goes straight back to the browser, which shows it as an
// editable preview and only then saves it as a normal transaction through
// the existing /api/budget/transactions/ endpoint - this function never
// writes anything itself.

const API_BASE = 'https://api.skieta.com/api'

/** Netlify exposes env through its own accessor, Deno through its; neither
 * is guaranteed to be there, and reading env can throw outright when the
 * permission is not granted. Every caller has a working default, so a
 * failure here is not worth surfacing - it just means the built-in model
 * name is used. */
function envOr(name: string, fallback: string): string {
  try {
    const netlifyEnv = (globalThis as { Netlify?: { env?: { get?: (key: string) => string | undefined } } }).Netlify
    const fromNetlify = netlifyEnv?.env?.get?.(name)
    if (fromNetlify) return fromNetlify
    const denoEnv = (globalThis as { Deno?: { env?: { get?: (key: string) => string | undefined } } }).Deno
    const fromDeno = denoEnv?.env?.get?.(name)
    if (fromDeno) return fromDeno
  } catch {
    // Ignored on purpose - see the note above.
  }
  return fallback
}

// Two models, because the two jobs are not the same job.
//
// Finding one big, well-printed number next to SUMA is something the
// cheapest tier does fine. Reading twenty-five lines of abbreviated Polish
// thermal print - "JOG.NAT.ZOTT 400G", truncated at the printer's column
// limit, on curled shiny paper - is where a lite model falls apart, so the
// per-item split asks a flash-tier model instead.
//
// The reason this is not simply "use the better model for everything" is
// the free tier's daily allowance, which differs by a factor of twenty-five:
// flash-lite gets 500 requests a day, flash gets 20. Everyday scanning would
// eat that in an afternoon. So the quick scan stays on lite and the stronger
// model is spent only on the rarer, harder job.
//
// Both are env-overridable because these names churn faster than this file
// gets touched: gemini-2.5-flash-lite, which this originally shipped with,
// was retired out from under a working production deploy and started
// answering 404. When that happens again, this should be a Netlify
// environment variable away from being fixed, not a code deploy.
// ai.google.dev/gemini-api/docs/models has the current list.
const SCAN_MODEL = envOr('GEMINI_SCAN_MODEL', 'gemini-3.5-flash-lite')
const SPLIT_MODEL = envOr('GEMINI_SPLIT_MODEL', 'gemini-3.8-flash')

function geminiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
}

const REVEAL_TIMEOUT_MS = 5000
// Vision calls are slower than a plain text prompt - long enough for a real
// photo, short enough that a hung request doesn't tie up the function
// indefinitely.
const GEMINI_TIMEOUT_MS = 25000
// A stronger model producing twenty-five rows instead of six fields needs
// noticeably longer. Kept env-overridable and deliberately short of a
// minute, since the platform imposes its own ceiling on how long an edge
// function may run - if real receipts start timing out here, raise this
// before assuming the model is at fault.
const SPLIT_TIMEOUT_MS = Number(envOr('GEMINI_SPLIT_TIMEOUT_MS', '40000'))
// Ceiling on the whole split attempt, retries included. runSplit can make
// three calls in a row, and three individual timeouts add up to far longer
// than the platform will keep an edge function alive - a function killed
// mid-retry gives the user a blank failure instead of the plain scan the
// retries exist to reach. So each attempt gets whatever is left of this
// budget rather than its own full timeout, and an attempt with too little
// time left is skipped instead of started and cut off.
const SPLIT_BUDGET_MS = Number(envOr('GEMINI_SPLIT_BUDGET_MS', '45000'))
// Below this there is not enough time left for a photo round trip to be
// worth starting.
const MIN_ATTEMPT_MS = 6000

const MAX_PHOTO_BYTES = 8 * 1024 * 1024

/** Lines that are not things anyone bought. Polish receipts carry plenty of
 * them, and a split that files "RABAT -4,50" as groceries is both wrong and
 * confusing to correct by hand. */
const NON_PRODUCT_HINT =
  'Pomiń wiersze, które nie są kupionym towarem: rabaty, kaucje za butelki, opłatę cukrową, ' +
  'podsumowanie PTU/VAT, NIP, numer karty, kwotę otrzymaną i resztę.'

// A closed list, not free text: Gemini has no way to know the user's own
// category names otherwise, and a category it invented (in whatever
// language, however it feels like phrasing "groceries" today) would almost
// never exact-match anything in the dropdown, making the suggestion useless
// more often than not. Picking from the user's own list - or saying none
// fit - is the only version of this that reliably lands as a real
// pre-filled selection rather than text nobody asked for.
function categoryInstruction(categoryNames: string[], field: string): string {
  if (categoryNames.length === 0) return `- ${field}: zawsze zwróć pusty string.`
  const list = categoryNames.map((name) => `"${name}"`).join(', ')
  return (
    `- ${field}: wybierz JEDNĄ najlepiej pasującą kategorię z tej listy, przepisując ją dokładnie ` +
    `tak jak podano: ${list}. Jeśli żadna nie pasuje sensownie, zwróć pusty string - nie wymyślaj ` +
    'własnej nazwy.'
  )
}

function buildExtractionPrompt(categoryNames: string[]): string {
  return `Odczytaj ten paragon fiskalny i zwróć dane zakupu w formacie JSON.

Zasady:
- amount: końcowa kwota do zapłaty (SUMA/RAZEM), jako string z kropką dziesiętną, np. "23.47".
- currency: kod waluty ISO, domyślnie "PLN" jeśli brak innej informacji.
- date: data transakcji w formacie YYYY-MM-DD.
- store_name: nazwa sklepu z nagłówka paragonu (nie NIP, nie adres).
- description: bardzo krótkie podsumowanie zakupu po polsku, np. "Zakupy spożywcze" (maks. 60 znaków).
${categoryInstruction(categoryNames, 'category_name')}

Jeśli któregoś pola nie da się odczytać, zwróć dla niego pusty string "". Nie zgaduj kwoty ani daty - pusty string jest lepszy niż błędna wartość.`
}

/** The same reading, plus a row per product. The instruction to make the
 * items add up to the total is not decoration: the client checks that sum
 * and makes the user resolve any difference before anything is saved (see
 * TransactionSplitSerializer on the backend), so a model that quietly drops
 * a line produces a visible discrepancy rather than a wrong budget. */
function buildSplitPrompt(categoryNames: string[]): string {
  return `Odczytaj ten paragon fiskalny pozycja po pozycji i zwróć wynik w formacie JSON.

Zasady ogólne:
- amount: końcowa kwota do zapłaty (SUMA/RAZEM), jako string z kropką dziesiętną, np. "23.47".
- currency: kod waluty ISO, domyślnie "PLN" jeśli brak innej informacji.
- date: data transakcji w formacie YYYY-MM-DD.
- store_name: nazwa sklepu z nagłówka paragonu (nie NIP, nie adres).
- description: bardzo krótkie podsumowanie zakupu po polsku, np. "Zakupy spożywcze" (maks. 60 znaków).
${categoryInstruction(categoryNames, 'category_name')}

Zasady dla listy items (jedna pozycja = jeden towar z paragonu):
- name: nazwa towaru dokładnie tak, jak wydrukowana na paragonie, nawet jeśli jest skrócona.
- amount: kwota zapłacona za tę pozycję, jako string z kropką dziesiętną. Jeśli w wierszu jest
  ilość razy cena (np. "2 x 3,99"), podaj wartość całego wiersza, nie cenę jednostkową.
${categoryInstruction(categoryNames, 'category_name w items')}
- ${NON_PRODUCT_HINT}
- Suma wszystkich items powinna zgadzać się z polem amount. Jeśli nie potrafisz odczytać jakiejś
  pozycji, pomiń ją - lepiej krótsza lista niż zmyślona kwota.

Jeśli któregoś pola nie da się odczytać, zwróć dla niego pusty string "". Nie zgaduj kwoty ani daty - pusty string jest lepszy niż błędna wartość.`
}

// Every property is a plain "string", never a nullable type array
// (`type: ["string","null"]`) - that syntax is newer and less consistently
// supported across Gemini model versions, and this app has no way to test
// it live against a real key (see the module-level note above). A schema
// this basic - one flat object, six string properties, nothing optional -
// is the form structured output has supported since it launched, which
// matters most here precisely because a bad schema fails the *entire*
// request with no way to see why (see the note on hiding Gemini's error
// body below). "Not found" is expressed in-band as "" and converted back to
// null in normalizeParsedReceipt below, so callers still see the same
// store_name: string | null shape as before.
const RECEIPT_PROPERTIES = {
  store_name: { type: 'string' },
  date: { type: 'string' },
  amount: { type: 'string' },
  currency: { type: 'string' },
  description: { type: 'string' },
  category_name: { type: 'string' },
}
const RECEIPT_REQUIRED = ['store_name', 'date', 'amount', 'currency', 'description', 'category_name']

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: RECEIPT_PROPERTIES,
  required: RECEIPT_REQUIRED,
}

const SPLIT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    ...RECEIPT_PROPERTIES,
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          amount: { type: 'string' },
          category_name: { type: 'string' },
        },
        required: ['name', 'amount', 'category_name'],
      },
    },
  },
  required: [...RECEIPT_REQUIRED, 'items'],
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

/** The user's own expense category names, so Gemini can pick a real one
 * instead of inventing text that will never match the dropdown. Best-effort:
 * an empty list here just means the prompt tells Gemini to skip
 * category_name, not that the whole scan fails - the store/date/amount this
 * endpoint exists for don't depend on it. */
async function fetchUsersExpenseCategories(authHeader: string): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/budget/categories/?type=expense`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(REVEAL_TIMEOUT_MS),
    })
    if (!response.ok) return []
    const data = await response.json()
    if (!Array.isArray(data)) return []
    return data.map((c: { name?: unknown }) => c.name).filter((name): name is string => typeof name === 'string')
  } catch {
    return []
  }
}

/** The handful of categories the user ticked for this particular receipt.
 * Narrowing the closed list from "all of them" to "these four" both raises
 * the odds of a sensible per-item assignment and shrinks the review to the
 * groups they already said they expect. Anything malformed falls back to
 * the full list rather than failing the scan. */
function parseRequestedCategories(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== 'string' || raw.trim() === '') return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((name): name is string => typeof name === 'string' && name.trim() !== '')
  } catch {
    return []
  }
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

interface ReceiptItem {
  name: string
  amount: string
  /** Exact name of one of the categories offered in the prompt, or null when
   * none fitted - matched against real category ids client-side. */
  category_name: string | null
}

interface ParsedReceipt {
  store_name: string | null
  date: string | null
  amount: string | null
  currency: string | null
  description: string | null
  /** Exact name of one of the user's own expense categories, echoed back by
   * Gemini - matched against the real category list client-side, not an id,
   * since Gemini is never told any. null when none fit (or none exist). */
  category_name: string | null
  /** Only present when a split was asked for and the model that answered
   * could produce one. null when the scan fell back to the simpler model. */
  items: ReceiptItem[] | null
  /** How well the split went, when one was asked for.
   *
   * null       - the stronger model read it, item by item, as intended.
   * lite_model - the everyday model read it item by item instead. Still a
   *              real split, just from a model that misreads more thermal
   *              print, so the UI says to check the rows a little harder.
   * quota      - no split: the stronger model was out of daily requests.
   * no_split   - no split: neither model would produce one. The receipt is
   *              still read as a single amount. */
  degraded: 'lite_model' | 'quota' | 'no_split' | null
}

const RECEIPT_FIELDS = ['store_name', 'date', 'amount', 'currency', 'description', 'category_name'] as const

const blankToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : (value as string)

/** Rows Gemini could not read cleanly are dropped rather than guessed at.
 * A row with no amount is not a purchase anyone can review. */
function normalizeItems(value: unknown): ReceiptItem[] | null {
  if (!Array.isArray(value)) return null
  const items: ReceiptItem[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const record = raw as Record<string, unknown>
    if (typeof record.name !== 'string' || typeof record.amount !== 'string') continue
    if (record.amount.trim() === '') continue
    items.push({
      name: record.name,
      amount: record.amount,
      category_name: blankToNull(record.category_name),
    })
  }
  return items
}

/** Gemini returns "" for a field it couldn't read (see RESPONSE_SCHEMA above)
 * - normalized to null here so every other caller keeps working with the
 * same store_name: string | null shape this endpoint has always returned. */
function normalizeParsedReceipt(value: unknown): ParsedReceipt | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (!RECEIPT_FIELDS.every((key) => typeof record[key] === 'string')) return null
  return {
    store_name: blankToNull(record.store_name),
    date: blankToNull(record.date),
    amount: blankToNull(record.amount),
    currency: blankToNull(record.currency),
    description: blankToNull(record.description),
    category_name: blankToNull(record.category_name),
    items: normalizeItems(record.items),
    degraded: null,
  }
}

/** Three attempts, in descending order of how good the answer would be, and
 * the reason the split is worth having at all rather than being a feature
 * that works on a good day.
 *
 * The first version of this only retried on 429 and 404, and only ever
 * retried the *plain* scan - so anything else the stronger model might say
 * (a 400 on a schema it dislikes, a 503 while it is busy, a 403 on a key
 * without access to that tier) came back to the user as a flat error, and
 * even a clean 429 meant losing the split entirely for the rest of the day.
 * With a 20-requests-a-day allowance on that model, "the rest of the day"
 * is most of the time, which is what made the feature feel broken.
 *
 * So: ask the strong model; if it says anything other than yes, ask the
 * everyday model for the same item-by-item reading (500 a day, less
 * accurate on thermal print, but a split the user reviews anyway); and only
 * if that fails too, give up on the split and read the receipt as one
 * amount, which is still better than handing back nothing.
 *
 * Every failure is logged with its status - the body is deliberately not
 * echoed to the browser (see the note at the call site) but it is the only
 * thing that makes the next report diagnosable rather than guesswork. */
async function runSplit(
  apiKey: string,
  categoryNames: string[],
  mimeType: string,
  base64Photo: string,
): Promise<{ response: Response; degraded: ParsedReceipt['degraded'] }> {
  const splitPrompt = buildSplitPrompt(categoryNames)
  const deadline = Date.now() + SPLIT_BUDGET_MS
  const remaining = () => deadline - Date.now()

  const strong = await callGemini(
    SPLIT_MODEL, apiKey, splitPrompt, SPLIT_RESPONSE_SCHEMA,
    Math.min(SPLIT_TIMEOUT_MS, remaining()), mimeType, base64Photo,
  )
  if (strong.ok) return { response: strong, degraded: null }
  const strongStatus = strong.status
  console.error(
    `Split on ${SPLIT_MODEL} failed (${strongStatus}): ${await strong.text().catch(() => '')}`,
  )

  // The plain scan is the floor this function must always be able to reach,
  // so it gets first claim on what time is left - the second split attempt
  // only happens if there is room for both.
  if (remaining() > MIN_ATTEMPT_MS + GEMINI_TIMEOUT_MS) {
    const lite = await callGemini(
      SCAN_MODEL, apiKey, splitPrompt, SPLIT_RESPONSE_SCHEMA,
      Math.min(SPLIT_TIMEOUT_MS, remaining() - GEMINI_TIMEOUT_MS), mimeType, base64Photo,
    )
    if (lite.ok) return { response: lite, degraded: 'lite_model' }
    console.error(
      `Split on ${SCAN_MODEL} also failed (${lite.status}): ${await lite.text().catch(() => '')}`,
    )
  } else {
    console.error(`Skipping the ${SCAN_MODEL} split retry - only ${remaining()}ms of budget left`)
  }

  const plain = await callGemini(
    SCAN_MODEL, apiKey, buildExtractionPrompt(categoryNames), RESPONSE_SCHEMA, GEMINI_TIMEOUT_MS, mimeType, base64Photo,
  )
  // Which of the two messages the user gets: being out of daily requests is
  // worth saying plainly, because it fixes itself tomorrow. Anything else is
  // ours to fix, not theirs to wait out.
  return { response: plain, degraded: strongStatus === 429 ? 'quota' : 'no_split' }
}

function callGemini(
  model: string,
  apiKey: string,
  prompt: string,
  schema: unknown,
  timeoutMs: number,
  mimeType: string,
  base64Photo: string,
): Promise<Response> {
  return fetch(`${geminiUrl(model)}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Photo } }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: schema },
    }),
    signal: AbortSignal.timeout(timeoutMs),
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

  const wantsSplit = form.get('split') === '1'
  const requestedCategories = parseRequestedCategories(form.get('categories'))

  let apiKey: string | null
  let categoryNames: string[]
  try {
    // Independent requests, fetched together - fetchUsersExpenseCategories
    // never rejects (see its own try/catch), so a failure here is always
    // the key lookup, and the error handling below still means what it says.
    // When the client already said which categories it wants, the category
    // round trip is skipped entirely rather than fetched and thrown away.
    ;[apiKey, categoryNames] = await Promise.all([
      fetchUsersGeminiKey(authHeader),
      requestedCategories.length > 0
        ? Promise.resolve(requestedCategories)
        : fetchUsersExpenseCategories(authHeader),
    ])
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
  const mimeType = photo.type || 'image/jpeg'

  let geminiResponse: Response
  let degraded: ParsedReceipt['degraded'] = null
  try {
    if (wantsSplit) {
      ;({ response: geminiResponse, degraded } = await runSplit(apiKey, categoryNames, mimeType, base64Photo))
    } else {
      geminiResponse = await callGemini(
        SCAN_MODEL,
        apiKey,
        buildExtractionPrompt(categoryNames),
        RESPONSE_SCHEMA,
        GEMINI_TIMEOUT_MS,
        mimeType,
        base64Photo,
      )
    }
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

  return jsonResponse({ ...parsed, degraded })
}

export const config = { path: '/receipt-scan' }
