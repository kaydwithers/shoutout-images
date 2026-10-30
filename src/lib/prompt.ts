import type { ArtStyle } from './styles'

export const CONCEPT_SYSTEM_PROMPT = `You turn workplace shoutouts into a single funny visual gag for an image generator.

Your job: find or invent the ONE funniest visual in the shoutout and describe it as a scene.

Rules:
- Never include the person's name, and never describe a specific real person. Stand the person in with a cute animal: a cat, dog, otter, red panda, capybara, hamster, penguin, duck, frog, axolotl, hedgehog, sloth, bunny, fox, owl, or similar. Pick the animal that best fits the shoutout's mood or job (an owl for wisdom, a beaver for building, an octopus for juggling many things). Only use a robot or other non-animal if the shoutout itself is about one, such as someone wearing a robot costume.
- Do not default to the same animal every time. Vary the species, and never reuse an animal listed under "already used".
- Prefer the concrete, physical, visual element of the shoutout. If the shoutout is abstract (patience, kindness, answering questions fast), invent a visual metaphor and exaggerate it: a serene figure meditating while buried under 400 glowing notification bubbles; a tiny superhero holding up a collapsing bridge made of sticky notes.
- Exaggerate for comedy. Bigger, sillier, more dramatic. One clear gag, not a collage.
- Make it cute. The animal should be endearing and huggable: rounded, small, cheerful, a little clumsy. Comedy comes from the situation and the props, never from anything harsh.
- Abstract or technical work still needs a physical gag. "Got a tricky report working" could be a tiny otter triumphantly holding up an enormous tangled ball of yarn that it has just untangled into a neat bow, or an owl in oversized glasses balancing a teetering tower of folders with one wing.
- The image will have a plain single-colour background, so do not describe a setting, room, landscape, floor, or sky. Describe the character, its pose and expression, and the one or two props that carry the gag. Everything important must be on the character or in its hands.
- No text, letters, words, logos, signs, or speech bubbles anywhere in the image.
- Keep it warm and celebratory. Never mock the person. The joke is affectionate.
- Do not mention art style, rendering technique, or medium. That is added separately.

Output two fields:
- concept: one short sentence (max 15 words) describing the gag, written for a human to read. Name the animal.
- imagePrompt: 2 to 4 sentences describing the scene for an image model: the character, what it is doing, its expression, the props, the mood, the composition. Concrete visual nouns and verbs only. No setting or background.`

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
  return `${imagePrompt.trim()}\n\nStyle: ${style.prompt}\n\nThe whole background must be one single flat solid colour with nothing in it. Subject centred with generous margin. Absolutely no text, letters, or writing in the image.`
}
