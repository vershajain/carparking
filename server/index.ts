import express from 'express';
import cors from 'cors';
import {
  VehiclePCB,
  ParkingSlotResource,
  SchedulerConfig,
  SchedulingDecision,
  AuditLogEntry,
  SimulationState,
  VehicleCategory,
  SlotState,
  SlotType,
} from '../src/core/types';
import {
  DEFAULT_CONFIG,
  runSchedulerCycle,
  processClockTick,
  releaseVehicleFromSlot,
  calculateSystemDemand,
  calculateEWT,
} from '../src/core/scheduler';
import { INITIAL_SLOTS, INITIAL_VEHICLES, INITIAL_LOGS } from '../src/core/seed';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// In-Memory Simulation State Store (Deterministic OS Process Table & Resource Registry)
class SimulationStore {
  public clock: number = 10; // Starts at t=10 minutes
  public isRunning: boolean = false;
  public speedMultiplier: number = 1;
  public totalTicks: number = 10;
  public cycleCounter: number = 3;
  public config: SchedulerConfig = { ...DEFAULT_CONFIG };
  public slots: ParkingSlotResource[] = JSON.parse(JSON.stringify(INITIAL_SLOTS));
  public vehicles: VehiclePCB[] = JSON.parse(JSON.stringify(INITIAL_VEHICLES));
  public decisions: SchedulingDecision[] = [];
  public logs: AuditLogEntry[] = JSON.parse(JSON.stringify(INITIAL_LOGS));

  public reset() {
    this.clock = 10;
    this.isRunning = false;
    this.speedMultiplier = 1;
    this.totalTicks = 10;
    this.cycleCounter = 3;
    this.config = { ...DEFAULT_CONFIG };
    this.slots = JSON.parse(JSON.stringify(INITIAL_SLOTS));
    this.vehicles = JSON.parse(JSON.stringify(INITIAL_VEHICLES));
    this.decisions = [];
    this.logs = JSON.parse(JSON.stringify(INITIAL_LOGS));
  }

  public step(minutes: number = 1) {
    for (let m = 0; m < minutes; m++) {
      this.clock += 1;
      this.totalTicks += 1;

      // 1. Process clock tick events (Grace period expiry, overstay penalties)
      const tickResult = processClockTick(this.clock, this.vehicles, this.slots, this.config);
      this.vehicles = tickResult.updatedVehicles;
      this.slots = tickResult.updatedSlots;
      this.logs.unshift(...tickResult.logs);

      // Auto-check for vehicles that naturally reached their expectedExitTime
      for (const v of this.vehicles) {
        if (v.state === 'PARKED' && v.expectedExitTime !== null && this.clock >= v.expectedExitTime) {
          const relResult = releaseVehicleFromSlot(v.id, this.clock, this.vehicles, this.slots);
          this.vehicles = relResult.updatedVehicles;
          this.slots = relResult.updatedSlots;
          if (relResult.log) this.logs.unshift(relResult.log);
        }
      }

      // 2. If configured, run scheduler cycle on tick
      if (this.config.autoScheduleOnTick) {
        const readyCount = this.vehicles.filter((v) => v.state === 'READY').length;
        const freeCount = this.slots.filter((s) => s.state === 'FREE').length;
        if (readyCount > 0 && freeCount > 0) {
          this.cycleCounter += 1;
          const schedResult = runSchedulerCycle(
            this.clock,
            this.cycleCounter,
            this.vehicles,
            this.slots,
            this.config
          );
          this.vehicles = schedResult.updatedVehicles;
          this.slots = schedResult.updatedSlots;
          if (schedResult.decision) {
            this.decisions.unshift(schedResult.decision);
            // keep last 20 decisions
            if (this.decisions.length > 20) this.decisions.pop();
          }
          this.logs.unshift(...schedResult.logs);
        }
      }
    }

    // Keep logs within bounds
    if (this.logs.length > 200) {
      this.logs = this.logs.slice(0, 200);
    }
  }

  public runCycle() {
    this.cycleCounter += 1;
    const schedResult = runSchedulerCycle(
      this.clock,
      this.cycleCounter,
      this.vehicles,
      this.slots,
      this.config
    );
    this.vehicles = schedResult.updatedVehicles;
    this.slots = schedResult.updatedSlots;
    if (schedResult.decision) {
      this.decisions.unshift(schedResult.decision);
      if (this.decisions.length > 20) this.decisions.pop();
    }
    this.logs.unshift(...schedResult.logs);
    return schedResult.decision;
  }

