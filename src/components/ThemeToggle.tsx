export const THEME_STORAGE_KEY = 'shoutout-theme'

/**
 * Runs before paint so the page never flashes the wrong theme.
 * Stored choice wins; otherwise follow the OS setting.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`

function toggleTheme() {
  const root = document.documentElement
  const dark = root.classList.toggle('dark')
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light')
  } catch {
    // Private mode or blocked storage: the toggle still works for this page load.
  }
}

/**
 * Both icons are always rendered and CSS picks the visible one, so there is no
 * client state and nothing to mismatch during hydration.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-ink shadow-sm transition hover:border-wiggle-purple hover:text-wiggle-purple dark:hover:border-wiggle-yellow dark:hover:text-wiggle-yellow ${className}`}
    >
      <SunIcon className="hidden h-5 w-5 dark:block" />
      <MoonIcon className="h-5 w-5 dark:hidden" />
    </button>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}
