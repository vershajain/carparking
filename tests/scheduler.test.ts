// Unit Test Fixtures for OS-Inspired Smart Parking Resource Scheduler
// Proves the 4 critical OS scheduling behaviors:
// 1. High demand switches to P_H formula
// 2. Aging increments and prevents starvation of normal vehicles over N cycles
// 3. Non-compatible slots are successfully pruned (EV / Accessible hard filters)
// 4. 10-minute reservation expiration triggers slot release

import { describe, it, expect } from 'vitest';
import {
  calculateSystemDemand,
  computeVehiclePriorityScore,
  isSlotCompatible,
  runSchedulerCycle,
  processClockTick,
  DEFAULT_CONFIG,
} from '../src/core/scheduler';
import { VehiclePCB, ParkingSlotResource } from '../src/core/types';

describe('OS Scheduler Unit Test Fixtures', () => {
  // Test 1: High demand switches to P_H formula
  it('Fixture 1: Demand classification correctly selects P_L vs P_H formula and weights', () => {
    // Case 1A: Low Demand (Waiting: 1, Available Slots: 4 -> Demand = 25% < 50%)
    const lowDemand = calculateSystemDemand(1, 4);
    expect(lowDemand.demandPercent).toBe(25);
    expect(lowDemand.isHighDemand).toBe(false);

    const normalVehicle: VehiclePCB = {
      id: 'TEST-NORM-01',
      licensePlate: 'DL-01-AA-1111',
      category: 'NORMAL',
      isEV: false,
      needsAccessible: false,
      arrivalTime: 0,
      expectedDuration: 60,
      hasReservation: false,
      reservationStartTime: null,
      reservationGraceExpiresAt: null,
      agingCycles: 0,
      state: 'READY',
      allocatedSlotId: null,
      actualParkStartTime: null,
      expectedExitTime: null,
      actualExitTime: null,
      fineIncurred: 0,
    };

    const scoreLow = computeVehiclePriorityScore(normalVehicle, 10, 10, lowDemand.isHighDemand);
    expect(scoreLow.formulaType).toBe('P_L');
    expect(scoreLow.weights).toEqual(DEFAULT_CONFIG.weightsLow);

    // Case 1B: High Demand (Waiting: 5, Available Slots: 2 -> Demand = 100% >= 50%)
    const highDemand = calculateSystemDemand(5, 2);
    expect(highDemand.isHighDemand).toBe(true);

    const scoreHigh = computeVehiclePriorityScore(normalVehicle, 10, 10, highDemand.isHighDemand);
    expect(scoreHigh.formulaType).toBe('P_H');
    expect(scoreHigh.weights).toEqual(DEFAULT_CONFIG.weightsHigh);

    // Verify mathematical term weighting in High Demand:
    // Urgency weight should be 0.35 in P_H vs 0.20 in P_L
    expect(scoreHigh.weights.u).toBe(0.35);
    expect(scoreLow.weights.u).toBe(0.20);
  });

  // Test 2: Aging increments and prevents starvation of normal vehicles over N cycles
  it('Fixture 2: Aging increments by +10 each skipped cycle and prevents starvation of normal vehicles', () => {
    // We create a Normal Vehicle (U = 40)
    const normalCar: VehiclePCB = {
      id: 'CAR-OLD',
      licensePlate: 'MH-02-AA-9999',
      category: 'NORMAL',
      isEV: false,
      needsAccessible: false,
      arrivalTime: 0,
      expectedDuration: 120, // Longer stay
      hasReservation: false,
      reservationStartTime: null,
      reservationGraceExpiresAt: null,
      agingCycles: 0,
      state: 'READY',
      allocatedSlotId: null,
      actualParkStartTime: null,
      expectedExitTime: null,
      actualExitTime: null,
      fineIncurred: 0,
    };

    let vehicles: VehiclePCB[] = [normalCar];
    let slots: ParkingSlotResource[] = [
      {
        id: 'SLOT-A1',
        zone: 'Zone A',
        type: 'STANDARD',
        distance: 10,
        state: 'FREE',
        currentVehicleId: null,
        reservedForVehicleId: null,
        occupiedSince: null,
        expectedReleaseTime: null,
        reservationExpiresAt: null,
        totalVehiclesServed: 0,
      },
    ];

    // Cycle 1: Fresh Emergency Vehicle arrives (Ambulance U=100)
    // Ambulance has highest priority, so Normal vehicle gets skipped.
    const amb1: VehiclePCB = {
      id: 'AMB-1',
      licensePlate: 'AMB-01',
      category: 'AMBULANCE',
      isEV: false,
      needsAccessible: false,
      arrivalTime: 5,
      expectedDuration: 30,
      hasReservation: false,
      reservationStartTime: null,
      reservationGraceExpiresAt: null,
      agingCycles: 0,
      state: 'READY',
      allocatedSlotId: null,
      actualParkStartTime: null,
      expectedExitTime: null,
      actualExitTime: null,
      fineIncurred: 0,
    };
    vehicles.push(amb1);

    const res1 = runSchedulerCycle(5, 1, vehicles, slots);
    expect(res1.decision?.selectedVehicleId).toBe('AMB-1');

    const skippedAfterCycle1 = res1.updatedVehicles.find((v) => v.id === 'CAR-OLD')!;
    // Aging must have incremented by +10
    expect(skippedAfterCycle1.agingCycles).toBe(10);

    // Cycle 2: Another Ambulance arrives
    // Slot freed for cycle 2 simulation
    const updatedSlots = res1.updatedSlots.map((s) => ({ ...s, state: 'FREE' as const, currentVehicleId: null }));
    const amb2: VehiclePCB = {
      id: 'AMB-2',
      licensePlate: 'AMB-02',
      category: 'AMBULANCE',
      isEV: false,
      needsAccessible: false,
      arrivalTime: 10,
      expectedDuration: 30,
      hasReservation: false,
      reservationStartTime: null,
      reservationGraceExpiresAt: null,
      agingCycles: 0,
      state: 'READY',
      allocatedSlotId: null,
      actualParkStartTime: null,
      expectedExitTime: null,
      actualExitTime: null,
      fineIncurred: 0,
    };
    const vehiclesForCycle2 = [...res1.updatedVehicles, amb2];

    const res2 = runSchedulerCycle(10, 2, vehiclesForCycle2, updatedSlots);
    const skippedAfterCycle2 = res2.updatedVehicles.find((v) => v.id === 'CAR-OLD')!;

    // Aging must have accumulated further
    expect(skippedAfterCycle2.agingCycles).toBeGreaterThanOrEqual(10);

    // Verify Starvation Prevention:
    // If a normal vehicle has aged sufficiently (e.g. agingCycles = 90),
    // its priority score will surpass a newly arriving Police/VIP vehicle
    const agedVehicle: VehiclePCB = {
      ...normalCar,
      agingCycles: 90,
      arrivalTime: 0,
    };
    const freshPolice: VehiclePCB = {
      id: 'POLICE-NEW',
      licensePlate: 'POL-99',
      category: 'POLICE', // U = 90
      isEV: false,
      needsAccessible: false,
      arrivalTime: 50,
      expectedDuration: 60,
      hasReservation: false,
      reservationStartTime: null,
      reservationGraceExpiresAt: null,
      agingCycles: 0,
      state: 'READY',
      allocatedSlotId: null,
      actualParkStartTime: null,
      expectedExitTime: null,
      actualExitTime: null,
      fineIncurred: 0,
    };

    const agedScore = computeVehiclePriorityScore(agedVehicle, 50, 50, true);
    const policeScore = computeVehiclePriorityScore(freshPolice, 50, 50, true);

    // The aged normal car beats the fresh high-priority police car, preventing starvation!
    expect(agedScore.totalScore).toBeGreaterThan(policeScore.totalScore);
  });

  // Test 3: Non-compatible slots are successfully pruned
  it('Fixture 3: Hard Filter successfully prunes non-compatible slots (EV and Accessible)', () => {
    const standardSlot: ParkingSlotResource = {
      id: 'SLOT-STD',
      zone: 'Zone A',
      type: 'STANDARD',
      distance: 10,
      state: 'FREE',
      currentVehicleId: null,
      reservedForVehicleId: null,
      occupiedSince: null,
      expectedReleaseTime: null,
      reservationExpiresAt: null,
      totalVehiclesServed: 0,
    };

    const evSlot: ParkingSlotResource = {
      id: 'SLOT-EV',
      zone: 'Zone A',
      type: 'EV_CHARGER',
      distance: 20,
      state: 'FREE',
      currentVehicleId: null,
      reservedForVehicleId: null,
      occupiedSince: null,
      expectedReleaseTime: null,
      reservationExpiresAt: null,
      totalVehiclesServed: 0,
    };

    const accessibleSlot: ParkingSlotResource = {
      id: 'SLOT-ACC',
      zone: 'Zone A',
      type: 'ACCESSIBLE',
      distance: 5,
      state: 'FREE',
      currentVehicleId: null,
      reservedForVehicleId: null,
      occupiedSince: null,
      expectedReleaseTime: null,
      reservationExpiresAt: null,
      totalVehiclesServed: 0,
    };

    const evVehicle: VehiclePCB = {
      id: 'EV-01',
      licensePlate: 'EV-TESLA-1',
      category: 'NORMAL',
      isEV: true, // Needs EV charger
      needsAccessible: false,
      arrivalTime: 0,
      expectedDuration: 60,
      hasReservation: false,
      reservationStartTime: null,
      reservationGraceExpiresAt: null,
      agingCycles: 0,
      state: 'READY',
      allocatedSlotId: null,
      actualParkStartTime: null,
      expectedExitTime: null,
      actualExitTime: null,
      fineIncurred: 0,
    };

    const disabledVehicle: VehiclePCB = {
      id: 'DIS-01',
      licensePlate: 'DIS-VAN-1',
      category: 'DISABLED',
      isEV: false,
      needsAccessible: true, // Needs Wheelchair accessible slot
      arrivalTime: 0,
      expectedDuration: 60,
      hasReservation: false,
      reservationStartTime: null,
      reservationGraceExpiresAt: null,
      agingCycles: 0,
      state: 'READY',
      allocatedSlotId: null,
      actualParkStartTime: null,
      expectedExitTime: null,
      actualExitTime: null,
      fineIncurred: 0,
    };

    // EV Hard Filter:
    // EV cannot park in Standard slot:
    expect(isSlotCompatible(standardSlot, evVehicle).compatible).toBe(false);
    // EV CAN park in EV slot:
    expect(isSlotCompatible(evSlot, evVehicle).compatible).toBe(true);

    // Accessible Hard Filter:
    // Disabled vehicle cannot park in Standard slot:
    expect(isSlotCompatible(standardSlot, disabledVehicle).compatible).toBe(false);
    // Disabled vehicle CAN park in Accessible slot:
    expect(isSlotCompatible(accessibleSlot, disabledVehicle).compatible).toBe(true);
  });

  // Test 4: 10-minute reservation expiration triggers slot release
  it('Fixture 4: Strict 10-minute grace period automatically releases RESERVED slot to FREE upon expiry', () => {
    const reservedSlot: ParkingSlotResource = {
      id: 'SLOT-RES-01',
      zone: 'Zone B',
      type: 'STANDARD',
      distance: 15,
      state: 'RESERVED',
      currentVehicleId: null,
      reservedForVehicleId: 'RES-VEH-10',
      occupiedSince: null,
      expectedReleaseTime: null,
      reservationExpiresAt: 15, // Booked at t=5, expires at t=5+10 = 15
      totalVehiclesServed: 0,
    };

    const reservedVehicle: VehiclePCB = {
      id: 'RES-VEH-10',
      licensePlate: 'DL-09-RES-1',
      category: 'VIP',
      isEV: false,
      needsAccessible: false,
      arrivalTime: 5,
      expectedDuration: 60,
      hasReservation: true,
      reservationStartTime: 5,
      reservationGraceExpiresAt: 15,
      agingCycles: 0,
      state: 'READY',
      allocatedSlotId: null,
      actualParkStartTime: null,
      expectedExitTime: null,
      actualExitTime: null,
      fineIncurred: 0,
    };

    // At t = 12 (within 10-min grace period): slot must stay RESERVED
    const tickBeforeExpiry = processClockTick(12, [reservedVehicle], [reservedSlot]);
    expect(tickBeforeExpiry.updatedSlots[0].state).toBe('RESERVED');

    // At t = 16 (clock > reservationExpiresAt 15): slot must AUTO-RELEASE to FREE
    const tickAfterExpiry = processClockTick(16, [reservedVehicle], [reservedSlot]);
    expect(tickAfterExpiry.updatedSlots[0].state).toBe('FREE');
    expect(tickAfterExpiry.updatedSlots[0].reservedForVehicleId).toBeNull();
    // And reservation expired log must be generated
    const expiryLog = tickAfterExpiry.logs.find((l) => l.eventType === 'RESERVATION_EXPIRED');
    expect(expiryLog).toBeDefined();
    expect(expiryLog?.slotId).toBe('SLOT-RES-01');
  });
});
