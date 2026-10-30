import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { env } from './env'
import { CONCEPT_SYSTEM_PROMPT, conceptUserPrompt } from './prompt'
import type { Concept, Ideas } from './types'

/**
 * Field order matters: the model fills these top to bottom, so it has to list the
 * shoutout's concrete details before writing the five gags, and recommend one last.
 */
const IdeasSchema = z.object({
  details: z.array(z.string()),
  candidates: z.array(
    z.object({
      concept: z.string(),
      imagePrompt: z.string(),
      caption: z.string(),
    }),
  ),
  recommendedIndex: z.number().int(),
})

type IdeasDraft = z.infer<typeof IdeasSchema>

function toIdeas(draft: IdeasDraft): Ideas {
  const candidates: Concept[] = draft.candidates.filter((c) => c.concept && c.imagePrompt).slice(0, 5)
  if (candidates.length === 0) throw new Error('The concept model returned no usable ideas.')
  const recommendedIndex = Math.min(Math.max(draft.recommendedIndex, 0), candidates.length - 1)
  // Logged so the server output shows the details and alternatives when tuning the prompt.
  console.info(
    `[concept] details: ${draft.details.join(', ')}\n` +
      candidates.map((c, i) => `  ${i === recommendedIndex ? '>' : ' '} ${i}. ${c.concept}  ("${c.caption}")`).join('\n'),
  )
  return { candidates, recommendedIndex }
}

export interface ConceptOptions {
  shoutout: string
  /** The cute animal that plays the person. Picked at random by the caller. */
  animal: string
  /** The scene type to build the gags around. Picked at random by the caller. */
  angle: string
  /** Concepts already shown for this shoutout. */
  avoid?: string[]
  /** Something the user insists must appear in the picture. */
  mustInclude?: string
  /** Recent gags people marked as loved, used as examples of the taste to aim for. */
  loved?: Concept[]
  tamer?: boolean
}

let anthropic: Anthropic | undefined
let openai: OpenAI | undefined

function anthropicClient() {
  anthropic ??= new Anthropic({ apiKey: env.anthropicKey })
  return anthropic
}

function openaiClient() {
  openai ??= new OpenAI({ apiKey: env.openaiKey })
  return openai
}

async function ideasViaAnthropic(opts: ConceptOptions): Promise<Ideas> {
  const response = await anthropicClient().messages.parse({
    model: env.conceptModel.anthropic,
    max_tokens: 4000,
    system: CONCEPT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: conceptUserPrompt(opts) }],
    output_config: { effort: 'medium', format: zodOutputFormat(IdeasSchema) },
  })
  if (response.stop_reason === 'refusal') {
    throw new Error('The concept model declined this shoutout.')
  }
  if (!response.parsed_output) {
    throw new Error('The concept model returned an unparseable response.')
  }
  return toIdeas(response.parsed_output)
}

async function ideasViaOpenAI(opts: ConceptOptions): Promise<Ideas> {
  const completion = await openaiClient().chat.completions.parse({
    model: env.conceptModel.openai,
    messages: [
      { role: 'system', content: CONCEPT_SYSTEM_PROMPT },
      { role: 'user', content: conceptUserPrompt(opts) },
    ],
    response_format: zodResponseFormat(IdeasSchema, 'ideas'),
  })
  const parsed = completion.choices[0]?.message.parsed
  if (!parsed) {
    throw new Error('The concept model returned an unparseable response.')
  }
  return toIdeas(parsed)
}

/** Five fully written gags for the shoutout, plus the model's recommendation. */
export async function generateIdeas(opts: ConceptOptions): Promise<Ideas> {
  return env.conceptProvider === 'anthropic' ? ideasViaAnthropic(opts) : ideasViaOpenAI(opts)
}

/** Just the recommended gag, for the automatic retry after a content-policy refusal. */
export async function generateConcept(opts: ConceptOptions): Promise<Concept> {
  const ideas = await generateIdeas(opts)
  return ideas.candidates[ideas.recommendedIndex]!
}
