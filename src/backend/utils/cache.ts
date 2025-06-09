interface CacheItem {
  data: any;
  timestamp: number;
}

class Cache {
  private cache: Map<string, CacheItem>;
  private duration: number;

  constructor(duration: number) {
    this.cache = new Map();
    this.duration = duration;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > this.duration;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new Cache(CACHE_DURATION);