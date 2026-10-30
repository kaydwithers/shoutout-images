import { env } from './env'

// In-memory sliding window. Fine for a single always-on container.
const WINDOW_MS = 60 * 60 * 1000
let stamps: number[] = []

export class RateLimitError extends Error {
  constructor(retryInMinutes: number) {
    super(`Hourly image limit reached (${env.imageHourlyLimit}). Try again in about ${retryInMinutes} minutes.`)
    this.name = 'RateLimitError'
  }
}

/** Throws when the hourly image budget is spent. Call right before rendering a real image. */
export function consumeImageBudget(now = Date.now()): void {
  stamps = stamps.filter((t) => now - t < WINDOW_MS)
  if (stamps.length >= env.imageHourlyLimit) {
    const oldest = stamps[0]!
    throw new RateLimitError(Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 60000)))
  }
  stamps.push(now)
}
