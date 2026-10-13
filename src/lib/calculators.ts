// The public calculators, in the order they are offered to someone who has
// just used one of them. Labels are Polish source strings for t().
export const CALCULATORS = [
  { path: '/kalkulator/procent-skladany', label: 'Kalkulator procentu składanego' },
  { path: '/kalkulator/podatek-belki', label: 'Kalkulator podatku Belki' },
  { path: '/kalkulator/cel-oszczednosciowy', label: 'Ile odkładać na cel' },
  { path: '/kalkulator/lokata', label: 'Kalkulator lokaty' },
  { path: '/kalkulator/inflacja', label: 'Kalkulator inflacji' },
  { path: '/kalkulator/ikze', label: 'Kalkulator IKZE' },
  { path: '/kalkulator', label: 'Lokata, obligacje czy giełda' },
  { path: '/pit-38', label: 'Pomocnik PIT-38' },
] as const

/** A text field's content as a number; anything unreadable counts as zero. */
export function num(value: string): number {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

// The tool that answers the question an article raises, by article slug. A
// reader who has just read about compound interest wants the compound
// interest calculator, not the general one - and a link from the text to the
// tool is also what tells a search engine the two belong together.
const TOOL_BY_ARTICLE: Record<string, { path: string; label: string }> = {
  'procent-skladany-na-przykladach-w-zlotych': { path: '/kalkulator/procent-skladany', label: 'Kalkulator procentu składanego' },
  'jak-zaczac-inwestowac-od-300-zl-miesiecznie': { path: '/kalkulator/procent-skladany', label: 'Kalkulator procentu składanego' },
  'podatek-belki-ile-realnie-zostaje-z-twojego-zysku': { path: '/kalkulator/podatek-belki', label: 'Kalkulator podatku Belki' },
  'lokata-terminowa-czy-konto-oszczednosciowe': { path: '/kalkulator/lokata', label: 'Kalkulator lokaty' },
  'promocje-kont-oszczednosciowych-jak-je-czytac': { path: '/kalkulator/lokata', label: 'Kalkulator lokaty' },
  'inflacja-ile-naprawde-traci-gotowka': { path: '/kalkulator/inflacja', label: 'Kalkulator inflacji' },
  'ikze-ile-realnie-wraca-z-podatku': { path: '/kalkulator/ikze', label: 'Kalkulator IKZE' },
  'ike-i-ikze-jak-inwestowac-z-ulga-podatkowa-na-emeryture': { path: '/kalkulator/ikze', label: 'Kalkulator IKZE' },
  'ile-odkladac-z-pensji-jak-policzyc-swoja-kwote': { path: '/kalkulator/cel-oszczednosciowy', label: 'Ile odkładać na cel' },
  'jak-zbudowac-poduszke-bezpieczenstwa-finansowego': { path: '/kalkulator/cel-oszczednosciowy', label: 'Ile odkładać na cel' },
  'wklad-wlasny-plan-odkladania-z-liczbami': { path: '/kalkulator/cel-oszczednosciowy', label: 'Ile odkładać na cel' },
  'pit-38-krok-po-kroku': { path: '/pit-38', label: 'Pomocnik PIT-38' },
  'strata-na-gieldzie-jak-ja-rozliczyc': { path: '/pit-38', label: 'Pomocnik PIT-38' },
  'dywidendy-z-usa-w-8ben-i-doplata-podatku': { path: '/pit-38', label: 'Pomocnik PIT-38' },
}

const GENERAL_TOOL = { path: '/kalkulator', label: 'Otwórz kalkulator' }

export function toolForArticle(slug: string | undefined): { path: string; label: string } {
  return (slug && TOOL_BY_ARTICLE[slug]) || GENERAL_TOOL
}
