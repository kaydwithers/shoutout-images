import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { animalIn, randomAnimal } from '#/lib/animals'
import { randomAngle } from '#/lib/comedy'
import { generateConcept } from '#/lib/concept'
import { env, mockReason } from '#/lib/env'
import { ContentPolicyError, renderImage } from '#/lib/image'
import { getJob, startJob, type ImageJob } from '#/lib/jobs'
import { mockConcept, mockImage } from '#/lib/mock'
import { finalImagePrompt } from '#/lib/prompt'
import { consumeImageBudget } from '#/lib/ratelimit'
import { getStyle, randomStyle, STYLE_IDS, type StyleId } from '#/lib/styles'
import { getRecord, listRecords, newId, saveRecord } from '#/lib/store'
import type { Concept, ShoutoutRecord } from '#/lib/types'

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

async function conceptFor(opts: {
  shoutout: string
  animal: string
  angle: string
  avoid?: string[]
  tamer?: boolean
}): Promise<Concept> {
  return env.mock ? mockConcept(opts) : generateConcept(opts)
}

export interface ConceptResult extends Concept {
  styleId: StyleId
}

/** Step 1: turn the shoutout into a visual gag and pick the style. */
export const createConcept = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      shoutout: ShoutoutInput,
      style: StyleChoice,
      /** Concepts already shown for this shoutout, so "another take" goes somewhere new. */
      avoid: z.array(z.string()).max(10).default([]),
      /** The style used last time, so a Random re-roll tends to move. */
      previousStyle: z.enum(STYLE_IDS).optional(),
    }),
  )
  .handler(async ({ data }): Promise<ConceptResult> => {
    const style = data.style === 'random' ? randomStyle(data.previousStyle) : getStyle(data.style)
    // The animal is randomised in code and never repeats one already used for this shoutout.
    const animal = randomAnimal(data.avoid)
    const angle = randomAngle()
    const concept = await conceptFor({ shoutout: data.shoutout, animal, angle, avoid: data.avoid })
    return { ...concept, styleId: style.id }
  })

const ImageInput = z.object({
  shoutout: ShoutoutInput,
  concept: z.string().min(1),
  imagePrompt: z.string().min(1),
  styleId: z.enum(STYLE_IDS),
})

/** Renders the image, with one silent retry on a content-policy refusal, and saves it to generated/. */
async function renderAndSave(id: string, data: z.infer<typeof ImageInput>): Promise<ShoutoutRecord> {
  const style = getStyle(data.styleId)
  let concept: Concept = { concept: data.concept, imagePrompt: data.imagePrompt }
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

export const listGallery = createServerFn({ method: 'GET' }).handler(async () => listRecords(24))

export const getGalleryItem = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => getRecord(data.id))
