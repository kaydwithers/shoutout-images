import { randomBytes } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from './env'
import type { ShoutoutRecord } from './types'

const ID_PATTERN = /^[a-z0-9]{12}$/

async function ensureDir() {
  await mkdir(env.generatedDir, { recursive: true })
}

export function newId(): string {
  return randomBytes(9).toString('base64url').replace(/[^a-z0-9]/gi, '').toLowerCase().padEnd(12, '0').slice(0, 12)
}

export function isValidId(id: string): boolean {
  return ID_PATTERN.test(id)
}

export async function saveRecord(record: ShoutoutRecord, image: Buffer): Promise<void> {
  await ensureDir()
  await writeFile(path.join(env.generatedDir, record.imageFile), image)
  await writeFile(path.join(env.generatedDir, `${record.id}.json`), JSON.stringify(record, null, 2))
}

export async function getRecord(id: string): Promise<ShoutoutRecord | null> {
  if (!isValidId(id)) return null
  try {
    const raw = await readFile(path.join(env.generatedDir, `${id}.json`), 'utf8')
    return JSON.parse(raw) as ShoutoutRecord
  } catch {
    return null
  }
}

export async function listRecords(limit = 24): Promise<ShoutoutRecord[]> {
  await ensureDir()
  const files = (await readdir(env.generatedDir)).filter((f) => f.endsWith('.json'))
  const records = await Promise.all(
    files.map(async (f) => {
      try {
        return JSON.parse(await readFile(path.join(env.generatedDir, f), 'utf8')) as ShoutoutRecord
      } catch {
        return null
      }
    }),
  )
  return records
    .filter((r): r is ShoutoutRecord => r !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

/** Merges a partial update into a record's JSON sidecar. Returns the updated record, or null if missing. */
export async function updateRecord(id: string, patch: Partial<ShoutoutRecord>): Promise<ShoutoutRecord | null> {
  const current = await getRecord(id)
  if (!current) return null
  const updated = { ...current, ...patch, id: current.id }
  await writeFile(path.join(env.generatedDir, `${id}.json`), JSON.stringify(updated, null, 2))
  return updated
}

/** Most recently loved results, newest first. */
export async function listLoved(limit = 3): Promise<ShoutoutRecord[]> {
  const all = await listRecords(500)
  return all.filter((r) => r.loved).slice(0, limit)
}

/** Resolves a generated image file name to a path, refusing anything that isn't ours. */
export function imagePath(file: string): string | null {
  const match = /^([a-z0-9]{12})\.(png|svg)$/.exec(file)
  if (!match) return null
  return path.join(env.generatedDir, file)
}
