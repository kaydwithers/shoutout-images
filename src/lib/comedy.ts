/**
 * Comedic angles, one picked at random per run so gags don't converge on the same shape.
 * Each is an instruction to the concept model about *how* to make the joke.
 */
export const COMEDY_ANGLES = [
  'Absurd scale: the thing from the shoutout is enormous and the animal is tiny, or the reverse.',
  'Wrong tool: the animal is doing the job with a ridiculous everyday object instead of the proper tool.',
  'Literal metaphor: take a figure of speech or a verb from the shoutout and show it physically happening.',
  'Mid-catastrophe, delighted: everything is going wrong around the animal, who is calm and thrilled.',
  'Sporting glory: the work is staged like an Olympic event, with a tiny podium or medal involved.',
  'Nature documentary: the animal performs the task as if it were a wild animal in its natural habitat.',
  'Heist: the animal is pulling off the task like a cat burglar, in a very wholesome way.',
  'Tiny chef: the work is being cooked, baked or served like food.',
  'Costume: the animal is in an elaborate, slightly too-big costume suited to the task.',
  'Teetering stack: the animal is balancing an impossible tower related to the shoutout.',
  'Treasure hunt: the animal has just dug up, fished out or pulled free the one precious thing, triumphantly.',
  'Royal procession: the animal is being carried or crowned by a crowd of objects from the shoutout.',
  'Wrestling match: the animal is grappling with an oversized object that represents the problem, and winning.',
  'Science lab: beakers, goggles and a tiny eureka moment, using objects from the shoutout.',
  'Space mission: the task is treated as a launch or moon landing, with the shoutout object as the rocket or flag.',
  'Marching band: the animal celebrates the achievement with instruments made of office supplies.',
] as const

/** Random angle, avoiding any that appear verbatim in the given texts. */
export function randomAngle(avoidTexts: string[] = []): string {
  const used = avoidTexts.join('\n')
  const pool = COMEDY_ANGLES.filter((a) => !used.includes(a))
  const from = pool.length ? pool : COMEDY_ANGLES
  return from[Math.floor(Math.random() * from.length)]!
}
