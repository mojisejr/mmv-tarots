// Development Learning Journal - Base Performance Manager
// 🟢 Phase 4: Production-ready performance optimization utilities

export interface CacheEntry<T> {
  data: T
  expiry: number
}

export interface PerformanceMetrics {
  operationCount: number
  cacheHits: number
  cacheMisses: number
  averageResponseTime: number
  lastCleanup: number
}

export abstract class BasePerformanceManager {
  protected caches: Map<string, CacheEntry<any>> = new Map()
  protected metrics: PerformanceMetrics = {
    operationCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    lastCleanup: Date.now()
  }
  protected readonly DEFAULT_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

  // Generic cache management
  protected getFromCache<T>(key: string): T | null {
    const entry = this.caches.get(key)
    if (!entry) {
      this.metrics.cacheMisses++
      return null
    }

    if (Date.now() > entry.expiry) {
      this.caches.delete(key)
      this.metrics.cacheMisses++
      return null
    }

    this.metrics.cacheHits++
    return entry.data
  }

  protected setCache<T>(key: string, data: T, ttl?: number): void {
    this.caches.set(key, {
      data,
      expiry: Date.now() + (ttl || this.DEFAULT_CACHE_TTL)
    })
  }

  protected clearCache(pattern?: string): void {
    if (!pattern) {
      this.caches.clear()
      return
    }

    for (const key of this.caches.keys()) {
      if (key.includes(pattern)) {
        this.caches.delete(key)
      }
    }
  }

  protected cleanupExpiredEntries(): number {
    let cleaned = 0
    const now = Date.now()

    for (const [key, entry] of this.caches.entries()) {
      if (now > entry.expiry) {
        this.caches.delete(key)
        cleaned++
      }
    }

    this.metrics.lastCleanup = now
    return cleaned
  }

  // Retry mechanism with exponential backoff
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now()
        const result = await operation()
        this.updateMetrics(Date.now() - startTime)
        return result
      } catch (error) {
        lastError = error as Error

        if (attempt === maxRetries) {
          break
        }

        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  protected updateMetrics(responseTime: number): void {
    this.metrics.operationCount++
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.operationCount - 1) + responseTime) /
      this.metrics.operationCount
  }

  // Public methods for monitoring
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  getMemoryUsage(): any {
    const usage = process.memoryUsage()
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      cacheSize: this.caches.size
    }
  }

  resetMetrics(): void {
    this.metrics = {
      operationCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      lastCleanup: Date.now()
    }
  }
}