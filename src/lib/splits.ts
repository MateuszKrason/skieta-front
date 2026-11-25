import { api } from '../api/client'
import { formatMoney } from './format'

// Shared expense groups (backend/splits). Everyone in a group is signed in
// and takes part under their own account: "me" always comes from the
// server, never from this device. The server does the arithmetic
// that counts - every write answers with the whole group state - and the
// helpers below only mirror it for the live preview in the expense form.

export const SPLIT_CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP', 'CHF', 'CZK', 'NOK', 'SEK', 'DKK', 'HUF', 'TRY', 'JPY', 'CAD', 'AUD'] as const
export type SplitCurrency = (typeof SPLIT_CURRENCIES)[number]

export type SplitKind = 'trip' | 'project' | 'outing' | 'home' | 'pair' | 'other'
export type SplitMode = 'equal' | 'percent' | 'amount'

export const KIND_LABELS: Record<SplitKind, string> = {
  trip: 'Wyjazd',
  project: 'Przedsięwzięcie',
  outing: 'Wyjście',
  home: 'Wspólne mieszkanie',
  pair: 'Stałe rozliczenie we dwoje',
  other: 'Inne',
}

export const KIND_ICONS: Record<SplitKind, string> = {
  trip: '🧳',
  project: '🛠️',
  outing: '🍕',
  home: '🏠',
  pair: '👫',
  other: '🧾',
}

export const MAX_MEMBERS = 10

// A game or bet played during the event (backend SplitGame), settled together
// with the costs: each player's win or loss goes into their balance.
export type GameKind = 'poker' | 'tournament' | 'bet' | 'points' | 'loser'
export const GAME_KINDS: GameKind[] = ['poker', 'tournament', 'bet', 'points', 'loser']

export const GAME_LABELS: Record<GameKind, string> = {
  poker: 'Poker',
  tournament: 'Turniej z pulą nagród',
  bet: 'Zakład',
  points: 'Gra na punkty',
  loser: 'Kto przegra, ten stawia',
}

export const GAME_ICONS: Record<GameKind, string> = {
  poker: '🃏',
  tournament: '🏆',
  bet: '🎯',
  points: '🎲',
  loser: '🍕',
}

export const GAME_HINTS: Record<GameKind, string> = {
  poker: 'Każdy wpisuje, ile wrzucił, a na koniec, ile ma żetonów. Wynik wchodzi do rozliczenia wyjazdu.',
  tournament: 'Każdy płaci wpisowe, pula idzie za miejsca. Bilard, dart, FIFA, kręgle.',
  bet: 'Każdy stawia na wynik, trafiający dzielą pulę według stawek. Mecz, kto pierwszy zjedzie.',
  points: 'Stawka za punkt, liczona od średniej. Tysiąc, kierki, kręgle, golf.',
  loser: 'Przegrany przejmuje części wygranych z jednego wydatku. Pizza, piwo, taksówka.',
}

export interface SplitGameEntry {
  member: number
  stake: string
  score: string | null
  place: number | null
  pick: string
  lost: boolean
  /** Won (+) or lost (-) in the group's currency. */
  result: string
}

export interface SplitGame {
  id: number
  kind: GameKind
  title: string
  date: string
  params: {
    chip_value?: string
    payouts?: string[]
    options?: string[]
    result?: string
    point_value?: string
    lower_wins?: boolean
  }
  expense: number | null
  entries: SplitGameEntry[]
  /** Set when the stored game no longer adds up (its expense changed); it then counts as zero. */
  problem: string | null
  created_by: number | null
  updated_by: number | null
  created_at: string
  updated_at: string
}

export interface GameInput {
  kind: GameKind
  title: string
  date: string
  params: SplitGame['params']
  expense: number | null
  entries: { member: number; stake: string; score: string | null; place: number | null; pick: string; lost: boolean }[]
}

export interface SplitMember {
  id: number
  name: string
  linked: boolean
  is_me: boolean
  is_owner: boolean
  can_delete: boolean
}

export interface SplitShare {
  member: number
  value: string
  owed: string
  owed_group: string
}

export interface SplitExpense {
  id: number
  title: string
  description: string
  tags: string[]
  amount: string
  currency: string
  rate: string
  rate_source: 'same' | 'nbp' | 'manual'
  amount_group: string
  date: string
  paid_by: number
  split_mode: SplitMode
  shares: SplitShare[]
  created_by: number | null
  updated_by: number | null
  created_at: string
  updated_at: string
  exported: boolean
}

