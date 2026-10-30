export type StyleId = 'clay' | 'vector' | 'comic'

export interface ArtStyle {
  id: StyleId
  label: string
  /** Appended to every image prompt so the look stays consistent within a style. */
  prompt: string
}

export const STYLES: ArtStyle[] = [
  {
    id: 'clay',
    label: 'Clay figurine',
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
    id: 'comic',
    label: 'Retro cartoon',
    prompt:
      'Cute retro cartoon character in the style of a friendly 1960s mascot, soft rounded body, big expressive eyes, bold black ink outlines, saturated candy colours, light halftone shading on the character only. The background is one single flat solid colour, completely plain, no halftone, no action lines, no panel border, no speech bubbles, no lettering.',
  },
]

export const STYLE_IDS = STYLES.map((s) => s.id) as [StyleId, ...StyleId[]]

export function getStyle(id: StyleId): ArtStyle {
  const style = STYLES.find((s) => s.id === id)
  if (!style) throw new Error(`Unknown style: ${id}`)
  return style
}

export function randomStyle(exclude?: StyleId): ArtStyle {
  const pool = exclude && STYLES.length > 1 ? STYLES.filter((s) => s.id !== exclude) : STYLES
  return pool[Math.floor(Math.random() * pool.length)]!
}
