import { describe, expect, it } from 'vitest'
import { DESCRIPTION_LIMIT, TITLE_LIMIT, searchDescription, searchTitle } from './seo'

describe('searchTitle', () => {
  it('adds the brand where it fits', () => {
    expect(searchTitle('Jak kupić obligacje skarbowe krok po kroku')).toBe(
      'Jak kupić obligacje skarbowe krok po kroku - skieta',
    )
  })

  it('leaves the brand off rather than have the title cut', () => {
    const title = 'Lokata, obligacje czy giełda - co wychodzi lepiej w 5 lat'
    expect(`${title} - skieta`.length).toBeGreaterThan(TITLE_LIMIT)
    expect(searchTitle(title)).toBe(title)
  })

  it('keeps a title that fills the limit exactly, brand included', () => {
    const title = 'x'.repeat(TITLE_LIMIT - ' - skieta'.length)
    expect(searchTitle(title)).toHaveLength(TITLE_LIMIT)
  })
})

describe('searchDescription', () => {
  it('returns a description that already fits untouched', () => {
    const text = 'Lokata płaci więcej, ale blokuje pieniądze. Kiedy ta różnica ma znaczenie.'
    expect(searchDescription(text)).toBe(text)
  })

  it('ends on the last whole sentence when that uses most of the room', () => {
    const first = 'Najpopularniejsza reguła budżetowa rozbija się o pierwszy kontakt z czynszem, a potem o rachunki.'
    const second = 'Co zrobić, gdy potrzeby zjadają 70 procent.'
    const third = 'I od czego naprawdę zacząć, kiedy nic się nie spina.'
    const result = searchDescription(`${first} ${second} ${third}`)
    expect(result).toBe(`${first} ${second}`)
    expect(result.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT)
  })

  it('cuts at a word with an ellipsis when the first sentence alone is short', () => {
    const text =
      '19 procent brzmi niewinnie. Wyjaśniamy, od czego naprawdę pobierany jest podatek Belki, kiedy bank policzy go za Ciebie, a kiedy musisz zrobić to sam, i co z tego wynika dla Twojego zysku.'
    const result = searchDescription(text)
    expect(result.endsWith('…')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT)
    // never mid-word: what precedes the ellipsis is a whole word of the original
    expect(text.startsWith(result.slice(0, -1))).toBe(true)
    expect(text[result.length - 1]).toMatch(/[\s,]/)
  })

  it('collapses line breaks, which a meta tag would carry as-is', () => {
    expect(searchDescription('Pierwsza linia.\n\nDruga linia.')).toBe('Pierwsza linia. Druga linia.')
  })
})