export interface SplitSettlement {
  id: number
  from_member: number
  to_member: number
  amount: string
  currency: string
  amount_group: string
  date: string
  note: string
  created_at: string
}

export interface SplitBalance {
  member: number
  paid: string
  share: string
  sent: string
  received: string
  /** Won (+) or lost (-) in games and bets. */
  games: string
  net: string
}

export interface SplitTransfer {
  from_member: number
  to_member: number
  amount: string
}

export interface SplitState {
  group: {
    name: string
    kind: SplitKind
    description: string
    currency: string
    share_token: string
    is_owner: boolean
    created_at: string
    updated_at: string
  }
  members: SplitMember[]
  me: number | null
  expenses: SplitExpense[]
  settlements: SplitSettlement[]
  games: SplitGame[]
  balances: SplitBalance[]
  transfers: SplitTransfer[]
  total: string
  tags: string[]
  limits: { members: number }
  created_member?: number
  created_expense?: number
  created_game?: number
  exported_count?: number
}

export interface SplitGroupSummary {
  name: string
  kind: SplitKind
  currency: string
  share_token: string
  is_owner: boolean
  members: string[]
  /** This account's name in the group. */
  my_name: string | null
  expense_count: number
  game_count: number
  total: string
  my_net: string | null
  settled: boolean
  updated_at: string
}

export interface SplitExportItem {
  expense: number
  title: string
  date: string
  tags: string[]
  expense_amount: string
  expense_currency: string
  my_part: string
  paid_by_me: boolean
  amount: string
  for_others: string
  currency: string
  exported: boolean
}

export interface SplitExportPreview {
  items: SplitExportItem[]
  categories: { id: number; name: string }[]
  accounts: { id: number; name: string; bank_name: string; currency: string }[]
}

export interface ExpenseInput {
  title: string
  description: string
  tags: string[]
  amount: string
  currency: string
  rate: string | null
  date: string
  paid_by: number
  split_mode: SplitMode
  shares: { member: number; value: string }[]
}

/** What the share link shows before signing in (backend splits.views.group_preview). */
export interface SplitPreview {
  name: string
  kind: SplitKind
  currency: string
  members: string[]
  expense_count: number
  total: string
  transfers: { from: string; to: string; amount: string }[]
}

const base = (token: string) => `/splits/s/${encodeURIComponent(token)}/`

/** The group state with the fields a backend from before games lacks filled in.
 * The two repositories deploy separately, so for a few minutes the new page can
 * talk to the old API; it should then simply show no games. */
function normalized(state: SplitState): SplitState {
  return {
    ...state,
    games: state.games ?? [],
    balances: state.balances.map((b) => ({ ...b, games: b.games ?? '0.00' })),
  }
}

export const splitsApi = {
  preview: (token: string) => api.get<SplitPreview>(`${base(token)}preview/`).then((r) => r.data),
  list: () => api.get<SplitGroupSummary[]>('/splits/groups/').then((r) => r.data),
  create: (body: {
    name: string
    kind: SplitKind
    currency: string
    description: string
    my_name: string
    other_names: string[]
  }) => api.post<SplitState>('/splits/groups/', body).then((r) => normalized(r.data)),
  get: (token: string) => api.get<SplitState>(base(token)).then((r) => normalized(r.data)),
  update: (token: string, body: Partial<{ name: string; kind: SplitKind; description: string; currency: string }>) =>
    api.patch<SplitState>(base(token), body).then((r) => normalized(r.data)),
  remove: (token: string) => api.delete(base(token)),
  rotateLink: (token: string) => api.post<SplitState>(`${base(token)}rotate-link/`).then((r) => normalized(r.data)),
  rate: (token: string, currency: string, date: string) =>
    api
      .get<{ rate: string; source: string }>(`${base(token)}rate/`, { params: { currency, date } })
      .then((r) => r.data),
  addMember: (token: string, name: string, claim: boolean) =>
    api.post<SplitState>(`${base(token)}members/`, { name, claim }).then((r) => normalized(r.data)),
  updateMember: (token: string, id: number, body: { name?: string; claim?: boolean }) =>
    api.patch<SplitState>(`${base(token)}members/${id}/`, body).then((r) => normalized(r.data)),
  removeMember: (token: string, id: number) =>
    api.delete<SplitState>(`${base(token)}members/${id}/`).then((r) => normalized(r.data)),
  addExpense: (token: string, body: ExpenseInput) =>
    api.post<SplitState>(`${base(token)}expenses/`, body).then((r) => normalized(r.data)),
  updateExpense: (token: string, id: number, body: ExpenseInput) =>
    api.patch<SplitState>(`${base(token)}expenses/${id}/`, body).then((r) => normalized(r.data)),
  removeExpense: (token: string, id: number) =>
    api.delete<SplitState>(`${base(token)}expenses/${id}/`).then((r) => normalized(r.data)),
  addSettlement: (
    token: string,
    body: { from_member: number; to_member: number; amount: string; date?: string; note?: string },
  ) => api.post<SplitState>(`${base(token)}settlements/`, body).then((r) => normalized(r.data)),
  removeSettlement: (token: string, id: number) =>
    api.delete<SplitState>(`${base(token)}settlements/${id}/`).then((r) => normalized(r.data)),
  addGame: (token: string, body: GameInput) => api.post<SplitState>(`${base(token)}games/`, body).then((r) => normalized(r.data)),
  updateGame: (token: string, id: number, body: GameInput) =>
    api.patch<SplitState>(`${base(token)}games/${id}/`, body).then((r) => normalized(r.data)),
  removeGame: (token: string, id: number) => api.delete<SplitState>(`${base(token)}games/${id}/`).then((r) => normalized(r.data)),
  /** A budget expense sent into a standing settlement, split equally (backend FromTransactionView). */
  fromTransaction: (token: string, transaction: number) =>
    api.post<SplitState>(`${base(token)}from-transaction/`, { transaction }).then((r) => normalized(r.data)),
  exportPreview: (token: string) => api.get<SplitExportPreview>(`${base(token)}export/`).then((r) => r.data),
  export: (
    token: string,
    body: { items: { expense: number; category: number | null }[]; account: number | null; add_tags: boolean },
  ) => api.post<SplitState>(`${base(token)}export/`, body).then((r) => normalized(r.data)),
}

