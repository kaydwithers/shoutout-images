import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GalleryStrip, galleryQueryOptions } from '#/components/GalleryStrip'
import { MockBadge, statusQueryOptions } from '#/components/MockBadge'
import { ResultCard } from '#/components/ResultCard'
import { StyleBadge, Tag } from '#/components/StyleBadge'
import { STYLES, type StyleId } from '#/lib/styles'
import { SAMPLE_SHOUTOUTS, type Concept, type ShoutoutRecord } from '#/lib/types'
import { createIdeas, getImageJob, startImage, type IdeasResult } from '#/server/shoutout'

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
/** idle → ideas (thinking) → pick (five gags shown) → image (painting) → done | error */
type Phase = 'idle' | 'ideas' | 'pick' | 'image' | 'done' | 'error'

const primaryButton =
  'inline-flex h-10 items-center justify-center rounded-lg border border-line bg-brand px-5 font-bold text-brand-ink hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButton =
  'inline-flex h-10 items-center justify-center rounded-lg border border-line bg-card px-4 font-semibold text-ink hover:bg-well disabled:cursor-not-allowed disabled:opacity-50'
const fieldClass =
  'w-full rounded-lg border border-line bg-field px-3.5 py-3 leading-relaxed text-ink placeholder:text-ink-faint hover:border-line-strong focus:border-line-strong focus:outline-none disabled:opacity-60'

