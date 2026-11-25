import { describe, expect, it } from 'vitest'
import {
  apiError,
  distributeCents,
  equalAmounts,
  equalPercents,
  memberName,
  parsePayouts,
  previewGame,
  previewShares,
  summaryText,
  type GameInput,
  type SplitState,
} from './splits'

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

const player = (member: number, fields: Partial<GameInput['entries'][number]> = {}) => ({
  member,
  stake: '0',
  score: null,
  place: null,
  pick: '',
  lost: false,
  ...fields,
})

// The same cases as backend/splits/tests.py GameResultsTests: the preview
// has to show exactly what the server will save.
describe('previewGame', () => {
  it('pays the poker pot out by chips', () => {
    const preview = previewGame('poker', {}, [
      player(1, { stake: '50', score: '0' }),
      player(2, { stake: '50', score: '150' }),
      player(3, { stake: '100', score: '50' }),
    ])
    expect(preview).toEqual({ results: { 1: -5000, 2: 10000, 3: -5000 }, problem: null })
  })

  it('keeps a miscounted poker stack zero-sum', () => {
    const preview = previewGame('poker', {}, [player(1, { stake: '50', score: '60' }), player(2, { stake: '50', score: '30' })])
    expect(preview.results).toEqual({ 1: 1667, 2: -1667 })
  })

  it('asks for missing chips', () => {
    const preview = previewGame('poker', {}, [player(1, { stake: '50', score: '60' }), player(2, { stake: '50' })])
    expect(preview.problem).toContain('żetonów')
  })

  it('pays the tournament places', () => {
    const preview = previewGame('tournament', { payouts: ['50', '30', '20'] }, [
      player(1, { stake: '20', place: 1 }),
      player(2, { stake: '20', place: 2 }),
      player(3, { stake: '20', place: 3 }),
      player(4, { stake: '20' }),
    ])
    expect(preview.results).toEqual({ 1: 2000, 2: 400, 3: -400, 4: -2000 })
    const twice = previewGame('tournament', { payouts: ['70', '30'] }, [
      player(1, { stake: '10', place: 1 }),
      player(2, { stake: '10', place: 1 }),
    ])
    expect(twice.problem).toContain('Miejsce 1 ma dwie osoby')
  })

  it('shares the bet pot among the winners by stake, and leaves an open bet at zero', () => {
    const entries = [
      player(1, { stake: '10', pick: 'Polska' }),
      player(2, { stake: '20', pick: 'Polska' }),
      player(3, { stake: '30', pick: 'Remis' }),
    ]
    expect(previewGame('bet', { options: ['Polska', 'Remis'], result: 'Polska' }, entries).results).toEqual({
      1: 1000,
      2: 2000,
      3: -3000,
    })
    expect(previewGame('bet', { options: ['Polska', 'Remis'], result: '' }, entries).results).toEqual({ 1: 0, 2: 0, 3: 0 })
  })

  it('counts points from the average and rounds to grosze that add up', () => {
    const rows = [player(1, { score: '120' }), player(2, { score: '80' }), player(3, { score: '100' })]
    expect(previewGame('points', { point_value: '0,10' }, rows).results).toEqual({ 1: 200, 2: -200, 3: 0 })
    expect(previewGame('points', { point_value: '0.10', lower_wins: true }, rows).results).toEqual({ 1: -200, 2: 200, 3: 0 })
    const third = previewGame('points', { point_value: '0.01' }, [
      player(1, { score: '1' }),
      player(2, { score: '0' }),
      player(3, { score: '0' }),
    ])
    expect(third.results).toEqual({ 1: 1, 2: 0, 3: -1 })
  })

  it('moves the winners parts of the expense to the loser', () => {
    const preview = previewGame('loser', {}, [player(1), player(2, { lost: true })], { 1: 5000, 2: 5000, 3: 5000 })
    expect(preview.results).toEqual({ 1: 5000, 2: -5000 })
    expect(previewGame('loser', {}, [player(1), player(2)], { 1: 5000 }).problem).toContain('przegrał')
  })
})

describe('parsePayouts', () => {
  it('reads slashes, spaces and decimal commas', () => {
    expect(parsePayouts('50/30/20')).toEqual([50, 30, 20])
    expect(parsePayouts('62,5 37,5')).toEqual([62.5, 37.5])
  })
})
