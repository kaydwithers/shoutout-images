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
        className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border border-line bg-well px-3 py-2 text-ink-muted"
        title={data.mockReason ?? undefined}
      >
        <span className="rounded-md bg-accent px-1.5 py-0.5 font-bold text-accent-ink">Mock</span>
        <span>Placeholder images only. {data.mockReason}.</span>
      </div>
    )
  }
  // Live mode shows nothing; the absence of the mock notice is the signal.
  return null
}
