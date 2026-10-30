import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GalleryStrip, galleryQueryOptions } from '#/components/GalleryStrip'
import { MockBadge, statusQueryOptions } from '#/components/MockBadge'
import { ResultCard } from '#/components/ResultCard'
import { StyleBadge } from '#/components/StyleBadge'
import { ThemeToggle } from '#/components/ThemeToggle'
import { STYLES, type StyleId } from '#/lib/styles'
import { SAMPLE_SHOUTOUTS, type ShoutoutRecord } from '#/lib/types'
import { createConcept, getImageJob, startImage, type ConceptResult } from '#/server/shoutout'

const POLL_MS = 2000

/** Starts the image job and polls until it finishes. Rejects with the job's error message. */
async function generateImage(
  data: Parameters<typeof startImage>[0]['data'],
  isCurrent: () => boolean,
): Promise<ShoutoutRecord> {
  const { jobId } = await startImage({ data })
  for (;;) {
    await new Promise((r) => setTimeout(r, POLL_MS))
    if (!isCurrent()) throw new Error('cancelled')
    const job = await getImageJob({ data: { jobId } })
    if (job.status === 'done') return job.record
    if (job.status === 'error') throw new Error(job.error)
  }
}

export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(statusQueryOptions()),
      context.queryClient.ensureQueryData(galleryQueryOptions()),
    ])
  },
  component: Home,
})

type StyleChoice = StyleId | 'random'
type Phase = 'idle' | 'concept' | 'image' | 'done' | 'error'

function Home() {
  const queryClient = useQueryClient()
  const [shoutout, setShoutout] = useState('')
  const [styleChoice, setStyleChoice] = useState<StyleChoice>('random')
  const [phase, setPhase] = useState<Phase>('idle')
  const [concept, setConcept] = useState<ConceptResult | null>(null)
  const [usedConcepts, setUsedConcepts] = useState<string[]>([])
  const [record, setRecord] = useState<ShoutoutRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Each run gets a number so a stale poll loop can't overwrite a newer run's state.
  const runId = useRef(0)

  const conceptMutation = useMutation({ mutationFn: createConcept })

  const busy = phase === 'concept' || phase === 'image'

  async function run(avoid: string[], previousStyle?: StyleId) {
    const thisRun = ++runId.current
    const isCurrent = () => runId.current === thisRun
    setError(null)
    setRecord(null)
    setPhase('concept')
    try {
      const nextConcept = await conceptMutation.mutateAsync({
        data: { shoutout, style: styleChoice, avoid, previousStyle },
      })
      if (!isCurrent()) return
      setConcept(nextConcept)
      setUsedConcepts([...avoid, nextConcept.concept])
      setPhase('image')
      const saved = await generateImage(
        {
          shoutout,
          concept: nextConcept.concept,
          imagePrompt: nextConcept.imagePrompt,
          styleId: nextConcept.styleId,
        },
        isCurrent,
      )
      if (!isCurrent()) return
      setRecord(saved)
      // The server may have swapped in a tamer concept after a refusal.
      if (saved.concept !== nextConcept.concept) {
        setConcept({ ...nextConcept, concept: saved.concept, imagePrompt: saved.imagePrompt })
        setUsedConcepts((prev) => [...prev, saved.concept])
      }
      setPhase('done')
      void queryClient.invalidateQueries({ queryKey: ['gallery'] })
    } catch (err) {
      if (!isCurrent()) return
      setPhase('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || shoutout.trim().length < 8) return
    setConcept(null)
    setUsedConcepts([])
    void run([])
  }

  function onAnotherTake() {
    if (busy) return
    void run(usedConcepts, concept?.styleId)
  }

  function onSurprise() {
    const pool = SAMPLE_SHOUTOUTS.filter((s) => s !== shoutout)
    setShoutout(pool[Math.floor(Math.random() * pool.length)] ?? SAMPLE_SHOUTOUTS[0]!)
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            <span className="text-wiggle-red">Shout</span>
            <span className="text-wiggle-yellow">out</span>{' '}
            <span className="text-wiggle-blue">Ima</span>
            <span className="text-wiggle-purple">ges</span>
          </h1>
          <ThemeToggle className="shrink-0" />
        </div>
        <p className="text-lg text-ink-muted">Paste a shoutout. Get a ridiculous picture of it.</p>
        <MockBadge />
      </header>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-card p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink-muted">Shoutout</span>
          <textarea
            value={shoutout}
            onChange={(e) => setShoutout(e.target.value)}
            rows={4}
            maxLength={600}
            disabled={busy}
            placeholder="Shoutout to Sam for bringing homemade sourdough to every single standup this month."
            className="w-full resize-y rounded-xl border border-line bg-field px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/30 disabled:opacity-60"
          />
        </label>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-muted">Style</span>
            <select
              value={styleChoice}
              onChange={(e) => setStyleChoice(e.target.value as StyleChoice)}
              disabled={busy}
              className="rounded-lg border border-line bg-field px-3 py-2 text-sm text-ink focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/30"
            >
              <option value="random">Random</option>
              {STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSurprise}
              disabled={busy}
              className="rounded-lg border-2 border-wiggle-purple px-4 py-2 text-sm font-semibold text-wiggle-purple transition hover:bg-wiggle-purple hover:text-white disabled:opacity-50 dark:border-wiggle-blue dark:text-sky-300 dark:hover:bg-wiggle-blue dark:hover:text-white"
            >
              Surprise me
            </button>
            <button
              type="submit"
              disabled={busy || shoutout.trim().length < 8}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-accent-ink shadow-sm transition hover:bg-accent-hover disabled:opacity-50"
            >
              {busy ? 'Generating…' : 'Generate image'}
            </button>
          </div>
        </div>
      </form>

      <section className="mt-8 space-y-4" aria-live="polite">
        {phase === 'concept' && (
          <StatusLine spinner>Thinking of a visual gag…</StatusLine>
        )}

        {concept && phase !== 'concept' && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-well px-4 py-3">
            <StyleBadge styleId={concept.styleId} />
            <p className="text-ink">
              <span className="font-semibold">Concept:</span> {concept.concept}
            </p>
          </div>
        )}

        {phase === 'image' && (
          <div className="flex aspect-square w-full animate-pulse items-center justify-center rounded-2xl border border-dashed border-line bg-well text-ink-muted">
            <StatusLine spinner>Painting… this usually takes 20 to 90 seconds.</StatusLine>
          </div>
        )}

        {phase === 'error' && error && (
          <div className="rounded-xl border border-wiggle-red/40 bg-wiggle-red/10 px-4 py-3 text-sm text-ink">
            <p className="font-semibold text-wiggle-red dark:text-red-300">Couldn't generate that one.</p>
            <p>{error}</p>
          </div>
        )}

        {record && phase === 'done' && <ResultCard record={record} />}

        {(phase === 'done' || phase === 'error') && concept && (
          <div>
            <button
              type="button"
              onClick={onAnotherTake}
              disabled={busy}
              className="rounded-lg border-2 border-wiggle-blue bg-card px-4 py-2 text-sm font-semibold text-wiggle-blue transition hover:bg-wiggle-blue hover:text-white disabled:opacity-50 dark:text-sky-300 dark:hover:text-white"
            >
              Try another take
            </button>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Recent</h2>
        <GalleryStrip />
      </section>
    </main>
  )
}

function StatusLine({ children, spinner }: { children: React.ReactNode; spinner?: boolean }) {
  return (
    <p className="flex items-center gap-2 text-sm text-ink-muted">
      {spinner && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-wiggle-red dark:border-t-wiggle-yellow" aria-hidden />
      )}
      {children}
    </p>
  )
}
