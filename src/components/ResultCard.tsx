import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { downloadWithCaption } from '#/lib/download'
import type { ShoutoutRecord } from '#/lib/types'
import { StyleBadge } from './StyleBadge'

export function ResultCard({ record, showDetailLink = true }: { record: ShoutoutRecord; showDetailLink?: boolean }) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  async function onDownload() {
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadWithCaption(record)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
      <div className="relative">
        <img src={`/api/images/${record.imageFile}`} alt={record.concept} className="aspect-square w-full object-cover" />
        <div className="absolute left-3 top-3 flex gap-2">
          <StyleBadge styleId={record.styleId} />
          {record.mock && (
            <span className="rounded-full bg-wiggle-yellow px-2.5 py-0.5 text-xs font-black text-[#2a1a3d]">MOCK</span>
          )}
          {record.retried && (
            <span
              className="rounded-full bg-wiggle-purple px-2.5 py-0.5 text-xs font-semibold text-white"
              title="The first concept was refused by the image model, so a tamer one was used."
            >
              Retried
            </span>
          )}
        </div>
      </div>
      <figcaption className="space-y-3 p-5">
        <p className="text-lg font-medium leading-snug text-ink">{record.shoutout}</p>
        <p className="text-sm text-ink-muted">
          <span className="font-semibold text-ink">Concept:</span> {record.concept}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-ink shadow-sm transition hover:bg-accent-hover disabled:opacity-50"
          >
            {downloading ? 'Preparing…' : 'Download with caption'}
          </button>
          {showDetailLink && (
            <Link
              to="/gallery/$id"
              params={{ id: record.id }}
              className="text-sm font-medium text-wiggle-blue underline-offset-2 hover:underline dark:text-sky-300"
            >
              View details
            </Link>
          )}
          {downloadError && <span className="text-sm text-wiggle-red dark:text-red-300">{downloadError}</span>}
        </div>
      </figcaption>
    </figure>
  )
}
