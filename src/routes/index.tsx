import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GalleryStrip, galleryQueryOptions } from '#/components/GalleryStrip'
import { MockBadge, statusQueryOptions } from '#/components/MockBadge'
import { ResultCard } from '#/components/ResultCard'
import { StyleBadge } from '#/components/StyleBadge'
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

const primaryButton =
  'inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 font-semibold text-primary-ink transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButton =
  'inline-flex h-10 items-center justify-center rounded-lg border border-line bg-card px-4 font-semibold text-ink transition-colors hover:border-line-strong hover:bg-well disabled:cursor-not-allowed disabled:opacity-50'

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
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Turn a shoutout into a picture.</h1>
        <p className="max-w-prose text-ink-muted">
          Paste a workplace shoutout. We find the visual gag in it and paint it in one of three house styles.
        </p>
        <MockBadge />
      </div>

      <form onSubmit={onSubmit} className="rounded-xl border border-line bg-card p-4 sm:p-5">
        <label className="block">
          <span className="mb-1.5 block font-medium text-ink">Shoutout</span>
          <textarea
            value={shoutout}
            onChange={(e) => setShoutout(e.target.value)}
            rows={4}
            maxLength={600}
            disabled={busy}
            placeholder="Shoutout to Sam for bringing homemade sourdough to every single standup this month."
            className="w-full resize-y rounded-lg border border-line bg-field px-3.5 py-3 leading-relaxed text-ink placeholder:text-ink-faint transition-colors hover:border-line-strong focus:border-line-strong focus:outline-none disabled:opacity-60"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <label className="block">
            <span className="mb-1.5 block font-medium text-ink">Style</span>
            <select
              value={styleChoice}
              onChange={(e) => setStyleChoice(e.target.value as StyleChoice)}
              disabled={busy}
              className="h-10 rounded-lg border border-line bg-field px-3 pr-8 text-ink transition-colors hover:border-line-strong focus:border-line-strong focus:outline-none disabled:opacity-60"
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
            <button type="button" onClick={onSurprise} disabled={busy} className={secondaryButton}>
              Surprise me
            </button>
            <button type="submit" disabled={busy || shoutout.trim().length < 8} className={primaryButton}>
              {busy ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>
      </form>

      <section className="mt-6 space-y-4" aria-live="polite">
        {phase === 'concept' && (
          <Panel>
            <StatusLine spinner>Thinking of a visual gag…</StatusLine>
          </Panel>
        )}

        {concept && phase !== 'concept' && (
          <Panel className="flex flex-wrap items-center gap-3">
            <StyleBadge styleId={concept.styleId} />
            <p className="text-ink">
              <span className="font-medium text-ink-muted">Concept</span> {concept.concept}
            </p>
          </Panel>
        )}

        {phase === 'image' && (
          <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-line-strong bg-well">
            <StatusLine spinner>Painting… this usually takes 20 to 90 seconds.</StatusLine>
          </div>
        )}

        {phase === 'error' && error && (
          <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-ink">
            <p className="font-semibold text-danger">Couldn't generate that one.</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {record && phase === 'done' && <ResultCard record={record} />}

        {(phase === 'done' || phase === 'error') && concept && (
          <div>
            <button type="button" onClick={onAnotherTake} disabled={busy} className={secondaryButton}>
              Try another take
            </button>
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-ink">Recent</h2>
        <GalleryStrip />
      </section>
    </main>
  )
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-well px-4 py-3 ${className}`}>{children}</div>
}

function StatusLine({ children, spinner }: { children: React.ReactNode; spinner?: boolean }) {
  return (
    <p className="flex items-center gap-2.5 text-ink-muted">
      {spinner && (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-ink"
          aria-hidden
        />
      )}
      {children}
    </p>
  )
}
