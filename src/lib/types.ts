import type { StyleId } from './styles'

export interface Concept {
  /** One-line description of the visual gag, shown to the user. */
  concept: string
  /** Full prompt sent to the image model (scene only, style is appended separately). */
  imagePrompt: string
}

export interface ShoutoutRecord {
  id: string
  createdAt: string
  shoutout: string
  concept: string
  imagePrompt: string
  /** The complete prompt including the style suffix, exactly as sent to the image model. */
  finalPrompt: string
  styleId: StyleId
  /** File name inside generated/, e.g. "abc123.png" or "abc123.svg" in mock mode. */
  imageFile: string
  mock: boolean
  provider: 'anthropic' | 'openai' | 'mock'
  /** True when the first prompt was refused and a tamer concept was used instead. */
  retried: boolean
}

export const SAMPLE_SHOUTOUTS = [
  'Shoutout to John for dressing up as a robot at our recent conference and doing funny dances. It made my day!',
  'Shoutout to Priya for fixing the production outage at 2am while on holiday in Bali.',
  'Shoutout to Sam for bringing homemade sourdough to every single standup this month.',
  'Shoutout to Alex for being so patient with me while I learned the codebase. You never once sighed.',
  'Shoutout to Mei for always answering my Slack questions within thirty seconds, no matter how silly.',
  'Shoutout to Dev for running the whole retro while the projector was on fire (metaphorically, mostly).',
  'Shoutout to Rosa for quietly cleaning up 400 flaky tests nobody else wanted to touch.',
  'Shoutout to Tom for the best onboarding doc I have ever read. I actually understood our auth flow!',
  'Shoutout to Fatima for keeping everyone calm during the big migration. Zero panic, ten out of ten.',
  'Shoutout to Chris for noticing I was overloaded and taking two tickets off my plate without being asked.',
]
