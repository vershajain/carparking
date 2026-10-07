// OS-Inspired Smart Parking Resource Scheduler Engine
// Strictly rule-based, deterministic OS process and resource allocation algorithm

import {
  VehiclePCB,
  ParkingSlotResource,
  SchedulerConfig,
  ScoreBreakdown,
  CandidateSlotScore,
  SchedulingDecision,
  AuditLogEntry,
  VehicleCategory,
  SlotState,
} from './types';

export const DEFAULT_CONFIG: SchedulerConfig = {
  demandThreshold: 50, // 50% threshold for Low vs High Demand
  weightsLow: {
    w: 0.35,
    u: 0.20,
    r: 0.15,
    f: 0.25,
    v: 0.05,
  },
  weightsHigh: {
    w: 0.20,
    u: 0.35,
    r: 0.15,
    f: 0.20,
    v: 0.10,
  },
  reservationGracePeriod: 10, // 10 minutes strict grace period
  overstayGracePeriod: 5,     // 5 minutes overstay buffer
  fineRatePerMinute: 10,      // ₹10 per minute
  maxTurnoverReference: 240,  // 4 hours (240 mins) base reference for turnover normalization
  autoScheduleOnTick: true,
};

// Urgency mapping [0, 100] as specified in OS scheduling pipeline
export const CATEGORY_URGENCY_MAP: Record<VehicleCategory, number> = {
  AMBULANCE: 100,
  FIRE_TRUCK: 95,
  POLICE: 90,
  VIP: 70,
  DISABLED: 65,
  NORMAL: 40,
};

/**
 * Step 1: Demand Classification (Zone Congestion)
 * Demand (%) = (Waiting Vehicles / Available Suitable Slots) * 100
 * If Available Slots == 0, Demand = 100%.
 */
export function calculateSystemDemand(
  waitingVehiclesCount: number,
  availableSlotsCount: number
): { demandPercent: number; isHighDemand: boolean } {
  if (availableSlotsCount === 0) {
    return { demandPercent: 100, isHighDemand: true };
  }
  const ratio = (waitingVehiclesCount / availableSlotsCount) * 100;
  const demandPercent = Math.min(100, Math.round(ratio * 10) / 10);
  return {
    demandPercent,
    isHighDemand: demandPercent >= DEFAULT_CONFIG.demandThreshold,
  };
}

/**
 * Calculate per-zone demand for slot scoring
 */
export function calculateZoneDemand(
  zone: string,
  waitingVehicles: VehiclePCB[],
  slots: ParkingSlotResource[]
): number {
  const zoneSlots = slots.filter((s) => s.zone === zone);
  const freeSlots = zoneSlots.filter((s) => s.state === 'FREE');

  if (freeSlots.length === 0) {
    return 100;
  }

  // Waiting vehicles that could fit in this zone
  const waitingCount = waitingVehicles.length;
  const ratio = (waitingCount / freeSlots.length) * 100;
  return Math.min(100, Math.round(ratio * 10) / 10);
}

/**
 * Step 2: Calculate Dynamic Priority Score (P) for a vehicle
 * W (Waiting Time): Min-max normalized based on current max wait time in ready queue.
 * U (Urgency / Category): 100 (Ambulance) down to 40 (Normal)
 * R (Reservation): 100 if active valid reservation, 0 otherwise
 * F (Fairness / Aging): Increments by +10 (capped at 100) every cycle skipped
 * V (Duration / Turnover): High score for short parking durations, lower for long stays
 */
