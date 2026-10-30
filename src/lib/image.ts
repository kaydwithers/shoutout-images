import OpenAI from 'openai'
import { env } from './env'

export class ContentPolicyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentPolicyError'
  }
}

let client: OpenAI | undefined
function openaiClient() {
  client ??= new OpenAI({ apiKey: env.openaiKey })
  return client
}

function isContentPolicyRejection(err: unknown): boolean {
  if (!(err instanceof OpenAI.APIError)) return false
  const code = (err.code ?? '').toLowerCase()
  const message = (err.message ?? '').toLowerCase()
  return (
    code === 'moderation_blocked' ||
    code === 'content_policy_violation' ||
    message.includes('safety system') ||
    message.includes('content policy')
  )
}

/** Renders a PNG for the given prompt. Throws ContentPolicyError when the model refuses. */
export async function renderImage(prompt: string): Promise<Buffer> {
  try {
    const result = await openaiClient().images.generate({
      model: env.imageModel,
      prompt,
      n: 1,
      size: env.imageSize,
      quality: env.imageQuality,
    })
    const b64 = result.data?.[0]?.b64_json
    if (!b64) throw new Error('Image model returned no image data.')
    return Buffer.from(b64, 'base64')
  } catch (err) {
    if (isContentPolicyRejection(err)) {
      throw new ContentPolicyError('The image model refused this prompt.')
    }
    throw err
  }
}
