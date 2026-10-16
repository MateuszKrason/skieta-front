import { api } from '../api/client'
import { formatMoney } from './format'

// Shared expense groups (backend/splits). The server does the arithmetic
// that counts - every write answers with the whole group state - and the
// helpers below only mirror it for the live preview in the expense form.

export const SPLIT_CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP', 'CHF', 'CZK', 'NOK', 'SEK', 'DKK', 'HUF', 'TRY', 'JPY', 'CAD', 'AUD'] as const
export type SplitCurrency = (typeof SPLIT_CURRENCIES)[number]

export type SplitKind = 'trip' | 'project' | 'outing' | 'home' | 'other'
export type SplitMode = 'equal' | 'percent' | 'amount'

export const KIND_LABELS: Record<SplitKind, string> = {
  trip: 'Wyjazd',
  project: 'Przedsięwzięcie',
  outing: 'Wyjście',
  home: 'Wspólne mieszkanie',
  other: 'Inne',
}

export const KIND_ICONS: Record<SplitKind, string> = {
  trip: '🧳',
  project: '🛠️',
  outing: '🍕',
  home: '🏠',
  other: '🧾',
}

export const MAX_MEMBERS = 10

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
  balances: SplitBalance[]
  transfers: SplitTransfer[]
  total: string
  tags: string[]
  limits: { members: number }
  created_member?: number
  created_expense?: number
  exported_count?: number
}

export interface SplitGroupSummary {
  name: string
  kind: SplitKind
  currency: string
  share_token: string
  is_owner: boolean
  members: string[]
  expense_count: number
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
  acting_member: number | null
}

const base = (token: string) => `/splits/s/${encodeURIComponent(token)}/`

export const splitsApi = {
  list: () => api.get<SplitGroupSummary[]>('/splits/groups/').then((r) => r.data),
  create: (body: {
    name: string
    kind: SplitKind
    currency: string
    description: string
    my_name: string
    other_names: string[]
  }) => api.post<SplitState>('/splits/groups/', body).then((r) => r.data),
  get: (token: string) => api.get<SplitState>(base(token)).then((r) => r.data),
  update: (token: string, body: Partial<{ name: string; kind: SplitKind; description: string; currency: string }>) =>
    api.patch<SplitState>(base(token), body).then((r) => r.data),
  remove: (token: string) => api.delete(base(token)),
  rotateLink: (token: string) => api.post<SplitState>(`${base(token)}rotate-link/`).then((r) => r.data),
  rate: (token: string, currency: string, date: string) =>
    api
      .get<{ rate: string; source: string }>(`${base(token)}rate/`, { params: { currency, date } })
      .then((r) => r.data),
  addMember: (token: string, name: string, claim: boolean) =>
    api.post<SplitState>(`${base(token)}members/`, { name, claim }).then((r) => r.data),
  updateMember: (token: string, id: number, body: { name?: string; claim?: boolean }) =>
    api.patch<SplitState>(`${base(token)}members/${id}/`, body).then((r) => r.data),
  removeMember: (token: string, id: number) =>
    api.delete<SplitState>(`${base(token)}members/${id}/`).then((r) => r.data),
  addExpense: (token: string, body: ExpenseInput) =>
    api.post<SplitState>(`${base(token)}expenses/`, body).then((r) => r.data),
  updateExpense: (token: string, id: number, body: ExpenseInput) =>
    api.patch<SplitState>(`${base(token)}expenses/${id}/`, body).then((r) => r.data),
  removeExpense: (token: string, id: number) =>
    api.delete<SplitState>(`${base(token)}expenses/${id}/`).then((r) => r.data),
  addSettlement: (
    token: string,
    body: { from_member: number; to_member: number; amount: string; date?: string; note?: string; acting_member: number | null },
  ) => api.post<SplitState>(`${base(token)}settlements/`, body).then((r) => r.data),
  removeSettlement: (token: string, id: number) =>
    api.delete<SplitState>(`${base(token)}settlements/${id}/`).then((r) => r.data),
  exportPreview: (token: string) => api.get<SplitExportPreview>(`${base(token)}export/`).then((r) => r.data),
  export: (
    token: string,
    body: { items: { expense: number; category: number | null }[]; account: number | null; add_tags: boolean },
  ) => api.post<SplitState>(`${base(token)}export/`, body).then((r) => r.data),
}

// --- Which name on the list is "me" on this device -----------------------------------------

const identityKey = (token: string) => `skieta_split_me_${token}`

export function rememberedMember(token: string): number | null {
  try {
    const raw = localStorage.getItem(identityKey(token))
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

export function rememberMember(token: string, memberId: number | null) {
  try {
    if (memberId === null) localStorage.removeItem(identityKey(token))
    else localStorage.setItem(identityKey(token), String(memberId))
  } catch {
    // Private mode: the choice simply lasts until the tab is closed.
  }
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
