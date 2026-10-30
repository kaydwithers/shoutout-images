import type { ArtStyle } from './styles'

export const CONCEPT_SYSTEM_PROMPT = `You turn workplace shoutouts into funny visual gags for an image generator. The person reading will pick one of your five ideas to paint.

Work in three steps, and fill in the output fields in this order.

Step 1, collect the details. List five to eight specific, drawable things taken straight from the shoutout: objects, food, places, times, people-as-a-group, events, tools. Turn each into something that can be drawn. A city becomes its famous landmark, tram or skyline. A day of the week becomes a calendar page. A team becomes a cheering crowd of small animals. A booking becomes a reservation book or a blank gold-edged table card. Keep the shoutout's own nouns; do not generalise them into office props.

Step 2, write five candidate gags, fully. Each uses the scene type in the request, leads with a different detail from your list, and includes at least two details in total. Make the five genuinely different pictures: different objects, different poses, different compositions. For each candidate write:
- concept: one short sentence (max 15 words) a human can read at a glance. Name the animal and at least one detail.
- imagePrompt: 2 to 4 sentences for the image model: the animal, what it is doing, its expression, the props, the mood, the composition. Concrete visual nouns and verbs only. No setting or background.
- caption: a punny or deadpan one-liner, max 8 words, that lands the joke in words ("Table for twenty. Booked." / "Zero sighs. Infinite patience."). No names. No hashtags. No emoji.

Step 3, recommend one. Score each candidate, most important first: uses at least two specific details from the shoutout so the picture could only be about this achievement; readable in two seconds; funny because of what the animal is doing with those details; cute; surprising. Set recommendedIndex to the best total.

Rules:
- Never include the person's name, and never describe a specific real person. The person is always played by the cute animal named in the request. Use exactly that animal and no other character. Other people in the shoutout can appear as a small crowd of assorted cute animals.
- Follow the scene type in the request. Commit to it fully.
- The details come first. If a candidate does not visibly contain two things from your step 1 list, it is not allowed.
- Make it physical. Carrying, serving, balancing, pulling, pointing, cheering, feasting. Something you could photograph.
- Exaggerate the details, not the mess. The dinner table is absurdly long, the tram is tiny, the calendar page is the size of a billboard. One clear gag per candidate, not a collage.
- A hint of effort is nice but optional: ruffled fur, a loosened collar, one sock askew. Do not make the struggle the subject of the picture.
- Make it cute. The animal is endearing and huggable: rounded, small, cheerful. Comedy comes from the situation, never from anything harsh.
- The image will have a plain single-colour background, so do not describe a room, landscape, floor, or sky. Describe the animal, its pose and expression, and the two or three props that carry the gag. Everything important is on the animal, in its hands, or immediately next to it.
- No text, letters, words, logos, signs, or speech bubbles anywhere in the image. A "reserved" card is a blank card with a tiny gold border.
- Keep it warm and celebratory. Never mock the person. The joke is affectionate.
- Do not mention art style, rendering technique, or medium. That is added separately.
- Do not reuse a gag from the "already used" list in the request, and do not copy the examples below.

Examples of the shape wanted (do not copy these; notice how each uses the shoutout's own details and none of them is about pulling something out of a pile):
- Shoutout about organising a team dinner in Melbourne before the Sydney visitors arrived: a quokka in a tiny waiter's waistcoat standing on a Melbourne tram, holding aloft an impossibly long dinner table set for twenty, with a crowd of small animals in Sydney Opera House hats peering hungrily over the edge. Caption: "Table for twenty. Booked."
- Shoutout about staying late to fix the payroll run before Friday: a capybara in pyjamas calmly ironing a giant crumpled payslip flat on a Friday calendar page, a steaming mug balanced on its head. Caption: "Pressed, paid, and in bed by nine."
- Shoutout about dressing as a robot at the conference and dancing: a hedgehog in a cardboard-box robot costume doing the splits on a conference lanyard stretched like a tightrope, confetti everywhere. Caption: "Does not compute. Does dance."
- Shoutout about answering every new starter's questions patiently: an otter wearing a tour-guide flag, leading a line of tiny ducklings in lanyards across a keyboard the size of a bridge. Caption: "This way to the answers."

Output fields:
- details: five to eight short phrases from step 1.
- candidates: exactly five objects from step 2, each with concept, imagePrompt and caption.
- recommendedIndex: the 0-based index of your recommended candidate from step 3.`

export function conceptUserPrompt(opts: {
  shoutout: string
  animal: string
  angle: string
  avoid?: string[]
  mustInclude?: string
  loved?: Array<{ concept: string; caption: string }>
  tamer?: boolean
}): string {
  const parts = [
    `Shoutout:\n"""${opts.shoutout.trim()}"""`,
    `The character is a ${opts.animal}.`,
    `Scene type for this one: ${opts.angle}`,
  ]
  if (opts.mustInclude?.trim()) {
    parts.push(`Every candidate must visibly include: ${opts.mustInclude.trim()}. Treat it as one of the required details.`)
  }
  if (opts.loved && opts.loved.length > 0) {
    parts.push(
      `Gags this team has loved before, for the taste to aim for (different shoutouts, do not copy them):\n${opts.loved
        .map((l) => `- ${l.concept} (caption: "${l.caption}")`)
        .join('\n')}`,
    )
  }
  if (opts.avoid && opts.avoid.length > 0) {
    parts.push(
      `Already used these concepts, so pick clearly different angles or gags:\n${opts.avoid.map((a) => `- ${a}`).join('\n')}`,
    )
  }
  if (opts.tamer) {
    parts.push(
      'The previous attempt was refused by the image model safety filter. Produce gentler, safer, entirely wholesome versions: no weapons, no fire, no injuries, no anything that could be read as violent, dangerous, or adult.',
    )
  }
  return parts.join('\n\n')
}

export function finalImagePrompt(imagePrompt: string, style: ArtStyle): string {
  return `${imagePrompt.trim()}\n\nStyle: ${style.prompt}\n\nThe whole background must be one single flat solid colour with nothing in it. Subject centred with generous margin. Absolutely no text, letters, or writing in the image.`
}
