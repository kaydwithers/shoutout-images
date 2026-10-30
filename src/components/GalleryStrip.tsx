import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { listGallery } from '#/server/shoutout'

export function galleryQueryOptions() {
  return { queryKey: ['gallery'] as const, queryFn: () => listGallery() }
}

export function GalleryStrip() {
  const { data, isPending } = useQuery(galleryQueryOptions())

  if (isPending) return <p className="text-ink-muted">Loading recent shoutouts…</p>
  if (!data || data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-ink-muted">
        Nothing generated yet. Your results will appear here.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {data.map((r) => (
        <li key={r.id}>
          <Link
            to="/gallery/$id"
            params={{ id: r.id }}
            title={r.concept}
            className="block overflow-hidden rounded-lg border border-line bg-well transition-colors hover:border-line-strong"
          >
            <img src={`/api/images/${r.imageFile}`} alt={r.concept} loading="lazy" className="aspect-square w-full object-cover" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
