// Server-only configuration. Reads .env once via Node's built-in loader.
import path from 'node:path'

try {
  process.loadEnvFile(path.resolve(process.cwd(), '.env'))
} catch {
  // No .env file yet. Mock mode will kick in below.
}

const openaiKey = process.env.OPENAI_API_KEY?.trim() || undefined
const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim() || undefined

export type ConceptProvider = 'anthropic' | 'openai'

function resolveConceptProvider(): ConceptProvider {
  const requested = process.env.CONCEPT_PROVIDER?.trim().toLowerCase()
  if (requested === 'openai') return 'openai'
  if (requested === 'anthropic') return 'anthropic'
  // Default: Claude when its key exists, otherwise fall back to OpenAI.
  return anthropicKey ? 'anthropic' : 'openai'
}

const conceptProvider = resolveConceptProvider()
const explicitMock = process.env.MOCK === '1' || process.env.MOCK === 'true'
const conceptKeyPresent = conceptProvider === 'anthropic' ? !!anthropicKey : !!openaiKey
// Mock mode is on when explicitly requested, or when any required key is missing.
const mock = explicitMock || !openaiKey || !conceptKeyPresent

export const env = {
  openaiKey,
  anthropicKey,
  conceptProvider,
  mock,
  explicitMock,
  conceptModel: {
    anthropic: process.env.ANTHROPIC_MODEL?.trim() || 'claude-haiku-5-5',
    openai: process.env.OPENAI_TEXT_MODEL?.trim() || 'gpt-5-mini',
  },
  imageModel: process.env.OPENAI_IMAGE_MODEL?.trim() || 'gpt-image-1',
  imageSize: (process.env.IMAGE_SIZE?.trim() || '1024x1024') as '1024x1024' | '1536x1024' | '1024x1536',
  imageQuality: (process.env.IMAGE_QUALITY?.trim() || 'medium') as 'low' | 'medium' | 'high',
  generatedDir: process.env.GENERATED_DIR?.trim()
    ? path.resolve(process.env.GENERATED_DIR.trim())
    : path.resolve(process.cwd(), 'generated'),
  /** When set, every request must carry HTTP Basic auth with this password. */
  appPassword: process.env.APP_PASSWORD?.trim() || undefined,
  /** Maximum images generated per rolling hour across all users. Protects the API balance. */
  imageHourlyLimit: Number(process.env.IMAGE_HOURLY_LIMIT) > 0 ? Number(process.env.IMAGE_HOURLY_LIMIT) : 30,
} as const

/** Why we're in mock mode, for the status badge. */
export function mockReason(): string | null {
  if (!mock) return null
  if (explicitMock) return 'MOCK=1 is set in .env'
  const missing: string[] = []
  if (!openaiKey) missing.push('OPENAI_API_KEY')
  if (!conceptKeyPresent) missing.push(conceptProvider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY')
  return `Missing ${[...new Set(missing)].join(' and ')} in .env`
}
