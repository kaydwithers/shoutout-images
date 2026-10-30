export type StyleId = 'clay' | 'vector' | 'cartoon' | 'amigurumi' | 'plush'

export interface ArtStyle {
  id: StyleId
  label: string
  /** Appended to every image prompt so the look stays consistent within a style. */
  prompt: string
  /** Optional Tailwind classes that colour this style's tag. Default is black and white. */
  tagClass?: string
}

export const STYLES: ArtStyle[] = [
  {
    id: 'clay',
    label: 'Clay figurine',
    tagClass: 'bg-clay text-black',
    prompt:
      'Adorable chunky 3D clay figurine, rounded squishy proportions, oversized head, tiny dot eyes and a small happy smile, handmade plasticine texture, soft even studio lighting. The background is one single flat solid pastel colour, completely plain, no gradient, no floor line, no scenery, no props beyond what the gag needs.',
  },
  {
    id: 'vector',
    label: 'Flat vector',
    prompt:
      'Cute flat vector sticker illustration, soft rounded shapes, thick clean outlines, big friendly eyes and rosy cheeks, limited cheerful palette of five colours, simple and bold. The background is one single flat solid colour, completely plain, no gradient, no pattern, no scenery, no texture.',
  },
  {
    id: 'cartoon',
    label: 'Cute cartoon',
    prompt:
      'Cute modern cartoon character, kawaii-inspired: small rounded body, big head, large sparkly eyes, tiny mouth, blushing cheeks, soft smooth cel shading, clean medium-weight outlines, gentle candy and pastel colours. The background is one single flat solid colour, completely plain, no gradient, no pattern, no scenery, no sparkles or decorations, no speech bubbles, no lettering.',
  },
  {
    id: 'amigurumi',
    label: 'Amigurumi',
    prompt:
      'Adorable hand-crocheted amigurumi plush toy, visible yarn stitches and soft fuzzy texture, chubby rounded body, oversized head, small safety-eye dot eyes and a tiny stitched smile, felt details for props, photographed with soft even lighting like a product shot. The background is one single flat solid pastel colour, completely plain, no gradient, no fabric, no table, no scenery, no lettering.',
  },
  {
    id: 'plush',
    label: 'Plush toy',
    prompt:
      'Soft stuffed plush toy photographed like a product shot: short velvety fur, slightly squashed huggable shape, embroidered eyes and nose, tiny stitched smile, felt accessories for props, gentle even studio lighting with soft shadows. The background is one single flat solid pastel colour, completely plain, no gradient, no fabric, no table, no scenery, no lettering.',
  },
]

export const STYLE_IDS = STYLES.map((s) => s.id) as [StyleId, ...StyleId[]]

/** Records saved before a style was renamed keep working. */
const LEGACY_STYLE_IDS: Record<string, StyleId> = { comic: 'cartoon' }

export function getStyle(id: StyleId | string): ArtStyle {
  const resolved = (LEGACY_STYLE_IDS[id] ?? id) as StyleId
  const style = STYLES.find((s) => s.id === resolved)
  if (!style) throw new Error(`Unknown style: ${id}`)
  return style
}

export function randomStyle(exclude?: StyleId): ArtStyle {
  const pool = exclude && STYLES.length > 1 ? STYLES.filter((s) => s.id !== exclude) : STYLES
  return pool[Math.floor(Math.random() * pool.length)]!
}
