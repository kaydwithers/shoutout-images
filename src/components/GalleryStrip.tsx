import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { listGallery } from '#/server/shoutout'

export function galleryQueryOptions() {
  return { queryKey: ['gallery'] as const, queryFn: () => listGallery() }
}

export function GalleryStrip() {
  const { data, isPending } = useQuery(galleryQueryOptions())

  if (isPending) return <p className="text-sm text-ink-faint">Loading recent shoutouts…</p>
  if (!data || data.length === 0) {
    return <p className="text-sm text-ink-faint">Nothing generated yet. Your results will appear here.</p>
  }

  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {data.map((r) => (
        <li key={r.id}>
          <Link
            to="/gallery/$id"
            params={{ id: r.id }}
            title={r.concept}
            className="block overflow-hidden rounded-xl border border-line bg-card transition hover:-translate-y-0.5 hover:border-wiggle-purple hover:shadow-md dark:hover:border-wiggle-yellow"
          >
            <img src={`/api/images/${r.imageFile}`} alt={r.concept} loading="lazy" className="aspect-square w-full object-cover" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
