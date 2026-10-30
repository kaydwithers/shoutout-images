import { Link } from '@tanstack/react-router'
import { ThemeToggle } from './ThemeToggle'

/** Slim top bar: wordmark on the left, theme toggle on the right. */
export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="rounded-sm font-bold tracking-tight text-ink">
          Shoutout Images
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
