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
  'Circus act: the task is a death-defying trick, with a tiny ringmaster hat and a drum-roll feeling.',
  'Pirate: the animal has plundered the shoutout object as treasure, complete with eyepatch and tiny ship.',
  'Knight: the animal in slightly dented cardboard armour has slain or tamed the oversized problem.',
  'Rock concert: the animal is mid-power-slide, playing the shoutout object like an electric guitar.',
  'Hot air balloon: the animal floats away in a basket, the shoutout object serving as the balloon.',
  'Weather event: the shoutout object is raining, snowing or tornado-ing around a cheerful, well-prepared animal.',
  'Royal portrait: the animal poses with regal seriousness beside the mundane object like it is a priceless heirloom.',
  'Deep sea diver: the animal in a brass diving helmet has surfaced clutching the object from unseen depths.',
] as const

/** A second random layer: an absurd twist stacked on top of the angle. */
export const ABSURD_TWISTS = [
  'the animal is riding a robot vacuum cleaner',
  'there are at least two hundred of the object, and they are tiny',
  'the object is the size of a bus',
  'the animal is wearing roller skates',
  'the animal is wearing a crown that is far too big',
  'the animal has a jetpack made of staplers',
  'the animal is inside a giant teacup',
  'the animal is on a unicycle',
  'the object has googly eyes and looks delighted',
  'the animal is holding a trophy bigger than itself',
  'the animal is wearing a tiny business suit with the sleeves rolled up',
  'everything the animal holds is slightly on fire with cheerful cartoon flames',
  'the animal is surrounded by a cheering crowd of rubber ducks',
  'the animal is standing on a stack of pizza boxes',
  'the animal is wearing swimming goggles and armbands',
  'the animal is being carried by a flock of balloons tied to its waist',
  'the object is made of jelly and wobbling',
  'the animal has a very long scarf that is tangled around everything',
  'the animal is mid-leap, legs splayed, clearly not going to land well',
  'a smaller version of the same animal is sitting on its head, copying the pose',
] as const

/** Random twist, avoiding any that appear verbatim in the given texts. */
export function randomTwist(avoidTexts: string[] = []): string {
  const used = avoidTexts.join('\n')
  const pool = ABSURD_TWISTS.filter((t) => !used.includes(t))
  const from = pool.length ? pool : ABSURD_TWISTS
  return from[Math.floor(Math.random() * from.length)]!
}

/** Random angle, avoiding any that appear verbatim in the given texts. */
export function randomAngle(avoidTexts: string[] = []): string {
  const used = avoidTexts.join('\n')
  const pool = COMEDY_ANGLES.filter((a) => !used.includes(a))
  const from = pool.length ? pool : COMEDY_ANGLES
  return from[Math.floor(Math.random() * from.length)]!
}
