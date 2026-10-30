/** The cute animal that stands in for the person. Chosen in code, not by the model. */
export const ANIMALS = [
  'cat',
  'dog',
  'otter',
  'red panda',
  'capybara',
  'hamster',
  'penguin',
  'duck',
  'frog',
  'axolotl',
  'hedgehog',
  'sloth',
  'bunny',
  'fox',
  'owl',
  'koala',
  'quokka',
  'seal',
  'corgi',
  'highland cow',
  'alpaca',
  'raccoon',
  'bear cub',
  'chick',
] as const

export type Animal = (typeof ANIMALS)[number]

/** Random animal, avoiding any that appear in the given texts (previous concepts). */
export function randomAnimal(avoidTexts: string[] = []): Animal {
  const used = avoidTexts.join(' ').toLowerCase()
  const pool = ANIMALS.filter((a) => !used.includes(a))
  const from = pool.length ? pool : ANIMALS
  return from[Math.floor(Math.random() * from.length)]!
}

/** The animal already named in a concept, so a retry keeps the same character. */
export function animalIn(text: string): Animal | undefined {
  const lower = text.toLowerCase()
  return ANIMALS.find((a) => lower.includes(a))
}

