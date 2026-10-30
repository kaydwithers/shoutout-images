import type { ArtStyle } from './styles'
import type { Concept } from './types'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const MOCK_GAGS = [
  'A {animal} doing the worm under a disco ball',
  'A serene {animal} meditating while buried under 400 glowing notification bubbles',
  'A tiny {animal} firefighter putting out a server rack with a watering can',
  'A {animal} wearing a lanyard and leading a standup with a loaf of sourdough',
  'A {animal} superhero holding up a bridge made entirely of sticky notes',
]

export async function mockConcept(opts: { shoutout: string; animal: string; avoid?: string[] }): Promise<Concept> {
  await sleep(600)
  const avoid = new Set(opts.avoid ?? [])
  const pool = MOCK_GAGS.map((g) => g.replace('{animal}', opts.animal)).filter((g) => !avoid.has(g))
  const concept = pool.length ? pool[Math.floor(Math.random() * pool.length)]! : `A ${opts.animal} taking a well-earned bow`
  return {
    concept,
    imagePrompt: `${concept}. Wide shot, centred subject, exaggerated pose, cheerful mood. (Mock concept; no model was called.)`,
  }
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
