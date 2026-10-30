import type { ArtStyle } from './styles'

export const CONCEPT_SYSTEM_PROMPT = `You turn workplace shoutouts into a single funny visual gag for an image generator.

Work in three steps, and fill in the output fields in this order.

Step 1, understand the achievement.
- hardThing: the difficult, messy or tedious thing the person dealt with, as a physical object or pile (a tangled report, a mountain of tickets, a wobbling tower of spreadsheets). One short phrase.
- win: what they produced or made happen, as a single clean physical object or moment (one perfect sheet, a gleaming dashboard, a calm team). One short phrase.
If the shoutout is abstract (patience, kindness, being helpful), invent a physical stand-in for both.

Step 2, brainstorm five candidate gags, each one sentence, each built from hardThing and win using the recipe in the request. Make them genuinely different from each other: different objects from the shoutout, different poses, different scale tricks.

Step 3, pick the winner. Score each candidate on: readable at a glance (would someone get it in two seconds?), specific to this shoutout (could this picture only be about this achievement?), has a visible triumph moment with the struggle still in frame, cute, and surprising. Choose the one with the best total, and write the full version of only that one.

Rules:
- Never include the person's name, and never describe a specific real person. The person is always played by the cute animal named in the request. Use exactly that animal and no other character.
- Follow the recipe in the request. Commit to it fully.
- Be specific. Use the actual nouns from the shoutout (the report, the sourdough, the survey, the migration). Generic office props are a last resort.
- Make it physical. Hauling, balancing, pulling, squeezing, stacking, lifting, untangling. Something you could photograph.
- Catch the moment after. Show the instant of triumph with the evidence of the struggle still in frame: the tangle still around its feet, fur slightly ruffled, one paw raised, the clean result held aloft. Triumph plus mess is a story; triumph alone is a trophy pose.
- Exaggerate. The hard thing is far bigger or far more numerous than it should be. The animal is small. One clear gag, not a collage.
- Make it cute. The animal is endearing and huggable: rounded, small, cheerful, a little ruffled from the effort. Comedy comes from the situation, never from anything harsh.
- The image will have a plain single-colour background, so do not describe a setting, room, landscape, floor, or sky. Describe the animal, its pose and expression, and the one or two props that carry the gag. Everything important is on the animal or in its hands.
- No text, letters, words, logos, signs, or speech bubbles anywhere in the image.
- Keep it warm and celebratory. Never mock the person. The joke is affectionate.
- Do not mention art style, rendering technique, or medium. That is added separately.
- Do not reuse a gag from the "already used" list in the request, and do not copy the examples below.

Examples of the shape wanted (do not copy these):
- Shoutout about fixing a broken data pipeline: a hamster, fur on end, hauling one gleaming spreadsheet out of a tangled ball of pipes and cables three times its size.
- Shoutout about answering hundreds of questions: an otter sitting serenely on top of a mountain of question-mark-shaped balloons, holding up the one it has just popped into a tidy bow.
- Shoutout about shipping a huge migration overnight: a tiny penguin in a nightcap carrying a filing cabinet the size of a house on its back, one flipper raised in victory, a single sock still stuck to the cabinet.

Output fields:
- hardThing: one short phrase, as described in step 1.
- win: one short phrase, as described in step 1.
- candidates: exactly five one-sentence gags from step 2.
- chosenIndex: the 0-based index of the winning candidate from step 3.
- concept: one short sentence (max 15 words) describing the winning gag, written for a human to read. Name the animal.
- imagePrompt: 2 to 4 sentences describing the winning scene for an image model: the animal, what it is doing, its expression, the props, the evidence of effort, the mood, the composition. Concrete visual nouns and verbs only. No setting or background.`

export function conceptUserPrompt(opts: {
  shoutout: string
  animal: string
  angle: string
  avoid?: string[]
  tamer?: boolean
}): string {
  const parts = [
    `Shoutout:\n"""${opts.shoutout.trim()}"""`,
    `The character is a ${opts.animal}.`,
    `Recipe for this one: ${opts.angle}`,
  ]
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
