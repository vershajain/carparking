import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import {
  ParkingSlotResource,
  VehiclePCB,
  SchedulingDecision,
  AuditLogEntry,
  SchedulerConfig,
  VehicleCategory,
  SlotState,
  SlotType,
} from './core/types';
import { DEFAULT_CONFIG } from './core/scheduler';

import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { ParkingGrid } from './components/ParkingGrid';
import { ReadyQueue } from './components/ReadyQueue';
import { DecisionExplainer } from './components/DecisionExplainer';
import { AuditLogTable } from './components/AuditLogTable';
import { SlotDetailsModal } from './components/SlotDetailsModal';
import { VehiclePcbModal } from './components/VehiclePcbModal';
import { AdminConfigModal } from './components/AdminConfigModal';
import { SpawnVehicleModal } from './components/SpawnVehicleModal';
import { AddSlotModal } from './components/AddSlotModal';

export const App: React.FC = () => {
  // Theme State: 'mocha' (Warm Coffee / Dark Amber / Mocha) vs 'cyber' (Neon OS)
  const [theme, setTheme] = useState<'mocha' | 'cyber'>(() => {
    const saved = localStorage.getItem('parkos_theme');
    return (saved as 'mocha' | 'cyber') || 'mocha';
  });

  useEffect(() => {
    document.body.className = theme === 'mocha' ? 'theme-mocha' : 'theme-cyber';
    localStorage.setItem('parkos_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'mocha' ? 'cyber' : 'mocha'));
  };

  // Core Simulation State
  const [clock, setClock] = useState<number>(10);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [metrics, setMetrics] = useState({
    totalSlots: 15,
    availableSlots: 8,
    occupiedSlots: 4,
    reservedSlots: 1,
    waitingVehicles: 4,
    demandPercent: 50,
    isHighDemand: true,
    demandFormula: 'P_H' as 'P_L' | 'P_H',
    utilizationRate: 33,
    ewtMinutes: 8,
    nextSlotExpected: 'SLOT-B01' as string | null,
  });
  const [config, setConfig] = useState<SchedulerConfig>({ ...DEFAULT_CONFIG });
  const [slots, setSlots] = useState<ParkingSlotResource[]>([]);
  const [vehicles, setVehicles] = useState<VehiclePCB[]>([]);
  const [latestDecision, setLatestDecision] = useState<SchedulingDecision | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  // Modal / Drawer Selection States
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlotResource | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePCB | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState<boolean>(false);
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState<boolean>(false);

  // Sync state from API
  const applyState = useCallback((data: any) => {
    if (!data) return;
    setClock(data.clock);
    setIsRunning(data.isRunning);
    if (data.speedMultiplier) setSpeedMultiplier(data.speedMultiplier);
    if (data.metrics) setMetrics(data.metrics);
    if (data.config) setConfig(data.config);
    if (data.slots) setSlots(data.slots);
    if (data.vehicles) setVehicles(data.vehicles);
    if (data.latestDecision !== undefined) setLatestDecision(data.latestDecision);
    if (data.logs) setLogs(data.logs);
  }, []);

  const refreshState = useCallback(async () => {
    const data = await api.getState();
    applyState(data);
  }, [applyState]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Simulation loop when running
  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = Math.max(100, Math.floor(1000 / speedMultiplier));
    const timer = setInterval(async () => {
      const data = await api.step(1);
      applyState(data);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, speedMultiplier, applyState]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, speedMultiplier]);

  // Handlers
  const handleTogglePlay = async () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    const data = await api.setControl(nextRunning, speedMultiplier);
    applyState(data);
  };

  const handleSpeedChange = async (speed: number) => {
    setSpeedMultiplier(speed);
    const data = await api.setControl(isRunning, speed);
    applyState(data);
  };

  const handleStep = async (mins: number) => {
    const data = await api.step(mins);
    applyState(data);
  };

  const handleRunCycle = async () => {
    const data = await api.runCycle();
    applyState(data);
  };

  const handleReset = async () => {
    const data = await api.reset();
    applyState(data);
  };

  const handleSpawnVehicle = async (params: {
    category: VehicleCategory;
    isEV: boolean;
    needsAccessible: boolean;
    expectedDuration: number;
    hasReservation: boolean;
    licensePlate?: string;
  }) => {
    const data = await api.spawnVehicle(params);
    applyState(data);
  };

  const handleReleaseVehicle = async (vehicleId: string) => {
    const data = await api.releaseVehicle(vehicleId);
    applyState(data);
  };

  const handleSaveConfig = async (newConfig: SchedulerConfig) => {
    const data = await api.updateConfig(newConfig);
    applyState(data);
  };

  const handleResetConfigDefaults = async () => {
    const data = await api.updateConfig(DEFAULT_CONFIG);
    applyState(data);
  };

  // Dynamic Parking Capacity Handlers (Hot-Plug Resource Expansion)
  const handleAddSlot = async (slotData: {
    id: string;
    zone: string;
    type: SlotType;
    distance: number;
    state?: SlotState;
  }) => {
    const data = await api.addSlot(slotData);
    applyState(data);
  };

  const handleToggleMaintenance = async (slotId: string, newState: SlotState) => {
    const data = await api.updateSlot(slotId, { state: newState });
    applyState(data);
  };

  const handleDeleteSlot = async (slotId: string) => {
    const data = await api.deleteSlot(slotId);
    applyState(data);
  };

  // Quick Spawn Presets
  const handleQuickSpawn = async (preset: 'AMBULANCE' | 'EV' | 'ACCESSIBLE' | 'RUSH_HOUR') => {
    if (preset === 'AMBULANCE') {
      await handleSpawnVehicle({
        category: 'AMBULANCE',
        isEV: false,
        needsAccessible: false,
        expectedDuration: 25,
        hasReservation: false,
        licensePlate: `AMB-${Math.floor(100 + Math.random() * 900)}`,
      });
    } else if (preset === 'EV') {
      await handleSpawnVehicle({
        category: 'NORMAL',
        isEV: true,
        needsAccessible: false,
        expectedDuration: 35,
        hasReservation: false,
        licensePlate: `EV-${Math.floor(1000 + Math.random() * 9000)}`,
      });
    } else if (preset === 'ACCESSIBLE') {
      await handleSpawnVehicle({
        category: 'DISABLED',
        isEV: false,
        needsAccessible: true,
        expectedDuration: 45,
        hasReservation: false,
        licensePlate: `DIS-${Math.floor(1000 + Math.random() * 9000)}`,
      });
    } else if (preset === 'RUSH_HOUR') {
      // Spawn a burst of 5 diverse vehicles to immediately trigger high demand!
      for (let i = 0; i < 4; i++) {
        await api.spawnVehicle({
          category: 'NORMAL',
          isEV: i % 2 === 0,
          needsAccessible: false,
          expectedDuration: 20 + i * 15,
          hasReservation: false,
        });
      }
      const data = await api.spawnVehicle({
        category: 'VIP',
        isEV: false,
        needsAccessible: false,
        expectedDuration: 30,
        hasReservation: false,
      });
      applyState(data);
    }
  };

  // Starvation Aging Test Preset
  const handleTriggerStarvationTest = async () => {
    await api.spawnVehicle({
      category: 'NORMAL',
      isEV: false,
      needsAccessible: false,
      expectedDuration: 40,
      hasReservation: false,
      licensePlate: 'STARVED-CAR-99',
    });
    for (let i = 1; i <= 3; i++) {
      await api.spawnVehicle({
        category: 'VIP',
        isEV: false,
        needsAccessible: false,
        expectedDuration: 25,
        hasReservation: false,
      });
    }
    const data = await api.getState();
    applyState(data);
  };

  // Find occupant vehicle for selected slot
  const selectedSlotOccupant = selectedSlot?.currentVehicleId
    ? vehicles.find((v) => v.id === selectedSlot.currentVehicleId) || null
    : null;

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      {/* Simulation Master Header */}
      <Header
        clock={clock}
        isRunning={isRunning}
        speedMultiplier={speedMultiplier}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onTogglePlay={handleTogglePlay}
        onStep={handleStep}
        onRunCycle={handleRunCycle}
        onReset={handleReset}
        onSpeedChange={handleSpeedChange}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenSpawnModal={() => setIsSpawnModalOpen(true)}
        onOpenAddSlotModal={() => setIsAddSlotModalOpen(true)}
        onQuickSpawn={handleQuickSpawn}
      />

      {/* Main OS Command Center Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Top Metric Cards & Full Capacity Alert */}
        <section aria-label="System Metrics">
          <MetricCards metrics={metrics} demandThreshold={config.demandThreshold} />
        </section>

        {/* Visual Parking Grid (The Physical Resource Block Map) */}
        <section aria-label="Resource Map">
          <ParkingGrid
            slots={slots}
            vehicles={vehicles}
            currentClock={clock}
            onSlotClick={(slot) => setSelectedSlot(slot)}
            onOpenAddSlotModal={() => setIsAddSlotModalOpen(true)}
          />
        </section>

        {/* Two-Column Core Layout: Ready Queue & Decision Explainer */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start" aria-label="Scheduler Core">
          {/* Dynamic Ready Queue (The Process Priority Heap) */}
          <ReadyQueue
            vehicles={vehicles}
            currentClock={clock}
            isHighDemand={metrics.isHighDemand}
            onVehicleClick={(vehicle) => setSelectedVehicle(vehicle)}
          />

          {/* Critical Viva Feature: Allocation Decision Explainer */}
          <DecisionExplainer
            decision={latestDecision}
            onSelectSlot={(slotId) => {
              const s = slots.find((sl) => sl.id === slotId);
              if (s) setSelectedSlot(s);
            }}
          />
        </section>

        {/* Live OS Event Audit Logs */}
        <section aria-label="Audit Logs">
          <AuditLogTable logs={logs} />
        </section>
      </main>

      {/* Modals & Drawers */}
      <SlotDetailsModal
        slot={selectedSlot}
        vehicle={selectedSlotOccupant}
        currentClock={clock}
        onClose={() => setSelectedSlot(null)}
        onRelease={handleReleaseVehicle}
        onInspectVehicle={(v) => {
          setSelectedSlot(null);
          setSelectedVehicle(v);
        }}
        onToggleMaintenance={handleToggleMaintenance}
        onDeleteSlot={handleDeleteSlot}
      />

      <VehiclePcbModal
        vehicle={selectedVehicle}
        currentClock={clock}
        onClose={() => setSelectedVehicle(null)}
        onRelease={handleReleaseVehicle}
      />

      <AdminConfigModal
        config={config}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleSaveConfig}
        onResetDefaults={handleResetConfigDefaults}
        onTriggerRushHour={() => handleQuickSpawn('RUSH_HOUR')}
        onTriggerStarvationTest={handleTriggerStarvationTest}
      />

      <SpawnVehicleModal
        isOpen={isSpawnModalOpen}
        onClose={() => setIsSpawnModalOpen(false)}
        onSpawn={handleSpawnVehicle}
      />

      <AddSlotModal
        isOpen={isAddSlotModalOpen}
        existingSlots={slots}
        onClose={() => setIsAddSlotModalOpen(false)}
        onAddSlot={handleAddSlot}
      />

      {/* Academic Viva Project Footer */}
      <footer className="border-t border-[#3a2e26] bg-[#16100d] py-4 px-6 text-center text-xs text-[#9c8e82] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Operating Systems Academic Project &bull; <strong className="text-[#d1c7bd]">ParkOS Resource Scheduler</strong>
          </span>
          <span className="text-[#9c8e82]">
            Rule-Based Deterministic Model &bull; Hot-Plug Dynamic Capacity &bull; Zero Blackbox AI
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
