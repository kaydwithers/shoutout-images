import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { downloadWithCaption } from '#/lib/download'
import type { ShoutoutRecord } from '#/lib/types'
import { StyleBadge, Tag } from './StyleBadge'

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
        <p className="text-base font-medium leading-snug text-ink">{record.shoutout}</p>
        <p className="text-sm text-ink-muted">
          <span className="font-medium">Concept</span> {record.concept}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? 'Preparing…' : 'Download with caption'}
          </button>
          {showDetailLink && (
            <Link
              to="/gallery/$id"
              params={{ id: record.id }}
              className="rounded-sm text-sm font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
            >
              View details
            </Link>
          )}
          {downloadError && <span className="text-sm text-danger">{downloadError}</span>}
        </div>
      </figcaption>
    </figure>
  )
}