  public addSlot(slotData: {
    id: string;
    zone: string;
    type: SlotType;
    distance: number;
    state?: SlotState;
  }): ParkingSlotResource {
    const newSlot: ParkingSlotResource = {
      id: slotData.id,
      zone: slotData.zone,
      type: slotData.type || 'STANDARD',
      distance: Number(slotData.distance) || 30,
      state: slotData.state || 'FREE',
      currentVehicleId: null,
      reservedForVehicleId: null,
      occupiedSince: null,
      expectedReleaseTime: null,
      reservationExpiresAt: null,
      totalVehiclesServed: 0,
    };

    this.slots.push(newSlot);

    this.logs.unshift({
      id: `log-slot-add-${Date.now()}`,
      timestamp: this.clock,
      cycle: this.cycleCounter,
      vehicleId: null,
      slotId: newSlot.id,
      eventType: 'CONFIG_CHANGE',
      severity: 'success',
      message: `[RESOURCE HOT-PLUG] Added new resource block ${newSlot.id} (${newSlot.type}) in ${newSlot.zone} at ${newSlot.distance}m.`,
    });

    // Reactive scheduler check: if new slot is FREE and ready vehicles exist, schedule immediately!
    if (newSlot.state === 'FREE' && this.config.autoScheduleOnTick) {
      this.runCycle();
    }

    return newSlot;
  }

  public updateSlot(id: string, updates: Partial<ParkingSlotResource>): ParkingSlotResource | null {
    const sIdx = this.slots.findIndex((s) => s.id === id);
    if (sIdx === -1) return null;

    const oldState = this.slots[sIdx].state;
    this.slots[sIdx] = {
      ...this.slots[sIdx],
      ...updates,
    };

    const updated = this.slots[sIdx];

    this.logs.unshift({
      id: `log-slot-upd-${Date.now()}`,
      timestamp: this.clock,
      cycle: this.cycleCounter,
      vehicleId: updated.currentVehicleId,
      slotId: updated.id,
      eventType: 'CONFIG_CHANGE',
      severity: 'info',
      message: `[RESOURCE RECONFIG] Resource ${updated.id} state updated from ${oldState} to ${updated.state}.`,
    });

    // If transitioned to FREE, trigger scheduler
    if (oldState !== 'FREE' && updated.state === 'FREE' && this.config.autoScheduleOnTick) {
      this.runCycle();
    }

    return updated;
  }

  public deleteSlot(id: string): boolean {
    const sIdx = this.slots.findIndex((s) => s.id === id);
    if (sIdx === -1) return false;

    const slot = this.slots[sIdx];

    // If occupied, evict occupant
    if (slot.currentVehicleId) {
      this.release(slot.currentVehicleId);
    }

    this.slots.splice(sIdx, 1);

    this.logs.unshift({
      id: `log-slot-del-${Date.now()}`,
      timestamp: this.clock,
      cycle: this.cycleCounter,
      vehicleId: null,
      slotId: id,
      eventType: 'CONFIG_CHANGE',
      severity: 'warning',
      message: `[RESOURCE REMOVAL] Removed resource block ${id} from system registry.`,
    });

    return true;
  }

  public release(id: string) {
    const result = releaseVehicleFromSlot(id, this.clock, this.vehicles, this.slots);
    this.vehicles = result.updatedVehicles;
    this.slots = result.updatedSlots;
    if (result.log) {
      this.logs.unshift(result.log);
    }
    if (this.config.autoScheduleOnTick) {
      this.runCycle();
    }
  }

  public getStatePayload() {
    const readyVehicles = this.vehicles.filter((v) => v.state === 'READY');
    const availableSlots = this.slots.filter((s) => s.state === 'FREE');
    const occupiedSlots = this.slots.filter((s) => s.state === 'OCCUPIED');
    const reservedSlots = this.slots.filter((s) => s.state === 'RESERVED');

    const demandInfo = calculateSystemDemand(readyVehicles.length, availableSlots.length);
    const ewtInfo = calculateEWT(this.clock, this.slots);

    const totalSlots = this.slots.length;
    const utilizationRate =
      totalSlots > 0 ? Math.round(((occupiedSlots.length + reservedSlots.length) / totalSlots) * 100) : 0;

    return {
      clock: this.clock,
      isRunning: this.isRunning,
      speedMultiplier: this.speedMultiplier,
      totalTicks: this.totalTicks,
      cycleCounter: this.cycleCounter,
      metrics: {
        totalSlots,
        availableSlots: availableSlots.length,
        occupiedSlots: occupiedSlots.length,
        reservedSlots: reservedSlots.length,
        waitingVehicles: readyVehicles.length,
        demandPercent: demandInfo.demandPercent,
        isHighDemand: demandInfo.isHighDemand,
        demandFormula: demandInfo.isHighDemand ? 'P_H' : 'P_L',
        utilizationRate,
        ewtMinutes: ewtInfo.ewtMinutes,
        nextSlotExpected: ewtInfo.nextSlotId,
      },
      config: this.config,
      slots: this.slots,
      vehicles: this.vehicles,
      readyQueue: readyVehicles,
      latestDecision: this.decisions[0] || null,
      decisions: this.decisions,
      logs: this.logs.slice(0, 50),
    };
  }
}

const simStore = new SimulationStore();

// Background simulation ticker
let tickTimer: NodeJS.Timeout | null = null;
function updateTicker() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  if (simStore.isRunning) {
    const intervalMs = Math.max(100, Math.floor(1000 / simStore.speedMultiplier));
    tickTimer = setInterval(() => {
      simStore.step(1);
    }, intervalMs);
  }
}

// Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

app.get('/api/simulation/state', (req, res) => {
  res.json(simStore.getStatePayload());
});

