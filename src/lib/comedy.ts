/**
 * Scene types, one picked at random per run. Each is a different way to compose the
 * picture, and every one is anchored in the specific details of the shoutout so the
 * gag is recognisably about what the person did, where, and with what.
 */
export const COMEDY_ANGLES = [
  'The win, on location: show the moment the achievement paid off, in its real setting, built from the actual details in the shoutout (the dinner table, the stage, the codebase as a physical thing). The animal is in the middle of it, delighted.',
  'Disaster averted: show, in miniature off to one side, the embarrassing thing that would have happened, while the animal stands proudly in the version that actually happened. Both halves use details from the shoutout.',
  'The ridiculous tool: the animal got it done with one absurd everyday object as its instrument, and the result is perfect. The tool and the result are both drawn from the shoutout.',
  'The celebration feast: the achievement is being celebrated with food, confetti or a tiny party, and every prop is a detail from the shoutout turned into a decoration or dish.',
  'The heroic journey: the animal is mid-expedition to make it happen, carrying or dragging the key object from the shoutout across or up something comically large, nearly there.',
  'The hero portrait: the animal poses triumphantly wearing or holding the two or three most specific objects from the shoutout like trophies, with one small sign of effort still showing.',
] as const

/** Random scene type, avoiding any that appear verbatim in the given texts. */
export function randomAngle(avoidTexts: string[] = []): string {
  const used = avoidTexts.join('\n')
  const pool = COMEDY_ANGLES.filter((a) => !used.includes(a))
  const from = pool.length ? pool : COMEDY_ANGLES
  return from[Math.floor(Math.random() * from.length)]!
}
