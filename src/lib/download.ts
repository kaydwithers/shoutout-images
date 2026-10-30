import type { ShoutoutRecord } from './types'

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image for download.'))
    img.src = src
  })
}

/** Composites the image with the shoutout caption underneath and triggers a PNG download. */
export async function downloadWithCaption(record: ShoutoutRecord): Promise<void> {
  const img = await loadImage(`/api/images/${record.imageFile}`)
  const width = 1024
  const imageHeight = Math.round((img.naturalHeight / img.naturalWidth) * width) || 1024
  const padding = 48
  const fontSize = 34
  const lineHeight = Math.round(fontSize * 1.35)

  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system, sans-serif`
  const lines = wrapText(measure, record.shoutout, width - padding * 2)
  const captionHeight = padding + lines.length * lineHeight + padding

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = imageHeight + captionHeight
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, width, imageHeight)

  ctx.fillStyle = '#111827'
  ctx.font = measure.font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, imageHeight + padding + i * lineHeight)
  })

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not encode PNG.')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shoutout-${record.id}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
