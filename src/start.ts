import { createHmac, createHash, timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto'
import { createMiddleware, createStart } from '@tanstack/react-start'
import { env } from '#/lib/env'

/*
 * Password gate. When APP_PASSWORD is set, every request needs one of:
 *   - a session cookie issued by the login page (lasts 30 days), or
 *   - an HTTP Basic auth header (handy for curl and scripts).
 * The cookie is an HMAC derived from the password, so it is stateless, survives
 * restarts, and every session is invalidated the moment the password changes.
 */

const COOKIE = 'shoutout_auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return nodeTimingSafeEqual(ab, bb)
}

function sessionToken(password: string): string {
  const key = createHash('sha256').update(`shoutout-images:${password}`).digest()
  return createHmac('sha256', key).update('session-v1').digest('hex')
}

function cookieValue(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}

function isHttps(request: Request): boolean {
  const forwarded = request.headers.get('x-forwarded-proto')
  if (forwarded) return forwarded.split(',')[0]!.trim() === 'https'
  return new URL(request.url).protocol === 'https:'
}

function setCookie(request: Request, value: string, maxAge: number): string {
  const parts = [`${COOKIE}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`]
  if (isHttps(request)) parts.push('Secure')
  return parts.join('; ')
}

function hasValidCookie(request: Request, password: string): boolean {
  const value = cookieValue(request, COOKIE)
  return !!value && timingSafeEqual(value, sessionToken(password))
}

function hasValidBasicAuth(request: Request, password: string): boolean {
  const header = request.headers.get('authorization') ?? ''
  if (!header.startsWith('Basic ')) return false
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
  return timingSafeEqual(decoded.slice(decoded.indexOf(':') + 1), password)
}

/** Only allow redirects back into this site. */
function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/login')) return '/'
  return raw
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function loginPage(opts: { next: string; error?: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in · Shoutout Images</title>
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700&display=swap">
<style>
  :root { color-scheme: light dark; --bg: #fff; --ink: #000; --well: #f2f2f2; --brand: #1e6fff; }
  @media (prefers-color-scheme: dark) { :root { --bg: #000; --ink: #fff; --well: #141414; } }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1rem;
    background: var(--bg); color: var(--ink); font: 500 17px/1.7 Satoshi, system-ui, sans-serif; }
  form { width: 100%; max-width: 24rem; border: 1px solid var(--ink); border-radius: 12px; padding: 1.5rem; }
  h1 { font-size: 28px; line-height: 1.3; margin: 0 0 1rem; }
  label { display: block; font-weight: 500; margin-bottom: .4rem; }
  input { width: 100%; height: 2.75rem; padding: 0 .75rem; border: 1px solid var(--ink); border-radius: 8px;
    background: var(--bg); color: var(--ink); font: inherit; }
  input:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  button { margin-top: 1rem; width: 100%; height: 2.75rem; border: 1px solid var(--ink); border-radius: 8px;
    background: var(--brand); color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
  .error { margin: 0 0 1rem; padding: .5rem .75rem; border: 1px solid var(--ink); border-radius: 8px; background: var(--well); }
  p { margin: 1rem 0 0; }
</style>
</head>
<body>
<form method="post" action="/login">
  <h1>Shoutout Images</h1>
  ${opts.error ? `<p class="error" role="alert">${escapeHtml(opts.error)}</p>` : ''}
  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="current-password" autofocus required>
  <input type="hidden" name="next" value="${escapeHtml(opts.next)}">
  <button type="submit">Sign in</button>
  <p>You'll stay signed in on this browser for 30 days.</p>
</form>
</body>
</html>`
}

function html(body: string, status: number, headers: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers },
  })
}

const passwordGate = createMiddleware({ type: 'request' }).server(async ({ next, request }) => {
  const password = env.appPassword
  if (!password) return next()

  const url = new URL(request.url)
  const path = url.pathname

  if (path === '/healthz') return next()

  if (path === '/login') {
    if (request.method === 'POST') {
      const form = await request.formData().catch(() => null)
      const attempt = String(form?.get('password') ?? '')
      const target = safeNext(String(form?.get('next') ?? '/'))
      if (timingSafeEqual(attempt, password)) {
        return new Response(null, {
          status: 303,
          headers: { location: target, 'set-cookie': setCookie(request, sessionToken(password), COOKIE_MAX_AGE) },
        })
      }
      return html(loginPage({ next: target, error: "That password isn't right." }), 401)
    }
    if (hasValidCookie(request, password)) {
      return new Response(null, { status: 303, headers: { location: safeNext(url.searchParams.get('next')) } })
    }
    return html(loginPage({ next: safeNext(url.searchParams.get('next')) }), 200)
  }

  if (path === '/logout') {
    return new Response(null, {
      status: 303,
      headers: { location: '/login', 'set-cookie': setCookie(request, '', 0) },
    })
  }

  if (hasValidCookie(request, password) || hasValidBasicAuth(request, password)) return next()

  // Browser navigations get the login page; everything else (server fns, images) gets a bare 401.
  const wantsHtml = (request.headers.get('accept') ?? '').includes('text/html')
  if (wantsHtml && request.method === 'GET') {
    return html(loginPage({ next: path + url.search }), 401)
  }
  return new Response('Password required', { status: 401, headers: { 'cache-control': 'no-store' } })
})

export const startInstance = createStart(() => ({
  requestMiddleware: [passwordGate],
}))
