import { describe, expect, it } from 'vitest'
import { apiError, distributeCents, equalAmounts, equalPercents, memberName, previewShares, summaryText, type SplitState } from './splits'

const t = (s: string, ...args: string[]) => args.reduce((acc, a, i) => acc.replace(`{${i}}`, a), s)

describe('distributeCents', () => {
  it('splits evenly and hands leftover cents to the earliest entries', () => {
    expect(distributeCents(10000, [1, 1, 1])).toEqual([3334, 3333, 3333])
    expect(distributeCents(101, [1, 1])).toEqual([51, 50])
  })

  it('follows the weights and always adds up to the total', () => {
    const parts = distributeCents(9999, [50, 30, 20])
    expect(parts.reduce((a, b) => a + b, 0)).toBe(9999)
    expect(parts).toEqual([4999, 3000, 2000])
  })

  it('returns zeros for nothing to split', () => {
    expect(distributeCents(0, [1, 1])).toEqual([0, 0])
    expect(distributeCents(500, [0, 0])).toEqual([0, 0])
  })
})

describe('previewShares', () => {
  const members = [1, 2, 3]
  const everyone = { 1: true, 2: true, 3: true }

  it('asks for an amount first', () => {
    expect(previewShares('', 'equal', members, {}, everyone).problem).toBe('Wpisz kwotę.')
  })

  it('splits equally among the ticked people only', () => {
    const result = previewShares('100', 'equal', members, {}, { 1: true, 2: false, 3: true })
    expect(result.problem).toBeNull()
    expect(result.owed).toEqual({ 1: 5000, 3: 5000 })
  })

  it('needs at least one person in an equal split', () => {
    expect(previewShares('100', 'equal', members, {}, {}).problem).toBe('Zaznacz przynajmniej jedną osobę.')
  })

  it('accepts a comma as the decimal separator', () => {
    expect(previewShares('10,50', 'equal', [1, 2], {}, { 1: true, 2: true }).owed).toEqual({ 1: 525, 2: 525 })
  })

  it('checks that percentages add up to 100 and says what is left', () => {
    const short = previewShares('200', 'percent', members, { 1: '50', 2: '30' }, everyone)
    expect(short.problem).toBe('Procenty muszą dać razem 100%.')
    expect(short.remainder).toBe(20)
    const ok = previewShares('200', 'percent', members, { 1: '50', 2: '30', 3: '20' }, everyone)
    expect(ok.problem).toBeNull()
    expect(ok.owed).toEqual({ 1: 10000, 2: 6000, 3: 4000 })
  })

  it('checks that amounts add up to the total, in both directions', () => {
    const under = previewShares('100', 'amount', members, { 1: '60', 2: '30' }, everyone)
    expect(under.problem).toBe('Kwoty osób muszą dać razem całą kwotę.')
    expect(under.remainder).toBe(10)
    const over = previewShares('100', 'amount', members, { 1: '60', 2: '50' }, everyone)
    expect(over.remainder).toBe(-10)
    const ok = previewShares('100', 'amount', members, { 1: '60', 2: '30', 3: '10' }, everyone)
    expect(ok.problem).toBeNull()
    expect(ok.owed).toEqual({ 1: 6000, 2: 3000, 3: 1000 })
  })

  it('rejects negative values', () => {
    expect(previewShares('100', 'percent', members, { 1: '-10', 2: '110' }, everyone).problem).toBe(
      'Procent nie może być ujemny.',
    )
    expect(previewShares('100', 'amount', members, { 1: '-10', 2: '110' }, everyone).problem).toBe(
      'Kwota nie może być ujemna.',
    )
  })
})

describe('equal helpers', () => {
  it('gives percentages that sum to exactly 100', () => {
    expect(equalPercents(3)).toEqual(['33.34', '33.33', '33.33'])
    expect(equalPercents(0)).toEqual([])
  })

  it('gives amounts that sum to the total', () => {
    expect(equalAmounts('100', 3)).toEqual(['33.34', '33.33', '33.33'])
    expect(equalAmounts('', 2)).toEqual(['', ''])
  })
})

describe('memberName', () => {
  const members = [
    { id: 1, name: 'Ania', linked: true, is_me: false, is_owner: true, can_delete: false },
    { id: 2, name: 'Bartek', linked: false, is_me: false, is_owner: false, can_delete: true },
  ]

  it('marks the person on this device and survives a removed member', () => {
    expect(memberName(members, 1, 1, t)).toBe('Ania (Ty)')
    expect(memberName(members, 2, 1, t)).toBe('Bartek')
    expect(memberName(members, 9, 1, t)).toBe('ktoś usunięty')
    expect(memberName(members, null, 1, t)).toBe('—')
  })
})

describe('summaryText', () => {
  it('lists the transfers and ends with the link', () => {
    const state = {
      group: { name: 'Zakopane', currency: 'PLN', share_token: 'abc' },
      members: [
        { id: 1, name: 'Ania' },
        { id: 2, name: 'Bartek' },
      ],
      transfers: [{ from_member: 2, to_member: 1, amount: '120.00' }],
      total: '240.00',
    } as unknown as SplitState
    const text = summaryText(state, t)
    expect(text.split('\n')[0]).toBe('Rozliczenie: Zakopane')
    expect(text).toContain('Bartek → Ania: ')
    expect(text.trim().endsWith('/wspolne/abc')).toBe(true)
  })
})

describe('apiError', () => {
  it('reads detail, field and nested messages', () => {
    expect(apiError({ response: { data: { detail: 'Nie ma.' } } }, 'x')).toBe('Nie ma.')
    expect(apiError({ response: { data: { name: ['Za długie.'] } } }, 'x')).toBe('Za długie.')
    expect(apiError({ response: { data: { shares: { 0: ['Zła wartość.'] } } } }, 'x')).toBe('Zła wartość.')
    expect(apiError(new Error('network'), 'Nie udało się.')).toBe('Nie udało się.')
  })
})
