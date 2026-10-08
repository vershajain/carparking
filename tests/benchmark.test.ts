import { describe, it, expect } from 'vitest';
import {
  runHeadToHeadBenchmark,
  PRESET_SCENARIOS,
  generateScenarioTrace,
  createBenchmarkSlots,
} from '../src/core/benchmark';

describe('Performance Benchmark & Head-to-Head Simulation', () => {
  it('Scenario 1: Low Demand Workload produces valid metrics with low contention', () => {
    const result = runHeadToHeadBenchmark('LOW_DEMAND');
    expect(result.scenario.id).toBe('LOW_DEMAND');
    expect(result.fcfsMetrics.totalVehiclesEnqueued).toBe(16);
    expect(result.adaptiveMetrics.totalVehiclesEnqueued).toBe(16);
    expect(result.fcfsMetrics.totalVehiclesServed).toBe(16);
    expect(result.adaptiveMetrics.totalVehiclesServed).toBe(16);

    // Both should maintain near-zero wait times under sparse demand
    expect(result.adaptiveMetrics.avgWaitTime).toBeLessThanOrEqual(5);
    expect(result.fcfsMetrics.avgWaitTime).toBeLessThanOrEqual(5);
    expect(result.verdictSummary).toContain('Low Demand Workload');
  });

  it('Scenario 2: High Demand Workload shows Adaptive reducing max wait & starvation', () => {
    const result = runHeadToHeadBenchmark('HIGH_DEMAND');
    expect(result.scenario.id).toBe('HIGH_DEMAND');
    expect(result.trace.length).toBe(36);

    // Under high contention rush hour, Adaptive dynamically ages processes
    // and bounds wait times compared to FCFS
    expect(result.adaptiveMetrics.avgWaitTime).toBeLessThan(result.fcfsMetrics.avgWaitTime);
    expect(result.adaptiveMetrics.maxWaitTime).toBeLessThan(result.fcfsMetrics.maxWaitTime);
    expect(result.adaptiveMetrics.starvationCount).toBeLessThanOrEqual(result.fcfsMetrics.starvationCount);

    // Verification of delta calculation
    expect(result.deltas.avgWaitTime.improved).toBe(true);
    expect(result.deltas.avgWaitTime.deltaPct).toBeGreaterThan(0);
  });

  it('Scenario 3: Emergency-Heavy Workload significantly accelerates emergency response time', () => {
    const result = runHeadToHeadBenchmark('EMERGENCY_HEAVY');
    expect(result.scenario.id).toBe('EMERGENCY_HEAVY');
    expect(result.fcfsMetrics.emergencyVehicleCount).toBe(7);
    expect(result.adaptiveMetrics.emergencyVehicleCount).toBe(7);

    // In FCFS, ambulances wait behind ordinary cars in FIFO order
    // In Adaptive, urgency factor U=100 preempts immediately!
    expect(result.adaptiveMetrics.emergencyResponseTime).toBeLessThan(result.fcfsMetrics.emergencyResponseTime);
    expect(result.deltas.emergencyResponseTime.improved).toBe(true);
    // Improvement should be dramatic (>50%)
    expect(result.deltas.emergencyResponseTime.deltaPct).toBeGreaterThan(25);
  });

  it('Scenario 4: Reservation-Heavy Workload handles 10-minute grace expiry deterministically', () => {
    const result = runHeadToHeadBenchmark('RESERVATION_HEAVY');
    expect(result.scenario.id).toBe('RESERVATION_HEAVY');

    // Both engines should identify no-shows where arrival time > reservationGraceExpiresAt
    expect(result.adaptiveMetrics.expiredReservationCount).toBeGreaterThan(0);
    expect(result.fcfsMetrics.expiredReservationCount).toBeGreaterThan(0);
    expect(result.adaptiveMetrics.reservationTotal).toBe(18);
  });

  it('Scenario 5: Mixed Duration Workload favors high turnover short jobs via factor V', () => {
    const result = runHeadToHeadBenchmark('MIXED_DURATION');
    expect(result.scenario.id).toBe('MIXED_DURATION');
    expect(result.trace.length).toBe(32);

    // Short-job turnover factor V accelerates vehicle servicing
    expect(result.adaptiveMetrics.avgWaitTime).toBeLessThanOrEqual(result.fcfsMetrics.avgWaitTime);
    expect(result.verdictSummary).toContain('Mixed Duration Workload');
  });

  it('Invariants: Timeline metrics and queue curve points are generated for charts', () => {
    const result = runHeadToHeadBenchmark('HIGH_DEMAND');
    expect(result.timeline.length).toBeGreaterThan(25);
    expect(result.queueWaitCurve.length).toBe(result.trace.length);

    // Verify timeline utilization stays within [0, 100]
    for (const point of result.timeline) {
      expect(point.fcfsUtilization).toBeGreaterThanOrEqual(0);
      expect(point.fcfsUtilization).toBeLessThanOrEqual(100);
      expect(point.adaptiveUtilization).toBeGreaterThanOrEqual(0);
      expect(point.adaptiveUtilization).toBeLessThanOrEqual(100);
    }
  });
});
