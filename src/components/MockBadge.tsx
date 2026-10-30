import { useQuery } from '@tanstack/react-query'
import { getStatus } from '#/server/shoutout'

export function statusQueryOptions() {
  return { queryKey: ['status'] as const, queryFn: () => getStatus(), staleTime: Infinity }
}

export function MockBadge() {
  const { data } = useQuery(statusQueryOptions())
  if (!data) return null
  if (data.mock) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg border border-wiggle-yellow/70 bg-wiggle-yellow/15 px-3 py-2 text-sm text-ink"
        title={data.mockReason ?? undefined}
      >
        <span className="rounded bg-wiggle-yellow px-1.5 py-0.5 text-xs font-black tracking-wide text-ink dark:text-[#2a1a3d]">MOCK</span>
        <span>
          Placeholder images only. {data.mockReason}.
        </span>
      </div>
    )
  }
  return (
    <div className="text-xs text-ink-faint">
      Live: concepts via {data.conceptProvider === 'anthropic' ? 'Claude' : 'OpenAI'}, images via {data.imageModel} ({data.imageSize},{' '}
      {data.imageQuality}).
    </div>
  )
}
