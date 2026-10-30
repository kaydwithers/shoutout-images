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
        className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        title={data.mockReason ?? undefined}
      >
        <span className="rounded bg-amber-400 px-1.5 py-0.5 text-xs font-black tracking-wide text-amber-950">MOCK</span>
        <span>
          Placeholder images only. {data.mockReason}.
        </span>
      </div>
    )
  }
  return (
    <div className="text-xs text-gray-500">
      Live: concepts via {data.conceptProvider === 'anthropic' ? 'Claude' : 'OpenAI'}, images via {data.imageModel} ({data.imageSize},{' '}
      {data.imageQuality}).
    </div>
  )
}