// --- Live preview of a split (mirrors backend/splits/services.resolve_shares) ---------------

function toCents(value: string | number): number {
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 100) : NaN
}

/** Largest-remainder split of whole cents in proportion to `weights`. */
export function distributeCents(totalCents: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0 || totalCents <= 0) return weights.map(() => 0)
  const exact = weights.map((w) => (totalCents * w) / sum)
  const floors = exact.map((e) => Math.floor(e + 1e-9))
  let leftover = totalCents - floors.reduce((a, b) => a + b, 0)
  const order = exact
    .map((e, i) => ({ i, rem: e - floors[i] }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i)
  for (const { i } of order) {
    if (leftover <= 0) break
    floors[i] += 1
    leftover -= 1
  }
  return floors
}

export interface SharePreview {
  /** Owed amount per member id, in cents of the expense currency. */
  owed: Record<number, number>
  /** Empty when the split is valid, otherwise what to fix. */
  problem: string | null
  /** amount mode: what is still to be assigned (negative: assigned too much). percent mode: percent left. */
  remainder: number
}

export function previewShares(
  amount: string,
  mode: SplitMode,
  members: number[],
  values: Record<number, string>,
  included: Record<number, boolean>,
): SharePreview {
  const total = toCents(amount)
  const owed: Record<number, number> = {}
  if (!Number.isFinite(total) || total <= 0) {
    return { owed, problem: 'Wpisz kwotę.', remainder: 0 }
  }
  if (mode === 'equal') {
    const people = members.filter((m) => included[m])
    if (people.length === 0) return { owed, problem: 'Zaznacz przynajmniej jedną osobę.', remainder: 0 }
    const parts = distributeCents(total, people.map(() => 1))
    people.forEach((m, i) => (owed[m] = parts[i]))
    return { owed, problem: null, remainder: 0 }
  }
  if (mode === 'percent') {
    const weights = members.map((m) => Number((values[m] || '0').replace(',', '.')) || 0)
    if (weights.some((w) => w < 0)) return { owed, problem: 'Procent nie może być ujemny.', remainder: 0 }
    const sum = weights.reduce((a, b) => a + b, 0)
    const left = Math.round((100 - sum) * 100) / 100
    if (Math.abs(left) > 0.01) {
      return { owed, problem: 'Procenty muszą dać razem 100%.', remainder: left }
    }
    const parts = distributeCents(total, weights)
    members.forEach((m, i) => (owed[m] = parts[i]))
    return { owed, problem: null, remainder: 0 }
  }
  const cents = members.map((m) => toCents(values[m] || '0') || 0)
  if (cents.some((c) => c < 0)) return { owed, problem: 'Kwota nie może być ujemna.', remainder: 0 }
  const left = total - cents.reduce((a, b) => a + b, 0)
  members.forEach((m, i) => (owed[m] = cents[i]))
  if (left !== 0) {
    return { owed, problem: 'Kwoty osób muszą dać razem całą kwotę.', remainder: left / 100 }
  }
  return { owed, problem: null, remainder: 0 }
}

