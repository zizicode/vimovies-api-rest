interface CacheEntry {
  content: string
  generatedAt: number
}

const cache = new Map<string, CacheEntry>()
const TTL_MS = 60 * 60 * 1000 // 1 hora

export function getCached(key: string): string | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.generatedAt > TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.content
}

export function setCached(key: string, content: string): void {
  cache.set(key, { content, generatedAt: Date.now() })
}

export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}
