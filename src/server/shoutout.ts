import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { animalIn, randomAnimal } from '#/lib/animals'
import { randomAngle } from '#/lib/comedy'
import { generateConcept, generateIdeas, type ConceptOptions } from '#/lib/concept'
import { env, mockReason } from '#/lib/env'
import { ContentPolicyError, renderImage } from '#/lib/image'
import { getJob, startJob, type ImageJob } from '#/lib/jobs'
import { mockConcept, mockIdeas, mockImage } from '#/lib/mock'
import { finalImagePrompt } from '#/lib/prompt'
import { consumeImageBudget } from '#/lib/ratelimit'
import { getStyle, randomStyle, STYLE_IDS, type StyleId } from '#/lib/styles'
import { getRecord, listLoved, listRecords, newId, saveRecord, updateRecord } from '#/lib/store'
import type { Concept, Ideas, ShoutoutRecord } from '#/lib/types'

const ShoutoutInput = z.string().trim().min(8, 'Write a little more.').max(600, 'Keep it under 600 characters.')
const StyleChoice = z.enum([...STYLE_IDS, 'random'])

export interface AppStatus {
  mock: boolean
  mockReason: string | null
  conceptProvider: 'anthropic' | 'openai'
  imageModel: string
  imageSize: string
  imageQuality: string
}

export const getStatus = createServerFn({ method: 'GET' }).handler(async (): Promise<AppStatus> => ({
  mock: env.mock,
  mockReason: mockReason(),
  conceptProvider: env.conceptProvider,
  imageModel: env.imageModel,
  imageSize: env.imageSize,
  imageQuality: env.imageQuality,
}))

/** Recent loved results as examples of taste, included in every ideas request. */
async function lovedExamples(): Promise<Concept[]> {
  const loved = await listLoved(3)
  return loved.map((r) => ({ concept: r.concept, imagePrompt: r.imagePrompt, caption: r.caption ?? '' }))
}

async function ideasFor(opts: ConceptOptions): Promise<Ideas> {
  return env.mock ? mockIdeas(opts) : generateIdeas(opts)
}

async function conceptFor(opts: ConceptOptions): Promise<Concept> {
  return env.mock ? mockConcept(opts) : generateConcept(opts)
}

export interface IdeasResult extends Ideas {
  styleId: StyleId
  animal: string
}

/** Step 1: five gags for the shoutout, with a style picked. The user chooses one. */
export const createIdeas = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      shoutout: ShoutoutInput,
      style: StyleChoice,
      /** Concepts already shown for this shoutout, so new ideas go somewhere new. */
      avoid: z.array(z.string()).max(30).default([]),
      /** The style used last time, so a Random re-roll tends to move. */
      previousStyle: z.enum(STYLE_IDS).optional(),
      /** Optional thing the user insists the picture includes. */
      mustInclude: z.string().trim().max(120).optional(),
    }),
  )
  .handler(async ({ data }): Promise<IdeasResult> => {
    const style = data.style === 'random' ? randomStyle(data.previousStyle) : getStyle(data.style)
    // The animal is randomised in code and never repeats one already used for this shoutout.
    const animal = randomAnimal(data.avoid)
    const angle = randomAngle()
    const loved = await lovedExamples()
    const ideas = await ideasFor({ shoutout: data.shoutout, animal, angle, avoid: data.avoid, mustInclude: data.mustInclude, loved })
    return { ...ideas, styleId: style.id, animal }
  })

const ImageInput = z.object({
  shoutout: ShoutoutInput,
  concept: z.string().min(1),
  imagePrompt: z.string().min(1),
  caption: z.string().max(200).default(''),
  styleId: z.enum(STYLE_IDS),
})

/** Renders the image, with one silent retry on a content-policy refusal, and saves it to generated/. */
async function renderAndSave(id: string, data: z.infer<typeof ImageInput>): Promise<ShoutoutRecord> {
  const style = getStyle(data.styleId)
  let concept: Concept = { concept: data.concept, imagePrompt: data.imagePrompt, caption: data.caption }
  let retried = false

  const render = async (c: Concept) => {
    const prompt = finalImagePrompt(c.imagePrompt, style)
    if (!env.mock) consumeImageBudget()
    const image = env.mock ? await mockImage(c.concept, style) : await renderImage(prompt)
    return { prompt, image }
  }

  let rendered: { prompt: string; image: Buffer }
  try {
    rendered = await render(concept)
  } catch (err) {
    if (!(err instanceof ContentPolicyError)) throw err
    retried = true
    concept = await conceptFor({
      shoutout: data.shoutout,
      animal: animalIn(data.concept) ?? randomAnimal(),
      angle: randomAngle(),
      avoid: [data.concept],
      tamer: true,
    })
    try {
      rendered = await render(concept)
    } catch (err2) {
      if (err2 instanceof ContentPolicyError) {
        throw new Error(`The image model refused both attempts. Last concept tried: "${concept.concept}"`)
      }
      throw err2
    }
  }

  const record: ShoutoutRecord = {
    id,
    createdAt: new Date().toISOString(),
    shoutout: data.shoutout,
    concept: concept.concept,
    imagePrompt: concept.imagePrompt,
    caption: concept.caption,
    finalPrompt: rendered.prompt,
    styleId: style.id,
    imageFile: `${id}.${env.mock ? 'svg' : 'png'}`,
    mock: env.mock,
    provider: env.mock ? 'mock' : env.conceptProvider,
    retried,
  }
  await saveRecord(record, rendered.image)
  return record
}

/**
 * Step 2a: start rendering in the background and return a job id straight away.
 * Image generation can run past the ~100 second cutoff of hosting proxies, so the
 * browser polls `getImageJob` instead of waiting on one long request.
 */
export const startImage = createServerFn({ method: 'POST' })
  .validator(ImageInput)
  .handler(async ({ data }): Promise<{ jobId: string }> => {
    const id = newId()
    startJob(id, () => renderAndSave(id, data))
    return { jobId: id }
  })

/** Step 2b: poll until the job is done or failed. */
export const getImageJob = createServerFn({ method: 'GET' })
  .validator(z.object({ jobId: z.string().min(1) }))
  .handler(async ({ data }): Promise<ImageJob> => {
    const job = getJob(data.jobId)
    if (!job) {
      return {
        id: data.jobId,
        status: 'error',
        createdAt: 0,
        error: 'The server lost track of that image, probably because it restarted. Please try again.',
      }
    }
    return job
  })

/** Mark a result as loved (or not). Loved gags become taste examples for future ideas. */
export const setLoved = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1), loved: z.boolean() }))
  .handler(async ({ data }): Promise<ShoutoutRecord | null> => updateRecord(data.id, { loved: data.loved }))

export const listGallery = createServerFn({ method: 'GET' }).handler(async () => listRecords(24))

export const getGalleryItem = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => getRecord(data.id))