export function computeVehiclePriorityScore(
  vehicle: VehiclePCB,
  currentClock: number,
  maxWaitInQueue: number,
  isHighDemand: boolean,
  config: SchedulerConfig = DEFAULT_CONFIG
): ScoreBreakdown {
  const rawWait = Math.max(0, currentClock - vehicle.arrivalTime);

  // W: Normalized waiting time [0, 100]
  const w = maxWaitInQueue > 0 ? Math.min(100, (rawWait / maxWaitInQueue) * 100) : 0;

  // U: Urgency from predefined OS process classification
  const u = CATEGORY_URGENCY_MAP[vehicle.category] ?? 40;

  // R: Active reservation bonus
  const isReservationValid =
    vehicle.hasReservation &&
    vehicle.reservationStartTime !== null &&
    currentClock >= vehicle.reservationStartTime &&
    (vehicle.reservationGraceExpiresAt === null || currentClock <= vehicle.reservationGraceExpiresAt);
  const r = isReservationValid ? 100 : 0;

  // F: Fairness / Aging accumulator (capped at 100)
  const f = Math.min(100, Math.max(0, vehicle.agingCycles));

  // V: Duration / Turnover score [0, 100]
  // Short burst = higher turnover = higher score (SJF principle in OS scheduling)
  const duration = vehicle.expectedDuration;
  const v = Math.max(
    0,
    Math.min(100, 100 - (duration / config.maxTurnoverReference) * 100)
  );

  const formulaType = isHighDemand ? 'P_H' : 'P_L';
  const weights = isHighDemand ? config.weightsHigh : config.weightsLow;

  const wTerm = weights.w * w;
  const uTerm = weights.u * u;
  const rTerm = weights.r * r;
  const fTerm = weights.f * f;
  const vTerm = weights.v * v;

  const totalScore = Math.round((wTerm + uTerm + rTerm + fTerm + vTerm) * 100) / 100;

  const formattedString = `${formulaType} = ${weights.w.toFixed(2)}(W:${w.toFixed(1)}) + ${weights.u.toFixed(2)}(U:${u.toFixed(0)}) + ${weights.r.toFixed(2)}(R:${r.toFixed(0)}) + ${weights.f.toFixed(2)}(F:${f.toFixed(0)}) + ${weights.v.toFixed(2)}(V:${v.toFixed(1)}) = ${totalScore.toFixed(2)}`;

  return {
    factors: {
      w: Math.round(w * 10) / 10,
      u,
      r,
      f,
      v: Math.round(v * 10) / 10,
    },
    rawWaitMinutes: rawWait,
    maxWaitInQueue,
    durationMinutes: duration,
    formulaType,
    weights,
    terms: {
      wTerm: Math.round(wTerm * 100) / 100,
      uTerm: Math.round(uTerm * 100) / 100,
      rTerm: Math.round(rTerm * 100) / 100,
      fTerm: Math.round(fTerm * 100) / 100,
      vTerm: Math.round(vTerm * 100) / 100,
    },
    totalScore,
    formattedString,
  };
}

/**
 * Hard Filter for Candidate Slots:
 * Prune slots incompatible with vehicle constraints
 */
export function isSlotCompatible(
  slot: ParkingSlotResource,
  vehicle: VehiclePCB
): { compatible: boolean; reason?: string } {
  // If slot is under maintenance
  if (slot.state === 'MAINTENANCE') {
    return { compatible: false, reason: 'Slot under maintenance' };
  }

  // If slot is occupied
  if (slot.state === 'OCCUPIED' && slot.currentVehicleId !== vehicle.id) {
    return { compatible: false, reason: 'Slot currently occupied' };
  }

  // If slot is reserved for someone else
  if (slot.state === 'RESERVED' && slot.reservedForVehicleId && slot.reservedForVehicleId !== vehicle.id) {
    return { compatible: false, reason: 'Reserved for another vehicle' };
  }

  // EV Constraint: EV requires EV slot
  if (vehicle.isEV && slot.type !== 'EV_CHARGER') {
    return { compatible: false, reason: 'Vehicle requires EV Charger slot' };
  }

  // Accessibility Constraint: Disabled category requires Accessible slot
  if (vehicle.needsAccessible && slot.type !== 'ACCESSIBLE') {
    return { compatible: false, reason: 'Vehicle requires Wheelchair Accessible slot' };
  }

  return { compatible: true };
}

/**
 * Slot Fit Score [0, 100]:
 * Best-Fit heuristic preventing standard cars from squandering scarce EV / Accessible slots
 */
