import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ResultCard } from '#/components/ResultCard'
import { ThemeToggle } from '#/components/ThemeToggle'
import { getGalleryItem } from '#/server/shoutout'

export const Route = createFileRoute('/gallery/$id')({
  loader: async ({ params }) => {
    const record = await getGalleryItem({ data: { id: params.id } })
    if (!record) throw notFound()
    return record
  },
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-ink">That shoutout image doesn't exist.</p>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-wiggle-blue underline dark:text-sky-300">
        Back to generator
      </Link>
    </main>
  ),
  component: GalleryItem,
})

function GalleryItem() {
  const record = Route.useLoaderData()
  const created = new Date(record.createdAt)

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="text-sm font-medium text-wiggle-blue underline-offset-2 hover:underline dark:text-sky-300">
          ← Back to generator
        </Link>
        <ThemeToggle />
      </div>

      <ResultCard record={record} showDetailLink={false} />

      <dl className="grid gap-4 rounded-2xl border border-line bg-card p-5 text-sm shadow-sm">
        <Row label="Generated">{created.toLocaleString()}</Row>
        <Row label="Provider">{record.provider}</Row>
        <Row label="Image prompt">
          <pre className="whitespace-pre-wrap font-sans text-ink">{record.imagePrompt}</pre>
        </Row>
        <Row label="Final prompt sent">
          <pre className="whitespace-pre-wrap rounded-lg bg-well p-3 font-mono text-xs text-ink-muted">{record.finalPrompt}</pre>
        </Row>
      </dl>
    </main>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
      <dt className="font-semibold text-ink-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  )
}
