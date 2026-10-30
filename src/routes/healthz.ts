import { createFileRoute } from '@tanstack/react-router'

// Unauthenticated liveness check for the hosting platform. Exempted from the password gate in src/start.ts.
export const Route = createFileRoute('/healthz')({
  server: {
    handlers: {
      GET: () => new Response('ok', { headers: { 'Content-Type': 'text/plain' } }),
    },
  },
})
