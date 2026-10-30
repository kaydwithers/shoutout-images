import { createMiddleware, createStart } from '@tanstack/react-start'
import { env } from '#/lib/env'

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** HTTP Basic auth across every request when APP_PASSWORD is set. Any username works. */
const passwordGate = createMiddleware({ type: 'request' }).server(async ({ next, request }) => {
  if (!env.appPassword) return next()

  const header = request.headers.get('authorization') ?? ''
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
    const password = decoded.slice(decoded.indexOf(':') + 1)
    if (timingSafeEqual(password, env.appPassword)) return next()
  }

  return new Response('Password required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Shoutout Images", charset="UTF-8"' },
  })
})

export const startInstance = createStart(() => ({
  requestMiddleware: [passwordGate],
}))
