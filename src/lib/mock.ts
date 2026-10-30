import type { ArtStyle } from './styles'
import type { Concept, Ideas } from './types'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const MOCK_GAGS: Array<{ concept: string; caption: string }> = [
  { concept: 'A {animal} doing the worm under a disco ball', caption: 'Floor: cleared.' },
  { concept: 'A serene {animal} meditating while buried under 400 glowing notification bubbles', caption: 'Inbox zero, inner peace one.' },
  { concept: 'A tiny {animal} firefighter putting out a server rack with a watering can', caption: 'Hot fix. Literally.' },
  { concept: 'A {animal} wearing a lanyard and leading a standup with a loaf of sourdough', caption: 'Rise and shine.' },
  { concept: 'A {animal} superhero holding up a bridge made entirely of sticky notes', caption: 'Noted. Held. Saved.' },
  { concept: 'A {animal} in a waiter waistcoat balancing an absurdly long dinner table on one paw', caption: 'Table for twenty. Booked.' },
  { concept: 'A {animal} in pyjamas ironing a giant crumpled spreadsheet flat', caption: 'Pressed and paid.' },
]

function fillIn(animal: string, gag: { concept: string; caption: string }): Concept {
  const concept = gag.concept.replace('{animal}', animal)
  return {
    concept,
    caption: gag.caption,
    imagePrompt: `${concept}. Wide shot, centred subject, exaggerated pose, cheerful mood. (Mock concept; no model was called.)`,
  }
}

/** Five canned ideas with the right animal, skipping any already shown. */
export async function mockIdeas(opts: { shoutout: string; animal: string; angle?: string; avoid?: string[] }): Promise<Ideas> {
  await sleep(600)
  const avoid = new Set(opts.avoid ?? [])
  const pool = MOCK_GAGS.map((g) => fillIn(opts.animal, g)).filter((c) => !avoid.has(c.concept))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const candidates = shuffled.slice(0, 5)
  if (candidates.length === 0) {
    candidates.push(fillIn(opts.animal, { concept: 'A {animal} taking a well-earned bow', caption: 'Encore.' }))
  }
  return { candidates, recommendedIndex: 0 }
}

export async function mockConcept(opts: { shoutout: string; animal: string; angle?: string; avoid?: string[] }): Promise<Concept> {
  const ideas = await mockIdeas(opts)
  return ideas.candidates[ideas.recommendedIndex]!
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      lines.push(line.trim())
      line = w
    } else {
      line = `${line} ${w}`
    }
  }
  if (line.trim()) lines.push(line.trim())
  return lines.slice(0, 6)
}

const PALETTE: Record<ArtStyle['id'], { bg: string; fg: string; accent: string }> = {
  clay: { bg: '#fde2e4', fg: '#7a2e3a', accent: '#f4a6b0' },
  vector: { bg: '#dbeafe', fg: '#1e3a8a', accent: '#60a5fa' },
  cartoon: { bg: '#fce7f3', fg: '#831843', accent: '#ec4899' },
  amigurumi: { bg: '#dcfce7', fg: '#14532d', accent: '#22c55e' },
  plush: { bg: '#ede9fe', fg: '#4c1d95', accent: '#a78bfa' },
  felted: { bg: '#fef9c3', fg: '#713f12', accent: '#eab308' },
  vinyl: { bg: '#cffafe', fg: '#164e63', accent: '#06b6d4' },
  feltcut: { bg: '#ffedd5', fg: '#7c2d12', accent: '#f97316' },
}

/** A placeholder SVG so the whole UI can be exercised without an image API key. */
export async function mockImage(concept: string, style: ArtStyle): Promise<Buffer> {
  await sleep(1800)
  const p = PALETTE[style.id]
  const lines = wrap(concept, 34)
  const text = lines
    .map((l, i) => `<text x="512" y="${430 + i * 56}" text-anchor="middle" font-size="40" fill="${p.fg}" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="600">${escapeXml(l)}</text>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${p.bg}"/>
  <circle cx="512" cy="260" r="120" fill="${p.accent}"/>
  <circle cx="470" cy="240" r="16" fill="${p.fg}"/>
  <circle cx="554" cy="240" r="16" fill="${p.fg}"/>
  <path d="M452 300 Q512 350 572 300" stroke="${p.fg}" stroke-width="12" fill="none" stroke-linecap="round"/>
  ${text}
  <text x="512" y="900" text-anchor="middle" font-size="28" fill="${p.fg}" opacity="0.7" font-family="ui-sans-serif, system-ui, sans-serif">MOCK IMAGE · ${escapeXml(style.label)} style</text>
</svg>`
  return Buffer.from(svg, 'utf8')
}
