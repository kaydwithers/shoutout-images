import { getStyle, type StyleId } from '#/lib/styles'

export function StyleBadge({ styleId, className = '' }: { styleId: StyleId; className?: string }) {
  const style = getStyle(styleId)
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge} ${className}`}>
      {style.label}
    </span>
  )
}
