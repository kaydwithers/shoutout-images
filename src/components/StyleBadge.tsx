import { getStyle, type StyleId } from '#/lib/styles'

/** Small label used over images and in panels. Black and white unless given a colour. */
export function Tag({ children, title, className = '' }: { children: React.ReactNode; title?: string; className?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-md border border-line px-2 py-0.5 font-medium ${className || 'bg-card/95 text-ink'}`}
    >
      {children}
    </span>
  )
}

export function StyleBadge({ styleId }: { styleId: StyleId }) {
  const style = getStyle(styleId)
  return <Tag className={style.tagClass}>{style.label}</Tag>
}
