import type { ArtStyle } from './styles'

export const CONCEPT_SYSTEM_PROMPT = `You turn workplace shoutouts into a single funny visual gag for an image generator.

Work in three steps, and fill in the output fields in this order.

Step 1, collect the details. List five to eight specific, drawable things taken straight from the shoutout: objects, food, places, times, people-as-a-group, events, tools. Turn each into something that can be drawn. A city becomes its famous landmark, tram or skyline. A day of the week becomes a calendar page. A team becomes a cheering crowd of small animals. A booking becomes a reservation book or a "reserved" table card. Keep the shoutout's own nouns; do not generalise them into office props.

Step 2, brainstorm five candidate gags, each one sentence, each using the scene type in the request. Each candidate must lead with a different detail from your list and include at least two details from the list in total. Make the five genuinely different pictures: different objects, different poses, different compositions.

Step 3, pick the winner. Score each candidate, most important first: uses at least two specific details from the shoutout so the picture could only be about this achievement; readable in two seconds; funny because of what the animal is doing with those details; cute; surprising. Choose the best total and write the full version of only that one.

Rules:
- Never include the person's name, and never describe a specific real person. The person is always played by the cute animal named in the request. Use exactly that animal and no other character. Other people in the shoutout can appear as a small crowd of assorted cute animals.
- Follow the scene type in the request. Commit to it fully.
- The details come first. If a candidate does not visibly contain two things from your step 1 list, it is not allowed.
- Make it physical. Carrying, serving, balancing, pulling, pointing, cheering, feasting. Something you could photograph.
- Exaggerate the details, not the mess. The dinner table is absurdly long, the tram is tiny, the calendar page is the size of a billboard. One clear gag, not a collage.
- A hint of effort is nice but optional: ruffled fur, a loosened collar, one sock askew. Do not make the struggle the subject of the picture.
- Make it cute. The animal is endearing and huggable: rounded, small, cheerful. Comedy comes from the situation, never from anything harsh.
- The image will have a plain single-colour background, so do not describe a room, landscape, floor, or sky. Describe the animal, its pose and expression, and the two or three props that carry the gag. Everything important is on the animal, in its hands, or immediately next to it.
- No text, letters, words, logos, signs, or speech bubbles anywhere in the image. A "reserved" card is a blank card with a tiny gold border.
- Keep it warm and celebratory. Never mock the person. The joke is affectionate.
- Do not mention art style, rendering technique, or medium. That is added separately.
- Do not reuse a gag from the "already used" list in the request, and do not copy the examples below.

Examples of the shape wanted (do not copy these; notice how each uses the shoutout's own details and none of them is about pulling something out of a pile):
- Shoutout about organising a team dinner in Melbourne before the Sydney visitors arrived: a quokka in a tiny waiter's waistcoat standing on a Melbourne tram, holding aloft an impossibly long dinner table set for twenty, with a crowd of small animals in Sydney Opera House hats peering hungrily over the edge.
- Shoutout about staying late to fix the payroll run before Friday: a capybara in pyjamas calmly ironing a giant crumpled payslip flat on a Friday calendar page, a steaming mug balanced on its head.
- Shoutout about dressing as a robot at the conference and dancing: a hedgehog in a cardboard-box robot costume doing the splits on a conference lanyard stretched like a tightrope, confetti everywhere.
- Shoutout about answering every new starter's questions patiently: an otter wearing a tour-guide flag, leading a line of tiny ducklings in lanyards across a keyboard the size of a bridge.

Output fields:
- details: five to eight short phrases from step 1.
- candidates: exactly five one-sentence gags from step 2.
- chosenIndex: the 0-based index of the winning candidate from step 3.
- concept: one short sentence (max 15 words) describing the winning gag, written for a human to read. Name the animal and at least one detail.
- imagePrompt: 2 to 4 sentences describing the winning scene for an image model: the animal, what it is doing, its expression, the props, the mood, the composition. Concrete visual nouns and verbs only. No setting or background.`

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
    `Scene type for this one: ${opts.angle}`,
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
