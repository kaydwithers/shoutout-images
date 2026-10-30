import { getStyle, type StyleId } from '#/lib/styles'

/** Small neutral label used over images and in panels. */
export function Tag({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center rounded-md border border-line bg-card/95 px-2 py-0.5 text-xs font-medium text-ink"
    >
      {children}
    </span>
  )
}

export function StyleBadge({ styleId }: { styleId: StyleId }) {
  return <Tag>{getStyle(styleId).label}</Tag>
}