export function calculateSlotFitScore(
  slot: ParkingSlotResource,
  vehicle: VehiclePCB
): { score: number; reason: string } {
  if (vehicle.isEV && slot.type === 'EV_CHARGER') {
    return { score: 100, reason: 'Exact EV charger match' };
  }
  if (vehicle.needsAccessible && slot.type === 'ACCESSIBLE') {
    return { score: 100, reason: 'Exact Accessible stall match' };
  }
  if (vehicle.category === 'VIP' && slot.type === 'VIP') {
    return { score: 100, reason: 'Dedicated VIP bay' };
  }
  if (!vehicle.isEV && !vehicle.needsAccessible && slot.type === 'STANDARD') {
    return { score: 100, reason: 'Standard vehicle in standard slot' };
  }
  // Penalize non-EV taking EV slot
  if (!vehicle.isEV && slot.type === 'EV_CHARGER') {
    return { score: 30, reason: 'Suboptimal: Non-EV occupying EV charging resource' };
  }
  // Penalize non-disabled taking Accessible slot
  if (!vehicle.needsAccessible && slot.type === 'ACCESSIBLE') {
    return { score: 20, reason: 'Suboptimal: Consuming reserved accessibility slot' };
  }
  return { score: 80, reason: 'Compatible general assignment' };
}

/**
 * Step 3: Slot Suitability Score
 * Slot Score = 0.40 * (100 - Normalized Distance) + 0.30 * (100 - Zone Demand) + 0.30 * Slot Fit Score
 */
export function scoreCandidateSlot(
  slot: ParkingSlotResource,
  vehicle: VehiclePCB,
  zoneDemand: number,
  maxDistance: number = 100
): CandidateSlotScore {
  const normalizedDistance = Math.min(100, Math.max(0, (slot.distance / maxDistance) * 100));
  const distanceScore = 100 - normalizedDistance;
  const demandScore = 100 - zoneDemand;
  const fit = calculateSlotFitScore(slot, vehicle);

  const totalScore =
    Math.round((0.40 * distanceScore + 0.30 * demandScore + 0.30 * fit.score) * 100) / 100;

  return {
    slotId: slot.id,
    zone: slot.zone,
    type: slot.type,
    distance: slot.distance,
    normalizedDistance: Math.round(normalizedDistance * 10) / 10,
    zoneDemand: Math.round(zoneDemand * 10) / 10,
    slotFitScore: fit.score,
    totalScore,
    reasons: [
      `Distance component: 0.40 × (100 - ${normalizedDistance.toFixed(1)}) = ${(0.40 * distanceScore).toFixed(1)}`,
      `Zone demand component: 0.30 × (100 - ${zoneDemand.toFixed(1)}%) = ${(0.30 * demandScore).toFixed(1)}`,
      `Fit component: 0.30 × ${fit.score} = ${(0.30 * fit.score).toFixed(1)} (${fit.reason})`,
    ],
    chosen: false,
  };
}

/**
 * Run a single scheduling cycle across Ready Queue and Free Slots
 */
