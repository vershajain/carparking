// Core Domain Types for OS-Inspired Smart Parking Resource Scheduler

export type VehicleCategory =
  | 'AMBULANCE'
  | 'FIRE_TRUCK'
  | 'POLICE'
  | 'VIP'
  | 'DISABLED'
  | 'NORMAL';

export type ProcessState =
  | 'READY'       // In Ready Queue
  | 'ALLOCATED'   // Resource assigned, entering
  | 'PARKED'      // Running in slot / resource block
  | 'OVERSTAY'    // Running past burst time + grace period
  | 'COMPLETED'   // Terminated normally
  | 'CANCELLED';  // Reservation expired or aborted

export type SlotState =
  | 'FREE'        // Available memory/resource block
  | 'OCCUPIED'    // Process executing
  | 'RESERVED'    // Reserved with grace timer
  | 'MAINTENANCE';// Offline / Dead resource

export type SlotType =
  | 'STANDARD'
  | 'EV_CHARGER'
  | 'ACCESSIBLE'
  | 'VIP';

export interface ScoreFactors {
  w: number; // Waiting time [0, 100]
  u: number; // Urgency [0, 100]
  r: number; // Reservation [0, 100]
  f: number; // Aging [0, 100]
  v: number; // Duration turnover [0, 100]
}

export interface ScoreBreakdown {
  factors: ScoreFactors;
  rawWaitMinutes: number;
  maxWaitInQueue: number;
  durationMinutes: number;
  formulaType: 'P_L' | 'P_H';
  weights: { w: number; u: number; r: number; f: number; v: number };
  terms: { wTerm: number; uTerm: number; rTerm: number; fTerm: number; vTerm: number };
  totalScore: number;
  formattedString: string;
}

export interface VehiclePCB {
  id: string;                      // Process PID (e.g. "P-101", "AMB-01")
  licensePlate: string;            // Vehicle plate
  category: VehicleCategory;       // Urgency mapping (100, 95, 90, 70, 65, 40)
  isEV: boolean;                   // Resource constraint: Requires EV
  needsAccessible: boolean;        // Resource constraint: Requires Accessible
  arrivalTime: number;             // Simulation minute arrival
  expectedDuration: number;        // Burst duration (minutes)
  hasReservation: boolean;         // Reservation flag
  reservationStartTime: number | null;
  reservationGraceExpiresAt: number | null; // reservationStartTime + 10
  agingCycles: number;             // Skips counter * 10 (capped at 100)
  state: ProcessState;             // Current OS process lifecycle state
  allocatedSlotId: string | null;  // Bound resource block ID
  actualParkStartTime: number | null;
  expectedExitTime: number | null;
  actualExitTime: number | null;
  fineIncurred: number;            // Penalty accumulated
  lastScoreBreakdown?: ScoreBreakdown;
}

export interface ParkingSlotResource {
  id: string;                      // Resource Block ID (e.g., "A-01", "B-04")
  zone: string;                    // Memory Bank / Zone (e.g., "Zone A", "Zone B")
  type: SlotType;                  // Capabilities / Attribute
  distance: number;                // Distance from entry (e.g., meters)
  state: SlotState;                // Resource allocation state
  currentVehicleId: string | null; // Owning process PID
  reservedForVehicleId: string | null;
  occupiedSince: number | null;
  expectedReleaseTime: number | null;
  reservationExpiresAt: number | null;
  totalVehiclesServed: number;
}

export interface CandidateSlotScore {
  slotId: string;
  zone: string;
  type: SlotType;
  distance: number;
  normalizedDistance: number;
  zoneDemand: number;
  slotFitScore: number;
  totalScore: number;
  reasons: string[];
  chosen: boolean;
}

export interface SchedulingDecision {
  timestamp: number;
  cycleNumber: number;
  demandCondition: 'LOW DEMAND' | 'HIGH DEMAND';
  formulaUsed: 'P_L' | 'P_H';
  selectedVehicleId: string;
  selectedVehicleCategory: VehicleCategory;
  vehiclePriorityScore: number;
  queueSizeAtDecision: number;
  readyQueueRanking: { vehicleId: string; score: number; category: VehicleCategory }[];
  candidateSlots: CandidateSlotScore[];
  assignedSlotId: string | null;
  rationale: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  cycle: number;
  vehicleId: string | null;
  slotId: string | null;
  eventType:
    | 'ENQUEUE'
    | 'AGING_TICK'
    | 'ALLOCATION'
    | 'PARKED'
    | 'RELEASE'
    | 'OVERSTAY_ALERT'
    | 'PENALTY_FINED'
    | 'RESERVATION_EXPIRED'
    | 'CONFIG_CHANGE'
    | 'STARVATION_RESOLVED';
  severity: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: Record<string, any>;
}

export interface SchedulerConfig {
  demandThreshold: number; // Default: 50%
  weightsLow: { w: number; u: number; r: number; f: number; v: number };
  weightsHigh: { w: number; u: number; r: number; f: number; v: number };
  reservationGracePeriod: number; // 10 minutes
  overstayGracePeriod: number;    // 5 minutes
  fineRatePerMinute: number;      // ₹10/min
  maxTurnoverReference: number;   // 240 minutes for max burst reference
  autoScheduleOnTick: boolean;
}

export interface SimulationState {
  clock: number;             // Minutes since epoch (e.g. 0 = 09:00 AM)
  isRunning: boolean;
  speedMultiplier: number;   // 1x, 5x, 10x
  totalTicks: number;
  config: SchedulerConfig;
  slots: ParkingSlotResource[];
  vehicles: VehiclePCB[];
  readyQueueIds: string[];
  activeDecisions: SchedulingDecision[];
  logs: AuditLogEntry[];
}