function Home() {
  const queryClient = useQueryClient()
  const [shoutout, setShoutout] = useState('')
  const [mustInclude, setMustInclude] = useState('')
  const [styleChoice, setStyleChoice] = useState<StyleChoice>('random')
  const [phase, setPhase] = useState<Phase>('idle')
  const [ideas, setIdeas] = useState<IdeasResult | null>(null)
  const [usedConcepts, setUsedConcepts] = useState<string[]>([])
  const [chosen, setChosen] = useState<Concept | null>(null)
  const [record, setRecord] = useState<ShoutoutRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Each run gets a number so a stale request can't overwrite a newer run's state.
  const runId = useRef(0)
  const ideasMutation = useMutation({ mutationFn: createIdeas })

  const busy = phase === 'ideas' || phase === 'image'
  const canSubmit = shoutout.trim().length >= 8

  async function fetchIdeas(avoid: string[], previousStyle?: StyleId) {
    const thisRun = ++runId.current
    const isCurrent = () => runId.current === thisRun
    setError(null)
    setRecord(null)
    setChosen(null)
    setPhase('ideas')
    try {
      const next = await ideasMutation.mutateAsync({
        data: { shoutout, style: styleChoice, avoid, previousStyle, mustInclude: mustInclude.trim() || undefined },
      })
      if (!isCurrent()) return
      setIdeas(next)
      setUsedConcepts([...avoid, ...next.candidates.map((c) => c.concept)])
      setPhase('pick')
    } catch (err) {
      if (!isCurrent()) return
      setPhase('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  async function paint(candidate: Concept) {
    if (!ideas) return
    const thisRun = ++runId.current
    const isCurrent = () => runId.current === thisRun
    setError(null)
    setRecord(null)
    setChosen(candidate)
    setPhase('image')
    try {
      const saved = await generateImage(
        {
          shoutout,
          concept: candidate.concept,
          imagePrompt: candidate.imagePrompt,
          caption: candidate.caption,
          styleId: ideas.styleId,
        },
        isCurrent,
      )
      if (!isCurrent()) return
      setRecord(saved)
      // The server may have swapped in a tamer concept after a refusal.
      if (saved.concept !== candidate.concept) {
        setChosen({ concept: saved.concept, imagePrompt: saved.imagePrompt, caption: saved.caption ?? '' })
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
    if (busy || !canSubmit) return
    setIdeas(null)
    setUsedConcepts([])
    void fetchIdeas([])
  }

  function onMoreIdeas() {
    if (busy) return
    void fetchIdeas(usedConcepts, ideas?.styleId)
  }

  function onSurprise() {
    const pool = SAMPLE_SHOUTOUTS.filter((s) => s !== shoutout)
    setShoutout(pool[Math.floor(Math.random() * pool.length)] ?? SAMPLE_SHOUTOUTS[0]!)
  }

  const showIdeas = ideas && (phase === 'pick' || phase === 'image' || phase === 'done' || phase === 'error')

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Turn a shoutout into a picture.</h1>
        <p className="max-w-prose text-ink-muted">Someone did something great. Let's make it adorable.</p>
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
            className={`${fieldClass} resize-y`}
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block font-medium text-ink">
            Make sure it includes <span className="font-normal text-ink-muted">(optional)</span>
          </span>
          <input
            type="text"
            value={mustInclude}
            onChange={(e) => setMustInclude(e.target.value)}
            maxLength={120}
            disabled={busy}
            placeholder="a tram, the Sydney visitors, the sourdough"
            className={`${fieldClass} h-10 py-0`}
          />
        </label>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <label className="block">
            <span className="mb-1.5 block font-medium text-ink">Style</span>
            <span className="relative inline-block">
              <select
                value={styleChoice}
                onChange={(e) => setStyleChoice(e.target.value as StyleChoice)}
                disabled={busy}
                className="h-10 appearance-none rounded-lg border border-line bg-field pl-3 pr-10 text-ink hover:border-line-strong focus:border-line-strong focus:outline-none disabled:opacity-60"
              >
                <option value="random">Random</option>
                {STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              {/* Native arrows ignore padding, so draw our own and pin it. */}
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </label>

          <div className="flex gap-2">
            <button type="button" onClick={onSurprise} disabled={busy} className={secondaryButton}>
              Surprise me
            </button>
            <button type="submit" disabled={busy || !canSubmit} className={primaryButton}>
              {phase === 'ideas' ? 'Thinking…' : 'Get ideas'}
            </button>
          </div>
        </div>
      </form>

      <section className="mt-6 space-y-4" aria-live="polite">
        {phase === 'ideas' && (
          <Panel>
            <StatusLine spinner>Thinking of five visual gags…</StatusLine>
          </Panel>
        )}

        {showIdeas && (
          <div className="rounded-xl border border-line bg-card p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-ink">Pick a gag</h2>
              <div className="flex items-center gap-2">
                <StyleBadge styleId={ideas.styleId} />
                <Tag>{ideas.animal}</Tag>
              </div>
            </div>
            <ul className="grid gap-2">
              {ideas.candidates.map((c, i) => {
                const isChosen = chosen?.concept === c.concept
                const isRecommended = i === ideas.recommendedIndex
                return (
                  <li key={c.concept}>
                    <button
                      type="button"
                      onClick={() => paint(c)}
                      disabled={busy}
                      aria-pressed={isChosen}
                      className={`flex w-full flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left hover:bg-well disabled:cursor-not-allowed disabled:opacity-60 ${
                        isChosen ? 'border-line-strong bg-well' : 'border-line bg-card'
                      }`}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink">{c.concept}</span>
                        {isRecommended && <Tag>Recommended</Tag>}
                        {isChosen && phase !== 'pick' && <Tag>{phase === 'image' ? 'Painting' : 'Painted'}</Tag>}
                      </span>
                      {c.caption && <span className="text-ink-muted">“{c.caption}”</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={onMoreIdeas} disabled={busy} className={secondaryButton}>
                Five new ideas
              </button>
              {phase === 'pick' && (
                <button
                  type="button"
                  onClick={() => paint(ideas.candidates[ideas.recommendedIndex]!)}
                  disabled={busy}
                  className={secondaryButton}
                >
                  Just paint the recommended one
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'image' && (
          <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-line-strong bg-well">
            <StatusLine spinner>Painting… this usually takes 20 to 90 seconds.</StatusLine>
          </div>
        )}

        {phase === 'error' && error && (
          <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-ink">
            <p className="font-semibold text-danger">Couldn't do that one.</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {record && phase === 'done' && <ResultCard record={record} />}
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
