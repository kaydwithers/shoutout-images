import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GalleryStrip, galleryQueryOptions } from '#/components/GalleryStrip'
import { MockBadge, statusQueryOptions } from '#/components/MockBadge'
import { ResultCard } from '#/components/ResultCard'
import { StyleBadge } from '#/components/StyleBadge'
import { STYLES, type StyleId } from '#/lib/styles'
import { SAMPLE_SHOUTOUTS, type ShoutoutRecord } from '#/lib/types'
import { createConcept, createImage, type ConceptResult } from '#/server/shoutout'

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

  const conceptMutation = useMutation({ mutationFn: createConcept })
  const imageMutation = useMutation({ mutationFn: createImage })

  const busy = phase === 'concept' || phase === 'image'

  async function run(avoid: string[], previousStyle?: StyleId) {
    setError(null)
    setRecord(null)
    setPhase('concept')
    try {
      const nextConcept = await conceptMutation.mutateAsync({
        data: { shoutout, style: styleChoice, avoid, previousStyle },
      })
      setConcept(nextConcept)
      setUsedConcepts([...avoid, nextConcept.concept])
      setPhase('image')
      const saved = await imageMutation.mutateAsync({
        data: {
          shoutout,
          concept: nextConcept.concept,
          imagePrompt: nextConcept.imagePrompt,
          styleId: nextConcept.styleId,
        },
      })
      setRecord(saved)
      // The server may have swapped in a tamer concept after a refusal.
      if (saved.concept !== nextConcept.concept) {
        setConcept({ ...nextConcept, concept: saved.concept, imagePrompt: saved.imagePrompt })
        setUsedConcepts((prev) => [...prev, saved.concept])
      }
      setPhase('done')
      void queryClient.invalidateQueries({ queryKey: ['gallery'] })
    } catch (err) {
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
        <h1 className="text-4xl font-black tracking-tight text-gray-900">Shoutout Images</h1>
        <p className="text-lg text-gray-600">Paste a shoutout. Get a ridiculous picture of it.</p>
        <MockBadge />
      </header>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-700">Shoutout</span>
          <textarea
            value={shoutout}
            onChange={(e) => setShoutout(e.target.value)}
            rows={4}
            maxLength={600}
            disabled={busy}
            placeholder="Shoutout to Sam for bringing homemade sourdough to every single standup this month."
            className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 shadow-inner focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-50"
          />
        </label>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Style</span>
            <select
              value={styleChoice}
              onChange={(e) => setStyleChoice(e.target.value as StyleChoice)}
              disabled={busy}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
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
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Surprise me
            </button>
            <button
              type="submit"
              disabled={busy || shoutout.trim().length < 8}
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
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
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <StyleBadge styleId={concept.styleId} />
            <p className="text-gray-800">
              <span className="font-semibold">Concept:</span> {concept.concept}
            </p>
          </div>
        )}

        {phase === 'image' && (
          <div className="flex aspect-square w-full animate-pulse items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-gray-500">
            <StatusLine spinner>Painting… this usually takes 15 to 60 seconds.</StatusLine>
          </div>
        )}

        {phase === 'error' && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">Couldn't generate that one.</p>
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
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Try another take
            </button>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Recent</h2>
        <GalleryStrip />
      </section>
    </main>
  )
}

function StatusLine({ children, spinner }: { children: React.ReactNode; spinner?: boolean }) {
  return (
    <p className="flex items-center gap-2 text-sm text-gray-600">
      {spinner && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" aria-hidden />
      )}
      {children}
    </p>
  )
}
