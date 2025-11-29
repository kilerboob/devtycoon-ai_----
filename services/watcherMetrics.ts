/**
 * Metrics and monitoring utilities for DevFS watcher
 * Tracks: fallback events, performance, and event frequency
 */

export interface WatcherMetrics {
  totalEvents: number;
  fallbackCount: number;
  incrementalSuccessCount: number;
  incrementalFailureCount: number;
  avgEventProcessingTime: number; // ms
  lastFallbackPath?: string;
  lastFallbackTime?: number;
}

export class WatcherMetricsCollector {
  private metrics: WatcherMetrics = {
    totalEvents: 0,
    fallbackCount: 0,
    incrementalSuccessCount: 0,
    incrementalFailureCount: 0,
    avgEventProcessingTime: 0,
  };

  private eventProcessingTimes: number[] = [];
  private readonly maxStoredTimes = 100; // Keep rolling average of last 100 events

  recordEventStart(): number {
    return performance.now();
  }

  recordEventProcessed(startTime: number, wasFallback: boolean) {
    const duration = performance.now() - startTime;
    this.metrics.totalEvents++;

    if (wasFallback) {
      this.metrics.fallbackCount++;
      this.metrics.lastFallbackTime = Date.now();
    } else {
      this.metrics.incrementalSuccessCount++;
    }

    // Update rolling average
    this.eventProcessingTimes.push(duration);
    if (this.eventProcessingTimes.length > this.maxStoredTimes) {
      this.eventProcessingTimes.shift();
    }

    const sum = this.eventProcessingTimes.reduce((a, b) => a + b, 0);
    this.metrics.avgEventProcessingTime = sum / this.eventProcessingTimes.length;
  }

  recordIncrementalFailure(path: string) {
    this.metrics.incrementalFailureCount++;
    this.metrics.lastFallbackPath = path;
  }

  recordFallback(path: string) {
    this.metrics.lastFallbackPath = path;
    this.metrics.lastFallbackTime = Date.now();
  }

  getMetrics(): WatcherMetrics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      totalEvents: 0,
      fallbackCount: 0,
      incrementalSuccessCount: 0,
      incrementalFailureCount: 0,
      avgEventProcessingTime: 0,
    };
    this.eventProcessingTimes = [];
  }

  logMetrics() {
    const fallbackRate =
      this.metrics.totalEvents > 0
        ? ((this.metrics.fallbackCount / this.metrics.totalEvents) * 100).toFixed(1)
        : '0';
    console.log('[WatcherMetrics]', {
      totalEvents: this.metrics.totalEvents,
      fallbackCount: this.metrics.fallbackCount,
      fallbackRate: `${fallbackRate}%`,
      incrementalSuccess: this.metrics.incrementalSuccessCount,
      incrementalFailure: this.metrics.incrementalFailureCount,
      avgProcessingTimeMs: this.metrics.avgEventProcessingTime.toFixed(2),
      lastFallbackPath: this.metrics.lastFallbackPath,
    });
  }
}

export const watcherMetricsCollector = new WatcherMetricsCollector();
