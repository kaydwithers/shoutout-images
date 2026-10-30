import { createFileRoute } from '@tanstack/react-router'
import { readFile } from 'node:fs/promises'
import { imagePath } from '#/lib/store'

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  svg: 'image/svg+xml',
}

export const Route = createFileRoute('/api/images/$file')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const filePath = imagePath(params.file)
        if (!filePath) return new Response('Not found', { status: 404 })
        try {
          const bytes = await readFile(filePath)
          const ext = params.file.split('.').pop() ?? 'png'
          return new Response(new Uint8Array(bytes), {
            headers: {
              'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          })
        } catch {
          return new Response('Not found', { status: 404 })
        }
      },
    },
  },
})