export function runSchedulerCycle(
  currentClock: number,
  cycleNumber: number,
  vehicles: VehiclePCB[],
  slots: ParkingSlotResource[],
  config: SchedulerConfig = DEFAULT_CONFIG
): {
  decision: SchedulingDecision | null;
  updatedVehicles: VehiclePCB[];
  updatedSlots: ParkingSlotResource[];
  logs: AuditLogEntry[];
} {
  const readyVehicles = vehicles.filter((v) => v.state === 'READY');
  const logs: AuditLogEntry[] = [];

  if (readyVehicles.length === 0) {
    return {
      decision: null,
      updatedVehicles: vehicles,
      updatedSlots: slots,
      logs,
    };
  }

  // Find max wait in queue
  const waits = readyVehicles.map((v) => Math.max(0, currentClock - v.arrivalTime));
  const maxWaitInQueue = Math.max(1, ...waits);

  // Available free slots
  const availableSlots = slots.filter((s) => s.state === 'FREE');
  const { demandPercent, isHighDemand } = calculateSystemDemand(
    readyVehicles.length,
    availableSlots.length
  );

  const demandCondition = isHighDemand ? 'HIGH DEMAND' : 'LOW DEMAND';
  const formulaUsed = isHighDemand ? 'P_H' : 'P_L';

  // Evaluate scores for all ready vehicles
  const evaluatedVehicles = readyVehicles.map((v) => {
    const breakdown = computeVehiclePriorityScore(v, currentClock, maxWaitInQueue, isHighDemand, config);
    return {
      vehicle: { ...v, lastScoreBreakdown: breakdown },
      score: breakdown.totalScore,
    };
  });

  // Sort descending by priority score (FIFO tie breaker: arrival time)
  evaluatedVehicles.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.vehicle.arrivalTime - b.vehicle.arrivalTime;
  });

  const readyQueueRanking = evaluatedVehicles.map((ev) => ({
    vehicleId: ev.vehicle.id,
    score: ev.score,
    category: ev.vehicle.category,
  }));

  // Attempt allocation for top-ranked vehicle
  const topCandidate = evaluatedVehicles[0];
  const topVehicle = topCandidate.vehicle;

  // Max distance reference across slots
  const maxDist = Math.max(...slots.map((s) => s.distance), 100);

  // Filter and score candidate slots for top vehicle
  const candidateScores: CandidateSlotScore[] = [];

  for (const slot of slots) {
    const comp = isSlotCompatible(slot, topVehicle);
    if (comp.compatible && (slot.state === 'FREE' || slot.reservedForVehicleId === topVehicle.id)) {
      const zDemand = calculateZoneDemand(slot.zone, readyVehicles, slots);
      const scoreObj = scoreCandidateSlot(slot, topVehicle, zDemand, maxDist);
      candidateScores.push(scoreObj);
    }
  }

  // Sort candidate slots descending by total suitability score
  candidateScores.sort((a, b) => b.totalScore - a.totalScore);

  let assignedSlotId: string | null = null;
  let rationale = '';

  const newVehicles = [...vehicles];
  const newSlots = [...slots];

  if (candidateScores.length > 0) {
    const bestSlot = candidateScores[0];
    bestSlot.chosen = true;
    assignedSlotId = bestSlot.slotId;

    rationale = `Allocated ${topVehicle.id} (${topVehicle.category}) to slot ${bestSlot.slotId} with suitability score ${bestSlot.totalScore} in ${bestSlot.zone}. Process Priority: ${topCandidate.score} (${demandCondition} formula ${formulaUsed}).`;

    // Update vehicle to ALLOCATED / PARKED
    const vIndex = newVehicles.findIndex((v) => v.id === topVehicle.id);
    if (vIndex !== -1) {
      newVehicles[vIndex] = {
        ...topVehicle,
        state: 'PARKED',
        allocatedSlotId: bestSlot.slotId,
        actualParkStartTime: currentClock,
        expectedExitTime: currentClock + topVehicle.expectedDuration,
      };
    }

    // Update slot to OCCUPIED
    const sIndex = newSlots.findIndex((s) => s.id === bestSlot.slotId);
    if (sIndex !== -1) {
      newSlots[sIndex] = {
        ...newSlots[sIndex],
        state: 'OCCUPIED',
        currentVehicleId: topVehicle.id,
        occupiedSince: currentClock,
        expectedReleaseTime: currentClock + topVehicle.expectedDuration,
        totalVehiclesServed: newSlots[sIndex].totalVehiclesServed + 1,
      };
    }

    logs.push({
      id: `log-${currentClock}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: currentClock,
      cycle: cycleNumber,
      vehicleId: topVehicle.id,
      slotId: bestSlot.slotId,
      eventType: 'ALLOCATION',
      severity: 'success',
      message: `[ALLOCATION] Process ${topVehicle.id} [${topVehicle.category}] allocated to Resource ${bestSlot.slotId} (Score: ${bestSlot.totalScore})`,
    });

    // Aging: increment agingCycles (+10, capped at 100) for all skipped ready vehicles
    for (let i = 0; i < newVehicles.length; i++) {
      if (newVehicles[i].state === 'READY' && newVehicles[i].id !== topVehicle.id) {
        const oldAging = newVehicles[i].agingCycles;
        const newAging = Math.min(100, oldAging + 10);
        newVehicles[i] = {
          ...newVehicles[i],
          agingCycles: newAging,
        };

        if (newAging >= 100 && oldAging < 100) {
          logs.push({
            id: `log-aging-${currentClock}-${newVehicles[i].id}`,
            timestamp: currentClock,
            cycle: cycleNumber,
            vehicleId: newVehicles[i].id,
            slotId: null,
            eventType: 'STARVATION_RESOLVED',
            severity: 'warning',
            message: `[STARVATION AGING] Process ${newVehicles[i].id} reached max fairness aging (F=100) to prevent starvation.`,
          });
        }
      }
    }
  } else {
    rationale = `Top vehicle ${topVehicle.id} (${topVehicle.category}, Score: ${topCandidate.score}) could not be allocated: no compatible free slots currently available. Waiting in ready queue.`;
  }

  const decision: SchedulingDecision = {
    timestamp: currentClock,
    cycleNumber,
    demandCondition,
    formulaUsed,
    selectedVehicleId: topVehicle.id,
    selectedVehicleCategory: topVehicle.category,
    vehiclePriorityScore: topCandidate.score,
    queueSizeAtDecision: readyVehicles.length,
    readyQueueRanking,
    candidateSlots: candidateScores,
    assignedSlotId,
    rationale,
  };

  return {
    decision,
    updatedVehicles: newVehicles,
    updatedSlots: newSlots,
    logs,
  };
}

/**
 * Handle Time Tick:
 * - Update waiting times
 * - Check reservation 10-minute grace period expiry
 * - Check vehicle overstay and compute fines
 * - Check vehicle expected exit and release completed vehicles
 */
export function processClockTick(
  currentClock: number,
  vehicles: VehiclePCB[],
  slots: ParkingSlotResource[],
  config: SchedulerConfig = DEFAULT_CONFIG
): {
  updatedVehicles: VehiclePCB[];
  updatedSlots: ParkingSlotResource[];
  logs: AuditLogEntry[];
} {
  const updatedVehicles = [...vehicles];
  const updatedSlots = [...slots];
  const logs: AuditLogEntry[] = [];

  // 1. Check reservation grace period expiration (Strict 10-min rule)
  // If slot is RESERVED and clock > reservationExpiresAt, auto-release slot to FREE
  for (let i = 0; i < updatedSlots.length; i++) {
    const slot = updatedSlots[i];
    if (slot.state === 'RESERVED' && slot.reservationExpiresAt !== null) {
      if (currentClock > slot.reservationExpiresAt) {
        const reservedVid = slot.reservedForVehicleId;
        updatedSlots[i] = {
          ...slot,
          state: 'FREE',
          reservedForVehicleId: null,
          reservationExpiresAt: null,
        };

        // Cancel the vehicle's reservation if still waiting
        if (reservedVid) {
          const vIdx = updatedVehicles.findIndex((v) => v.id === reservedVid);
          if (vIdx !== -1 && updatedVehicles[vIdx].state === 'READY') {
            updatedVehicles[vIdx] = {
              ...updatedVehicles[vIdx],
              hasReservation: false,
              state: 'CANCELLED',
            };
          }
        }

        logs.push({
          id: `log-res-exp-${currentClock}-${slot.id}`,
          timestamp: currentClock,
          cycle: currentClock,
          vehicleId: reservedVid,
          slotId: slot.id,
          eventType: 'RESERVATION_EXPIRED',
          severity: 'warning',
          message: `[RESERVATION EXPIRED] 10-min grace period elapsed for ${slot.id}. Resource auto-released to FREE.`,
        });
      }
    }
  }

  // 2. Check Overstay & Fines for parked vehicles
  // Track expected_exit_time vs actual_exit_time.
  // If clock > expected_exit_time + overstay_grace_period: Fine = (Overstay Minutes) * Fine Rate
  for (let i = 0; i < updatedVehicles.length; i++) {
    const v = updatedVehicles[i];
    if (v.state === 'PARKED' || v.state === 'OVERSTAY') {
      if (v.expectedExitTime !== null) {
        const overstayMinutes = currentClock - v.expectedExitTime;
        if (overstayMinutes > config.overstayGracePeriod) {
          const fine = overstayMinutes * config.fineRatePerMinute;
          const wasParked = v.state === 'PARKED';
          updatedVehicles[i] = {
            ...v,
            state: 'OVERSTAY',
            fineIncurred: fine,
          };

          if (wasParked) {
            logs.push({
              id: `log-overstay-${currentClock}-${v.id}`,
              timestamp: currentClock,
              cycle: currentClock,
              vehicleId: v.id,
              slotId: v.allocatedSlotId,
              eventType: 'OVERSTAY_ALERT',
              severity: 'error',
              message: `[OVERSTAY VIOLATION] Process ${v.id} exceeded burst time + ${config.overstayGracePeriod}m grace! Accruing fine @ ₹${config.fineRatePerMinute}/min.`,
            });
          }
        }
      }
    }
  }

  return {
    updatedVehicles,
    updatedSlots,
    logs,
  };
}

/**
 * Handle Process Completion / Early Departure
 */
export function releaseVehicleFromSlot(
  vehicleId: string,
  currentClock: number,
  vehicles: VehiclePCB[],
  slots: ParkingSlotResource[]
): {
  updatedVehicles: VehiclePCB[];
  updatedSlots: ParkingSlotResource[];
  log: AuditLogEntry | null;
} {
  const vIdx = vehicles.findIndex((v) => v.id === vehicleId);
  if (vIdx === -1) {
    return { updatedVehicles: vehicles, updatedSlots: slots, log: null };
  }

  const v = vehicles[vIdx];
  const slotId = v.allocatedSlotId;

  const newVehicles = [...vehicles];
  const newSlots = [...slots];

  newVehicles[vIdx] = {
    ...v,
    state: 'COMPLETED',
    actualExitTime: currentClock,
    allocatedSlotId: null,
  };

  if (slotId) {
    const sIdx = newSlots.findIndex((s) => s.id === slotId);
    if (sIdx !== -1) {
      newSlots[sIdx] = {
        ...newSlots[sIdx],
        state: 'FREE',
        currentVehicleId: null,
        occupiedSince: null,
        expectedReleaseTime: null,
      };
    }
  }

  const log: AuditLogEntry = {
    id: `log-rel-${currentClock}-${vehicleId}`,
    timestamp: currentClock,
    cycle: currentClock,
    vehicleId,
    slotId,
    eventType: 'RELEASE',
    severity: 'info',
    message: `[RELEASE] Process ${vehicleId} terminated execution and exited slot ${slotId || 'N/A'}. Resource freed.`,
  };

  return {
    updatedVehicles: newVehicles,
    updatedSlots: newSlots,
    log,
  };
}

/**
 * Calculate Estimated Waiting Time (EWT) on Full Capacity
 * EWT = min(Occupied Slots' Expected Release Times) - Current Time
 */
export function calculateEWT(
  currentClock: number,
  slots: ParkingSlotResource[]
): { ewtMinutes: number; nextSlotId: string | null } {
  const occupiedSlots = slots.filter(
    (s) => s.state === 'OCCUPIED' && s.expectedReleaseTime !== null
  );

  if (occupiedSlots.length === 0) {
    return { ewtMinutes: 0, nextSlotId: null };
  }

  let minReleaseTime = Infinity;
  let nextSlotId: string | null = null;

  for (const s of occupiedSlots) {
    if (s.expectedReleaseTime !== null && s.expectedReleaseTime < minReleaseTime) {
      minReleaseTime = s.expectedReleaseTime;
      nextSlotId = s.id;
    }
  }

  const ewtMinutes = Math.max(0, minReleaseTime - currentClock);
  return { ewtMinutes, nextSlotId };
}
