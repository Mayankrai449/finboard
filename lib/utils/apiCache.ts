// Server-side API cache

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 1000; // 30 seconds

// Get cached data if valid
export function getCachedData(url: string): any | null {
  const entry = cache.get(url);
  
  if (!entry) return null;
  
  const now = Date.now();
  const age = now - entry.timestamp;
  
  // Check if cache is still valid
  if (age < CACHE_TTL) {
    return entry.data;
  }
  
  // Cache expired, remove it
  cache.delete(url);
  return null;
}

// Set cache data
export function setCachedData(url: string, data: any): void {
  cache.set(url, {
    data,
    timestamp: Date.now(),
  });
}

// Clear specific cache entry
export function clearCache(url: string): void {
  cache.delete(url);
}

// Clear all cache
export function clearAllCache(): void {
  cache.clear();
}

// Get cache stats
export function getCacheStats() {
  const now = Date.now();
  const entries = Array.from(cache.entries()).map(([url, entry]) => ({
    url,
    age: now - entry.timestamp,
    valid: (now - entry.timestamp) < CACHE_TTL,
  }));
  
  return {
    totalEntries: cache.size,
    validEntries: entries.filter(e => e.valid).length,
    entries,
  };
}
