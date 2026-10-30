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
    throw friendlyApiError(err)
  }
}

/** Turns the most common OpenAI setup failures into messages that say what to do. */
function friendlyApiError(err: unknown): unknown {
  if (!(err instanceof OpenAI.APIError)) return err
  const message = err.message ?? ''
  if (/must be verified/i.test(message)) {
    return new Error(
      `OpenAI says your organisation must be verified to use ${env.imageModel}. Go to platform.openai.com, then Settings, Organization, General, and click Verify Organization. Access can take up to 15 minutes to arrive after verifying.`,
    )
  }
  if (/does not exist|do not have access/i.test(message)) {
    return new Error(
      `OpenAI does not offer the model "${env.imageModel}" to this account. Check OPENAI_IMAGE_MODEL against the current list at developers.openai.com (gpt-image-2.5-flare is the current default), and make sure the organisation is verified.`,
    )
  }
  return err
}
