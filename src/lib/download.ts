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

const FONT = 'Satoshi, ui-sans-serif, system-ui, -apple-system, sans-serif'

/** Composites the image with the caption and the shoutout underneath. */
async function compositePng(record: ShoutoutRecord): Promise<Blob> {
  const img = await loadImage(`/api/images/${record.imageFile}`)
  const width = 1024
  const imageHeight = Math.round((img.naturalHeight / img.naturalWidth) * width) || 1024
  const padding = 48
  const captionSize = 44
  const bodySize = 30
  const captionLine = Math.round(captionSize * 1.25)
  const bodyLine = Math.round(bodySize * 1.4)

  const measure = document.createElement('canvas').getContext('2d')!
  const captionFont = `700 ${captionSize}px ${FONT}`
  const bodyFont = `500 ${bodySize}px ${FONT}`
  measure.font = captionFont
  const captionLines = record.caption ? wrapText(measure, record.caption, width - padding * 2) : []
  measure.font = bodyFont
  const bodyLines = wrapText(measure, record.shoutout, width - padding * 2)

  const gap = captionLines.length ? Math.round(bodySize * 0.6) : 0
  const textHeight = captionLines.length * captionLine + gap + bodyLines.length * bodyLine
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = imageHeight + padding + textHeight + padding
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, width, imageHeight)

  ctx.fillStyle = '#000000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  let y = imageHeight + padding
  ctx.font = captionFont
  for (const line of captionLines) {
    ctx.fillText(line, width / 2, y)
    y += captionLine
  }
  y += gap
  ctx.font = bodyFont
  for (const line of bodyLines) {
    ctx.fillText(line, width / 2, y)
    y += bodyLine
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not encode PNG.')
  return blob
}

/** Downloads the captioned composite as a PNG. */
export async function downloadWithCaption(record: ShoutoutRecord): Promise<void> {
  const blob = await compositePng(record)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shoutout-${record.id}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Copies the captioned composite to the clipboard as a PNG, ready to paste into Slack. */
export async function copyWithCaption(record: ShoutoutRecord): Promise<void> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    throw new Error('This browser cannot copy images. Use Download instead.')
  }
  // Safari requires the ClipboardItem to be created synchronously in the click handler,
  // so hand it a promise rather than awaiting the blob first.
  const item = new ClipboardItem({ 'image/png': compositePng(record) })
  await navigator.clipboard.write([item])
}
