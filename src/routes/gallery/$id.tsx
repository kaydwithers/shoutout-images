import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ResultCard } from '#/components/ResultCard'
import { getGalleryItem } from '#/server/shoutout'

const backLink =
  'inline-flex items-center gap-1.5 rounded-sm font-medium text-ink-muted transition-colors hover:text-ink'

export const Route = createFileRoute('/gallery/$id')({
  loader: async ({ params }) => {
    const record = await getGalleryItem({ data: { id: params.id } })
    if (!record) throw notFound()
    return record
  },
  notFoundComponent: () => (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="text-ink">That shoutout image doesn't exist.</p>
      <Link to="/" className={`mt-4 ${backLink}`}>
        ← Back to generator
      </Link>
    </main>
  ),
  component: GalleryItem,
})

function GalleryItem() {
  const record = Route.useLoaderData()
  const created = new Date(record.createdAt)

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
      <Link to="/" className={backLink}>
        ← Back to generator
      </Link>

      <ResultCard record={record} showDetailLink={false} />

      <dl className="divide-y divide-line rounded-xl border border-line bg-card">
        <Row label="Generated">{created.toLocaleString()}</Row>
        <Row label="Provider">{record.provider}</Row>
        <Row label="Image prompt">
          <p className="whitespace-pre-wrap leading-relaxed">{record.imagePrompt}</p>
        </Row>
        <Row label="Final prompt sent">
          <pre className="whitespace-pre-wrap rounded-lg bg-well p-3 font-mono leading-relaxed text-ink-muted">{record.finalPrompt}</pre>
        </Row>
      </dl>
    </main>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr] sm:px-5">
      <dt className="font-medium text-ink-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  )
}
