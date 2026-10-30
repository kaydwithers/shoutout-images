import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { copyWithCaption, downloadWithCaption } from '#/lib/download'
import type { ShoutoutRecord } from '#/lib/types'
import { setLoved } from '#/server/shoutout'
import { StyleBadge, Tag } from './StyleBadge'

const primaryButton =
  'inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 font-semibold text-primary-ink hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButton =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-card px-4 font-semibold text-ink hover:bg-well disabled:cursor-not-allowed disabled:opacity-50'

export function ResultCard({ record: initial, showDetailLink = true }: { record: ShoutoutRecord; showDetailLink?: boolean }) {
  const queryClient = useQueryClient()
  const [record, setRecord] = useState(initial)
  const [busy, setBusy] = useState<'download' | 'copy' | null>(null)
  const [note, setNote] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const loveMutation = useMutation({
    mutationFn: (loved: boolean) => setLoved({ data: { id: record.id, loved } }),
    onSuccess: (updated) => {
      if (updated) setRecord(updated)
      void queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
  })

  async function run(kind: 'download' | 'copy', action: () => Promise<void>, okText: string) {
    setBusy(kind)
    setNote(null)
    try {
      await action()
      if (okText) setNote({ kind: 'ok', text: okText })
    } catch (err) {
      setNote({ kind: 'error', text: err instanceof Error ? err.message : 'Something went wrong.' })
    } finally {
      setBusy(null)
    }
  }

  const loved = !!record.loved

  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-card">
      <div className="relative bg-well">
        <img src={`/api/images/${record.imageFile}`} alt={record.concept} className="aspect-square w-full object-cover" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <StyleBadge styleId={record.styleId} />
          {record.mock && <Tag>Mock</Tag>}
          {record.retried && (
            <Tag title="The first concept was refused by the image model, so a tamer one was used.">Retried</Tag>
          )}
        </div>
      </div>
      <figcaption className="space-y-3 p-4 sm:p-5">
        {record.caption && <p className="font-bold text-ink">{record.caption}</p>}
        <p className="text-ink">{record.shoutout}</p>
        <p className="text-ink-muted">
          <span className="font-medium">Concept</span> {record.concept}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => run('copy', () => copyWithCaption(record), 'Copied. Paste it into Slack.')}
            disabled={busy !== null}
            className={primaryButton}
          >
            {busy === 'copy' ? 'Copying…' : 'Copy image'}
          </button>
          <button
            type="button"
            onClick={() => run('download', () => downloadWithCaption(record), '')}
            disabled={busy !== null}
            className={secondaryButton}
          >
            {busy === 'download' ? 'Preparing…' : 'Download'}
          </button>
          <button
            type="button"
            onClick={() => loveMutation.mutate(!loved)}
            disabled={loveMutation.isPending}
            aria-pressed={loved}
            title={loved ? 'Loved. Future ideas learn from this one.' : 'Love it? Future ideas will learn from it.'}
            className={`${secondaryButton} ${loved ? 'bg-well' : ''}`}
          >
            <HeartIcon filled={loved} />
            {loved ? 'Loved' : 'Love it'}
          </button>
          {showDetailLink && (
            <Link
              to="/gallery/$id"
              params={{ id: record.id }}
              className="ml-1 rounded-sm font-medium text-ink-muted underline decoration-line-strong underline-offset-4 hover:text-ink"
            >
              Details
            </Link>
          )}
        </div>
        {note && (
          <p role="status" className={note.kind === 'error' ? 'text-danger' : 'text-ink-muted'}>
            {note.text}
          </p>
        )}
      </figcaption>
    </figure>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 21s-7-4.6-9.3-9A5.3 5.3 0 0 1 12 6.2 5.3 5.3 0 0 1 21.3 12C19 16.4 12 21 12 21z" />
    </svg>
  )
}
