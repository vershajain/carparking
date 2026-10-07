import {
  SimulationState,
  SchedulerConfig,
  VehiclePCB,
  ParkingSlotResource,
  SchedulingDecision,
  AuditLogEntry,
  VehicleCategory,
  SlotState,
  SlotType,
} from '../core/types';
import {
  DEFAULT_CONFIG,
  runSchedulerCycle,
  processClockTick,
  releaseVehicleFromSlot,
  calculateSystemDemand,
  calculateEWT,
} from '../core/scheduler';
import { INITIAL_SLOTS, INITIAL_VEHICLES, INITIAL_LOGS } from '../core/seed';

// Local Fallback Simulation Store (Runs in-browser if backend is offline)
class LocalSimulationStore {
  public clock: number = 10;
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

      const tickResult = processClockTick(this.clock, this.vehicles, this.slots, this.config);
      this.vehicles = tickResult.updatedVehicles;
      this.slots = tickResult.updatedSlots;
      this.logs.unshift(...tickResult.logs);

      for (const v of this.vehicles) {
        if (v.state === 'PARKED' && v.expectedExitTime !== null && this.clock >= v.expectedExitTime) {
          const relResult = releaseVehicleFromSlot(v.id, this.clock, this.vehicles, this.slots);
          this.vehicles = relResult.updatedVehicles;
          this.slots = relResult.updatedSlots;
          if (relResult.log) this.logs.unshift(relResult.log);
        }
      }

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
            if (this.decisions.length > 20) this.decisions.pop();
          }
          this.logs.unshift(...schedResult.logs);
        }
      }
    }

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

    if (oldState !== 'FREE' && updated.state === 'FREE' && this.config.autoScheduleOnTick) {
      this.runCycle();
    }

    return updated;
  }

  public deleteSlot(id: string): boolean {
    const sIdx = this.slots.findIndex((s) => s.id === id);
    if (sIdx === -1) return false;

    const slot = this.slots[sIdx];
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

  public spawn(params: any) {
    const { category, isEV, needsAccessible, expectedDuration, hasReservation, licensePlate } = params;
    const count = this.vehicles.length + 1;
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
    const arrivalTime = this.clock;
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
      reservationGraceExpiresAt: hasReservation ? arrivalTime + this.config.reservationGracePeriod : null,
      agingCycles: 0,
      state: 'READY',
      allocatedSlotId: null,
      actualParkStartTime: null,
      expectedExitTime: null,
      actualExitTime: null,
      fineIncurred: 0,
    };

    this.vehicles.push(newVehicle);
    this.logs.unshift({
      id: `log-spawn-${Date.now()}`,
      timestamp: this.clock,
      cycle: this.cycleCounter,
      vehicleId: newVehicle.id,
      slotId: null,
      eventType: 'ENQUEUE',
      severity: newVehicle.category === 'AMBULANCE' || newVehicle.category === 'FIRE_TRUCK' ? 'warning' : 'info',
      message: `[ENQUEUE] Process ${newVehicle.id} (${newVehicle.category}, EV:${newVehicle.isEV ? 'Yes' : 'No'}, Burst:${duration}m) pushed to Ready Queue.`,
    });

    if (this.config.autoScheduleOnTick) {
      this.runCycle();
    }
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

const localStore = new LocalSimulationStore();

// Client API with transparent fallback
export const api = {
  async getState() {
    try {
      const res = await fetch('/api/simulation/state');
      if (res.ok) return await res.json();
    } catch (e) {}
    return localStore.getStatePayload();
  },

  async step(minutes: number = 1) {
    try {
      const res = await fetch('/api/simulation/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    localStore.step(minutes);
    return localStore.getStatePayload();
  },

  async runCycle() {
    try {
      const res = await fetch('/api/simulation/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return data.state;
      }
    } catch (e) {}
    localStore.runCycle();
    return localStore.getStatePayload();
  },

  async setControl(isRunning: boolean, speedMultiplier?: number) {
    try {
      const res = await fetch('/api/simulation/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRunning, speedMultiplier }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    localStore.isRunning = isRunning;
    if (speedMultiplier) localStore.speedMultiplier = speedMultiplier;
    return localStore.getStatePayload();
  },

  async reset() {
    try {
      const res = await fetch('/api/simulation/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    localStore.reset();
    return localStore.getStatePayload();
  },

  async addSlot(slotData: {
    id: string;
    zone: string;
    type: SlotType;
    distance: number;
    state?: SlotState;
  }) {
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotData),
      });
      if (res.ok) {
        const data = await res.json();
        return data.state;
      }
    } catch (e) {}
    localStore.addSlot(slotData);
    return localStore.getStatePayload();
  },

  async updateSlot(id: string, updates: Partial<ParkingSlotResource>) {
    try {
      const res = await fetch(`/api/slots/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        return data.state;
      }
    } catch (e) {}
    localStore.updateSlot(id, updates);
    return localStore.getStatePayload();
  },

  async deleteSlot(id: string) {
    try {
      const res = await fetch(`/api/slots/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        return data.state;
      }
    } catch (e) {}
    localStore.deleteSlot(id);
    return localStore.getStatePayload();
  },

  async spawnVehicle(params: {
    category: VehicleCategory;
    isEV: boolean;
    needsAccessible: boolean;
    expectedDuration: number;
    hasReservation: boolean;
    licensePlate?: string;
  }) {
    try {
      const res = await fetch('/api/vehicles/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        return data.state;
      }
    } catch (e) {}
    localStore.spawn(params);
    return localStore.getStatePayload();
  },

  async releaseVehicle(vehicleId: string) {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/release`, {
        method: 'POST',
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    localStore.release(vehicleId);
    return localStore.getStatePayload();
  },

  async updateConfig(newConfig: Partial<SchedulerConfig>) {
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    localStore.config = { ...localStore.config, ...newConfig };
    return localStore.getStatePayload();
  },
};
