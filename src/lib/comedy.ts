/**
 * Gag recipes, one picked at random per run. Every recipe is a way of dramatising
 * the achievement in the shoutout, so the joke is always about what the person did.
 */
export const COMEDY_ANGLES = [
  'The mess and the prize: the hard thing is a huge physical tangle, pile or knot, and the animal has just pulled the one clean, perfect result out of it and holds it up.',
  'The impossible feat made literal: the animal is physically doing the hard thing as if it were a feat of strength or balance, far beyond its size, and succeeding.',
  'Sheer volume: the animal is surrounded by, or half buried in, a ridiculous quantity of the thing, and is holding up the single one that mattered.',
  'Tiny hero, giant problem: the hard thing is enormous and the animal is tiny, standing on top of it or beside it, clearly the one who beat it.',
  'The absurd shortcut: the animal did the hard thing with a comically wrong everyday tool, and it worked perfectly. Show the tool and the perfect result together.',
  'Before and after in one frame: half the scene is the chaotic version of the thing, the other half is the fixed, gleaming version, and the animal stands between them taking a small bow.',
] as const

/** Random recipe, avoiding any that appear verbatim in the given texts. */
export function randomAngle(avoidTexts: string[] = []): string {
  const used = avoidTexts.join('\n')
  const pool = COMEDY_ANGLES.filter((a) => !used.includes(a))
  const from = pool.length ? pool : COMEDY_ANGLES
  return from[Math.floor(Math.random() * from.length)]!
}
