export type StyleId = 'clay' | 'vector' | 'comic'

export interface ArtStyle {
  id: StyleId
  label: string
  /** Appended to every image prompt so the look stays consistent within a style. */
  prompt: string
  /** Tailwind classes for the style badge on result cards. */
  badge: string
}

export const STYLES: ArtStyle[] = [
  {
    id: 'clay',
    label: 'Clay figurine',
    prompt:
      'Playful 3D clay figurine render, handmade plasticine texture with visible fingerprints, soft studio lighting, bright pastel seamless background, shallow depth of field, charming and slightly goofy.',
    badge: 'bg-wiggle-purple text-white',
  },
  {
    id: 'vector',
    label: 'Flat vector',
    prompt:
      'Bold flat vector illustration, thick clean outlines, limited bright palette of five colours, simple geometric shapes, sticker-like composition on a solid background, playful and energetic.',
    badge: 'bg-wiggle-blue text-white',
  },
  {
    id: 'comic',
    label: 'Retro comic',
    prompt:
      'Retro pop-art comic panel, Ben-Day halftone dots, heavy black ink outlines, saturated primary colours, dynamic action lines, 1960s comic book print texture. No speech bubbles, no lettering.',
    badge: 'bg-wiggle-red text-white',
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
