import { describe, it, expect, beforeEach } from 'vitest';
import { watcherMetricsCollector, WatcherMetrics } from '../services/watcherMetrics';

describe('Watcher Metrics Collection', () => {
  beforeEach(() => {
    watcherMetricsCollector.reset();
  });

  it('tracks event processing time', () => {
    const startTime = watcherMetricsCollector.recordEventStart();

    // Simulate some work
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }

    watcherMetricsCollector.recordEventProcessed(startTime, false);

    const metrics = watcherMetricsCollector.getMetrics();
    expect(metrics.totalEvents).toBe(1);
    expect(metrics.incrementalSuccessCount).toBe(1);
    expect(metrics.avgEventProcessingTime).toBeGreaterThan(0);
  });

  it('counts fallback events correctly', () => {
    // Record 10 events: 3 fallbacks, 7 incremental
    for (let i = 0; i < 10; i++) {
      const startTime = watcherMetricsCollector.recordEventStart();
      watcherMetricsCollector.recordEventProcessed(startTime, i < 3); // First 3 are fallbacks
    }

    const metrics = watcherMetricsCollector.getMetrics();
    expect(metrics.totalEvents).toBe(10);
    expect(metrics.fallbackCount).toBe(3);
    expect(metrics.incrementalSuccessCount).toBe(7);
  });

  it('maintains rolling average of processing times', () => {
    // Record events with varying processing times
    const recordedTimes: number[] = [];

    for (let i = 0; i < 5; i++) {
      const startTime = performance.now() - (i + 1); // Simulate different durations
      watcherMetricsCollector.recordEventProcessed(startTime, false);
      recordedTimes.push(performance.now() - (i + 1));
    }

    const metrics = watcherMetricsCollector.getMetrics();
    expect(metrics.totalEvents).toBe(5);
    expect(metrics.avgEventProcessingTime).toBeGreaterThan(0);
  });

  it('tracks last fallback path', () => {
    watcherMetricsCollector.recordIncrementalFailure('/projects/project1');

    let metrics = watcherMetricsCollector.getMetrics();
    expect(metrics.lastFallbackPath).toBe('/projects/project1');

    watcherMetricsCollector.recordFallback('/projects/project2');

    metrics = watcherMetricsCollector.getMetrics();
    expect(metrics.lastFallbackPath).toBe('/projects/project2');
  });

  it('calculates fallback rate correctly', () => {
    // Simulate 100 events with 25 fallbacks
    for (let i = 0; i < 100; i++) {
      const startTime = watcherMetricsCollector.recordEventStart();
      watcherMetricsCollector.recordEventProcessed(startTime, i < 25); // First 25 are fallbacks
    }

    const metrics = watcherMetricsCollector.getMetrics();
    const fallbackRate = (metrics.fallbackCount / metrics.totalEvents) * 100;

    expect(metrics.fallbackCount).toBe(25);
    expect(fallbackRate).toBe(25);
  });

  it('resets metrics correctly', () => {
    // Record some events
    for (let i = 0; i < 5; i++) {
      const startTime = watcherMetricsCollector.recordEventStart();
      watcherMetricsCollector.recordEventProcessed(startTime, false);
    }

    let metrics = watcherMetricsCollector.getMetrics();
    expect(metrics.totalEvents).toBe(5);

    // Reset
    watcherMetricsCollector.reset();

    metrics = watcherMetricsCollector.getMetrics();
    expect(metrics.totalEvents).toBe(0);
    expect(metrics.fallbackCount).toBe(0);
    expect(metrics.incrementalSuccessCount).toBe(0);
    expect(metrics.avgEventProcessingTime).toBe(0);
  });

  it('logs metrics without throwing', () => {
    // Record some events
    for (let i = 0; i < 10; i++) {
      const startTime = watcherMetricsCollector.recordEventStart();
      watcherMetricsCollector.recordEventProcessed(startTime, i < 2);
    }

    // This should not throw
    expect(() => {
      watcherMetricsCollector.logMetrics();
    }).not.toThrow();
  });

  it('provides metrics snapshot', () => {
    // Record some events
    for (let i = 0; i < 5; i++) {
      const startTime = watcherMetricsCollector.recordEventStart();
      watcherMetricsCollector.recordEventProcessed(startTime, false);
    }

    const metrics = watcherMetricsCollector.getMetrics();

    // Verify all fields are present
    expect(metrics).toHaveProperty('totalEvents');
    expect(metrics).toHaveProperty('fallbackCount');
    expect(metrics).toHaveProperty('incrementalSuccessCount');
    expect(metrics).toHaveProperty('incrementalFailureCount');
    expect(metrics).toHaveProperty('avgEventProcessingTime');

    // Verify it's a snapshot (immutable)
    const metricsSnapshot = watcherMetricsCollector.getMetrics();
    const initialTotal = metricsSnapshot.totalEvents;

    // Record another event
    const startTime = watcherMetricsCollector.recordEventStart();
    watcherMetricsCollector.recordEventProcessed(startTime, false);

    // Old snapshot should not change
    expect(metricsSnapshot.totalEvents).toBe(initialTotal);
  });
});
