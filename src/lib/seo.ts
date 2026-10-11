// What a search result has room for. Past these it cuts the text mid-word and
// adds "...", which on a results page full of complete sentences reads as the
// one that was not finished.
export const TITLE_LIMIT = 60
export const DESCRIPTION_LIMIT = 155

const BRAND = ' - skieta'

/** The page title as a search result shows it. The brand goes on the end only
 * where it fits: nobody searches for the name yet, the results page prints the
 * site name above the title anyway, and nine characters of it were pushing
 * half the article titles past the cut.
 *
 * netlify/edge-functions/article-meta.ts has a copy of this and of
 * searchDescription - an edge function cannot import from src/ - so a change
 * here belongs there too, or the HTML a crawler reads first and the page the
 * app then renders disagree about the title. */
export function searchTitle(title: string): string {
  const withBrand = `${title}${BRAND}`
  return withBrand.length <= TITLE_LIMIT ? withBrand : title
}

/** A description that ends where a search result would cut it anyway, but on
 * a whole sentence when the whole sentences use most of the room. Cutting
 * back to the first full stop regardless would throw away half the
 * description to save an ellipsis. */
export function searchDescription(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= DESCRIPTION_LIMIT) return clean
  const head = clean.slice(0, DESCRIPTION_LIMIT + 1)
  const sentenceEnd = Math.max(head.lastIndexOf('. '), head.lastIndexOf('? '), head.lastIndexOf('! '))
  if (sentenceEnd >= 100) return head.slice(0, sentenceEnd + 1)
  const wordEnd = head.lastIndexOf(' ', DESCRIPTION_LIMIT - 1)
  return `${head.slice(0, wordEnd).replace(/[\s,;:-]+$/, '')}…`
}
