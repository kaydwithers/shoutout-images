import type { ShoutoutRecord } from './types'

/**
 * In-memory image jobs. The image step can take a minute or more, and hosting
 * proxies (Render sits behind Cloudflare) cut off requests near 100 seconds,
 * so the browser starts a job and polls instead of holding one long request.
 */
export type ImageJob =
  | { id: string; status: 'pending'; createdAt: number }
  | { id: string; status: 'done'; createdAt: number; record: ShoutoutRecord }
  | { id: string; status: 'error'; createdAt: number; error: string }

const TTL_MS = 60 * 60 * 1000
const jobs = new Map<string, ImageJob>()

function prune(now = Date.now()) {
  for (const [id, job] of jobs) {
    if (now - job.createdAt > TTL_MS) jobs.delete(id)
  }
}

/** Runs `work` in the background and returns the job id immediately. */
export function startJob(id: string, work: () => Promise<ShoutoutRecord>): ImageJob {
  prune()
  const job: ImageJob = { id, status: 'pending', createdAt: Date.now() }
  jobs.set(id, job)
  void work().then(
    (record) => jobs.set(id, { id, status: 'done', createdAt: job.createdAt, record }),
    (err: unknown) =>
      jobs.set(id, {
        id,
        status: 'error',
        createdAt: job.createdAt,
        error: err instanceof Error ? err.message : 'Something went wrong.',
      }),
  )
  return job
}

export function getJob(id: string): ImageJob | undefined {
  return jobs.get(id)
}
