import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { env } from './env'
import { CONCEPT_SYSTEM_PROMPT, conceptUserPrompt } from './prompt'
import type { Concept } from './types'

const ConceptSchema = z.object({
  concept: z.string(),
  imagePrompt: z.string(),
})

export interface ConceptOptions {
  shoutout: string
  /** The cute animal that plays the person. Picked at random by the caller. */
  animal: string
  /** The comedic angle to build the gag around. Picked at random by the caller. */
  angle: string
  /** An absurd twist stacked on top of the angle. Picked at random by the caller. */
  twist: string
  avoid?: string[]
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

async function conceptViaAnthropic(opts: ConceptOptions): Promise<Concept> {
  const response = await anthropicClient().messages.parse({
    model: env.conceptModel.anthropic,
    max_tokens: 2000,
    system: CONCEPT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: conceptUserPrompt(opts) }],
    output_config: { effort: 'low', format: zodOutputFormat(ConceptSchema) },
  })
  if (response.stop_reason === 'refusal') {
    throw new Error('The concept model declined this shoutout.')
  }
  if (!response.parsed_output) {
    throw new Error('The concept model returned an unparseable response.')
  }
  return response.parsed_output
}

async function conceptViaOpenAI(opts: ConceptOptions): Promise<Concept> {
  const completion = await openaiClient().chat.completions.parse({
    model: env.conceptModel.openai,
    messages: [
      { role: 'system', content: CONCEPT_SYSTEM_PROMPT },
      { role: 'user', content: conceptUserPrompt(opts) },
    ],
    response_format: zodResponseFormat(ConceptSchema, 'concept'),
  })
  const parsed = completion.choices[0]?.message.parsed
  if (!parsed) {
    throw new Error('The concept model returned an unparseable response.')
  }
  return parsed
}

export async function generateConcept(opts: ConceptOptions): Promise<Concept> {
  return env.conceptProvider === 'anthropic' ? conceptViaAnthropic(opts) : conceptViaOpenAI(opts)
}