app.post('/api/simulation/step', (req, res) => {
  const minutes = Number(req.body.minutes) || 1;
  simStore.step(minutes);
  res.json(simStore.getStatePayload());
});

app.post('/api/simulation/cycle', (req, res) => {
  const decision = simStore.runCycle();
  res.json({ decision, state: simStore.getStatePayload() });
});

app.post('/api/simulation/control', (req, res) => {
  const { isRunning, speedMultiplier } = req.body;
  if (typeof isRunning === 'boolean') {
    simStore.isRunning = isRunning;
  }
  if (typeof speedMultiplier === 'number') {
    simStore.speedMultiplier = speedMultiplier;
  }
  updateTicker();
  res.json(simStore.getStatePayload());
});

app.post('/api/simulation/reset', (req, res) => {
  simStore.reset();
  updateTicker();
  res.json(simStore.getStatePayload());
});

// Slot Management Endpoints (Hot-Plug Resource Expansion)
app.post('/api/slots', (req, res) => {
  const { id, zone, type, distance, state } = req.body;
  if (!id || !zone) {
    return res.status(400).json({ error: 'id and zone are required' });
  }
  const created = simStore.addSlot({ id, zone, type, distance, state });
  res.json({ slot: created, state: simStore.getStatePayload() });
});

app.patch('/api/slots/:id', (req, res) => {
  const { id } = req.params;
  const updated = simStore.updateSlot(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Slot not found' });
  }
  res.json({ slot: updated, state: simStore.getStatePayload() });
});

app.delete('/api/slots/:id', (req, res) => {
  const { id } = req.params;
  const success = simStore.deleteSlot(id);
  if (!success) {
    return res.status(404).json({ error: 'Slot not found' });
  }
  res.json({ success: true, state: simStore.getStatePayload() });
});

app.post('/api/vehicles/spawn', (req, res) => {
  const { category, isEV, needsAccessible, expectedDuration, hasReservation, licensePlate } = req.body;
  const count = simStore.vehicles.length + 1;
  const idPrefix =
    category === 'AMBULANCE'
      ? 'AMB'
      : category === 'FIRE_TRUCK'
      ? 'FIRE'
      : category === 'POLICE'
      ? 'POL'
      : isEV
      ? 'EV'
      : 'PROC';
  const id = `${idPrefix}-${count}`;

  const arrivalTime = simStore.clock;
  const duration = Number(expectedDuration) || 30;

  const newVehicle: VehiclePCB = {
    id,
    licensePlate: licensePlate || `IND-${Math.floor(1000 + Math.random() * 9000)}`,
    category: (category as VehicleCategory) || 'NORMAL',
    isEV: Boolean(isEV),
    needsAccessible: Boolean(needsAccessible),
    arrivalTime,
    expectedDuration: duration,
    hasReservation: Boolean(hasReservation),
    reservationStartTime: hasReservation ? arrivalTime : null,
    reservationGraceExpiresAt: hasReservation ? arrivalTime + simStore.config.reservationGracePeriod : null,
    agingCycles: 0,
    state: 'READY',
    allocatedSlotId: null,
    actualParkStartTime: null,
    expectedExitTime: null,
    actualExitTime: null,
    fineIncurred: 0,
  };

  simStore.vehicles.push(newVehicle);
  simStore.logs.unshift({
    id: `log-spawn-${Date.now()}`,
    timestamp: simStore.clock,
    cycle: simStore.cycleCounter,
    vehicleId: newVehicle.id,
    slotId: null,
    eventType: 'ENQUEUE',
    severity: newVehicle.category === 'AMBULANCE' || newVehicle.category === 'FIRE_TRUCK' ? 'warning' : 'info',
    message: `[ENQUEUE] Process ${newVehicle.id} (${newVehicle.category}, EV:${newVehicle.isEV ? 'Yes' : 'No'}, Burst:${duration}m) pushed to Ready Queue.`,
  });

  if (simStore.config.autoScheduleOnTick) {
    simStore.runCycle();
  }

  res.json({ vehicle: newVehicle, state: simStore.getStatePayload() });
});

app.post('/api/vehicles/:id/release', (req, res) => {
  const { id } = req.params;
  simStore.release(id);
  res.json(simStore.getStatePayload());
});

app.put('/api/config', (req, res) => {
  const newConfig = { ...simStore.config, ...req.body };
  simStore.config = newConfig;
  simStore.logs.unshift({
    id: `log-cfg-${Date.now()}`,
    timestamp: simStore.clock,
    cycle: simStore.cycleCounter,
    vehicleId: null,
    slotId: null,
    eventType: 'CONFIG_CHANGE',
    severity: 'info',
    message: `[CONFIG UPDATED] Demand threshold: ${newConfig.demandThreshold}%, Grace: ${newConfig.reservationGracePeriod}m, Fine rate: ₹${newConfig.fineRatePerMinute}/min.`,
  });
  res.json(simStore.getStatePayload());
});

app.listen(PORT, () => {
  console.log(`OS Smart Parking Scheduler Backend running on http://localhost:${PORT}`);
});
