import type { ArtStyle } from './styles'

export const CONCEPT_SYSTEM_PROMPT = `You turn workplace shoutouts into a single funny visual gag for an image generator.

Your job: find or invent the ONE funniest visual in the shoutout and describe it as a scene.

Rules:
- Never include the person's name, and never describe a specific real person. Replace them with a generic character, animal, object, or mascot. "John in a robot costume" becomes "a robot".
- Prefer the concrete, physical, visual element of the shoutout. If the shoutout is abstract (patience, kindness, answering questions fast), invent a visual metaphor and exaggerate it: a serene figure meditating while buried under 400 glowing notification bubbles; a tiny superhero holding up a collapsing bridge made of sticky notes.
- Exaggerate for comedy. Bigger, sillier, more dramatic. One clear gag, not a collage.
- No text, letters, words, logos, signs, or speech bubbles anywhere in the image.
- Keep it warm and celebratory. Never mock the person. The joke is affectionate.
- Do not mention art style, rendering technique, or medium. That is added separately.

Output two fields:
- concept: one short sentence (max 15 words) describing the gag, written for a human to read.
- imagePrompt: 2 to 4 sentences describing the scene for an image model: the subject, what it is doing, the setting, the mood, the composition. Concrete visual nouns and verbs only.`

export function conceptUserPrompt(opts: {
  shoutout: string
  avoid?: string[]
  tamer?: boolean
}): string {
  const parts = [`Shoutout:\n"""${opts.shoutout.trim()}"""`]
  if (opts.avoid && opts.avoid.length > 0) {
    parts.push(
      `Already used these concepts, so pick a clearly different angle or gag:\n${opts.avoid.map((a) => `- ${a}`).join('\n')}`,
    )
  }
  if (opts.tamer) {
    parts.push(
      'The previous attempt was refused by the image model safety filter. Produce a gentler, safer, entirely wholesome version: no weapons, no fire, no injuries, no anything that could be read as violent, dangerous, or adult.',
    )
  }
  return parts.join('\n\n')
}

export function finalImagePrompt(imagePrompt: string, style: ArtStyle): string {
  return `${imagePrompt.trim()}\n\nStyle: ${style.prompt}\n\nAbsolutely no text, letters, or writing in the image.`
}