/** Equal percentages that add up to 100 exactly, e.g. 33.34 / 33.33 / 33.33. */
export function equalPercents(count: number): string[] {
  if (count <= 0) return []
  return distributeCents(10000, Array(count).fill(1)).map((c) => (c / 100).toFixed(2))
}

/** Equal amounts that add up to the total exactly. */
export function equalAmounts(amount: string, count: number): string[] {
  const total = toCents(amount)
  if (!Number.isFinite(total) || total <= 0 || count <= 0) return Array(count).fill('')
  return distributeCents(total, Array(count).fill(1)).map((c) => (c / 100).toFixed(2))
}

// --- Live preview of a game (mirrors backend/splits/services.game_results) --------------------

export interface GamePreview {
  /** Won (+) or lost (-) per member id, in cents of the group's currency. */
  results: Record<number, number>
  /** Empty when the game adds up, otherwise what to fix. */
  problem: string | null
}

function optionalNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const n = Number(String(value).trim().replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

/** "50/30/20" or "50 30 20" -> [50, 30, 20]; a comma is a decimal comma. */
export function parsePayouts(text: string): number[] {
  return text
    .split(/[/;\s]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => Number(p.replace(',', '.')))
}

export function previewGame(
  kind: GameKind,
  params: SplitGame['params'],
  input: GameInput['entries'],
  expenseParts: Record<number, number> = {},
): GamePreview {
  const entries = [...input].sort((a, b) => a.member - b.member)
  const results: Record<number, number> = {}
  const fail = (problem: string): GamePreview => ({ results: {}, problem })
  if (entries.length < 2) return fail('W grze muszą brać udział przynajmniej dwie osoby.')
  const stakes = entries.map((e) => toCents(e.stake || '0'))
  if (stakes.some((s) => !Number.isFinite(s) || s < 0)) return fail('Kwota wrzucona do puli nie może być ujemna.')

  const fromPot = (weights: number[], empty: string): GamePreview => {
    const pot = stakes.reduce((a, b) => a + b, 0)
    if (pot <= 0) return fail('Wpisz, ile kto wrzucił do puli.')
    if (weights.reduce((a, b) => a + b, 0) <= 0) return fail(empty)
    const parts = distributeCents(pot, weights)
    entries.forEach((e, i) => (results[e.member] = parts[i] - stakes[i]))
    return { results, problem: null }
  }

  if (kind === 'poker') {
    const chips = entries.map((e) => optionalNumber(e.score))
    if (chips.some((c) => c === null)) return fail('Wpisz, ile żetonów zostało każdemu na koniec (0, jeśli nic).')
    if (chips.some((c) => Number.isNaN(c) || (c as number) < 0)) return fail('Liczba żetonów nie może być ujemna.')
    return fromPot(chips as number[], 'Na koniec ktoś musi mieć żetony.')
  }

  if (kind === 'tournament') {
    const payouts = (params.payouts ?? []).map(Number)
    if (payouts.length === 0 || payouts.some((p) => !(p > 0))) {
      return fail('Podaj, jak dzielicie pulę między miejsca, np. 50 / 30 / 20.')
    }
    const sum = payouts.reduce((a, b) => a + b, 0)
    if (Math.abs(sum - 100) > 0.01) {
      return fail(`Procenty nagród muszą dać razem 100%, a dają ${formatPercent(sum)}%.`)
    }
    if (payouts.length > entries.length) {
      return fail(`Nagród jest więcej (${payouts.length}) niż graczy (${entries.length}).`)
    }
    const taken = new Set<number>()
    const weights: number[] = []
    for (const e of entries) {
      if (e.place !== null && e.place >= 1 && e.place <= payouts.length) {
        if (taken.has(e.place)) return fail(`Miejsce ${e.place} ma dwie osoby. Przy remisie wpiszcie kolejne miejsca.`)
        taken.add(e.place)
        weights.push(payouts[e.place - 1])
      } else {
        weights.push(0)
      }
    }
    const missing = payouts.map((_p, i) => i + 1).filter((p) => !taken.has(p))
    if (missing.length > 0) return fail(`Wpisz, kto zajął miejsce: ${missing.join(', ')}.`)
    return fromPot(weights, 'Ktoś musi wygrać nagrodę.')
  }

  if (kind === 'bet') {
    const options = params.options ?? []
    if (options.length < 2) return fail('Zakład potrzebuje przynajmniej dwóch możliwych wyników.')
    if (entries.some((e) => !options.includes(e.pick))) return fail('Każdy gracz musi wybrać jeden z możliwych wyników.')
    if (stakes.some((s) => s <= 0)) return fail('Każdy gracz musi coś postawić.')
    const result = params.result || ''
    if (!result || !entries.some((e) => e.pick === result)) {
      entries.forEach((e) => (results[e.member] = 0))
      return { results, problem: null }
    }
    return fromPot(
      entries.map((e, i) => (e.pick === result ? stakes[i] : 0)),
      '',
    )
  }

  if (kind === 'points') {
    const value = optionalNumber(params.point_value ?? '')
    if (value === null || Number.isNaN(value) || value <= 0) return fail('Wpisz, ile wart jest jeden punkt.')
    const scores = entries.map((e) => optionalNumber(e.score))
    if (scores.some((s) => s === null || Number.isNaN(s))) return fail('Wpisz wynik każdego gracza.')
    const values = scores as number[]
    const average = values.reduce((a, b) => a + b, 0) / values.length
    const sign = params.lower_wins ? -1 : 1
    const exact = values.map((s) => (s - average) * value * 100 * sign)
    const floors = exact.map((x) => Math.floor(x + 1e-9))
    let leftover = Math.round(exact.reduce((a, b) => a + b, 0)) - floors.reduce((a, b) => a + b, 0)
    const order = exact.map((x, i) => ({ i, rem: x - floors[i] })).sort((a, b) => b.rem - a.rem || a.i - b.i)
    for (const { i } of order) {
      if (leftover <= 0) break
      floors[i] += 1
      leftover -= 1
    }
    entries.forEach((e, i) => (results[e.member] = floors[i]))
    return { results, problem: null }
  }

  // "Kto przegra, ten stawia": the winners' parts of the expense move to the losers.
  const losers = entries.filter((e) => e.lost)
  const winners = entries.filter((e) => !e.lost)
  if (losers.length === 0) return fail('Zaznacz, kto przegrał.')
  if (winners.length === 0) return fail('Ktoś musi wygrać - przegrać nie mogą wszyscy.')
  const moved = winners.map((e) => expenseParts[e.member] ?? 0)
  const total = moved.reduce((a, b) => a + b, 0)
  if (total <= 0) return fail('Nikt z wygranych nie ma części w tym wydatku, więc nie ma czego przenieść.')
  const paid = distributeCents(total, losers.map(() => 1))
  winners.forEach((e, i) => (results[e.member] = moved[i]))
  losers.forEach((e, i) => (results[e.member] = -paid[i]))
  return { results, problem: null }
}

function formatPercent(value: number) {
  return (Math.round(value * 100) / 100).toFixed(2).replace('.', ',')
}

// --- Small helpers shared by the pages -------------------------------------------------------

/** A member's name, with "(Ty)" for the person on this device. */
export function memberName(members: SplitMember[], id: number | null, meId: number | null, t: (s: string) => string) {
  if (id === null) return '—'
  const member = members.find((m) => m.id === id)
  if (!member) return t('ktoś usunięty')
  return id === meId ? `${member.name} (${t('Ty')})` : member.name
}

export function todayIso() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function shareUrl(token: string) {
  return `${window.location.origin}/wspolne/${token}`
}

/** Plain text for a group chat: who sends whom how much, plus the link. */
export function summaryText(state: SplitState, t: (s: string, ...a: string[]) => string) {
  const name = (id: number) => state.members.find((m) => m.id === id)?.name ?? '?'
  const lines = [t('Rozliczenie: {0}', state.group.name), t('Razem: {0}', formatMoney(state.total, state.group.currency)), '']
  if (state.transfers.length === 0) lines.push(t('Wszyscy są rozliczeni.'))
  for (const tr of state.transfers) {
    lines.push(`${name(tr.from_member)} → ${name(tr.to_member)}: ${formatMoney(tr.amount, state.group.currency)}`)
  }
  lines.push('', shareUrl(state.group.share_token))
  return lines.join('\n')
}

/** The first message from a DRF error response, for showing under a form. */
export function apiError(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return fallback
  const record = data as Record<string, unknown>
  if (typeof record.detail === 'string') return record.detail
  for (const value of Object.values(record)) {
    if (typeof value === 'string') return value
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
    if (value && typeof value === 'object') {
      const nested = Object.values(value as Record<string, unknown>)[0]
      if (typeof nested === 'string') return nested
      if (Array.isArray(nested) && typeof nested[0] === 'string') return nested[0]
    }
  }
  return fallback
}
