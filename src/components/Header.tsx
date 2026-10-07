import React from 'react';
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Sliders,
  PlusCircle,
  Cpu,
  Zap,
  Activity,
  AlertTriangle,
  Flame,
  Ambulance,
  Accessibility,
  Coffee,
  Moon,
  Sun,
  Layers,
} from 'lucide-react';
import { VehicleCategory } from '../core/types';

interface HeaderProps {
  clock: number;
  isRunning: boolean;
  speedMultiplier: number;
  theme: 'mocha' | 'cyber';
  onToggleTheme: () => void;
  onTogglePlay: () => void;
  onStep: (mins: number) => void;
  onRunCycle: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onOpenConfig: () => void;
  onOpenSpawnModal: () => void;
  onOpenAddSlotModal: () => void;
  onQuickSpawn: (preset: 'AMBULANCE' | 'EV' | 'ACCESSIBLE' | 'RUSH_HOUR') => void;
}

export const Header: React.FC<HeaderProps> = ({
  clock,
  isRunning,
  speedMultiplier,
  theme,
  onToggleTheme,
  onTogglePlay,
  onStep,
  onRunCycle,
  onReset,
  onSpeedChange,
  onOpenConfig,
  onOpenSpawnModal,
  onOpenAddSlotModal,
  onQuickSpawn,
}) => {
  // Format simulation clock to virtual time (starting at 09:00 AM)
  const baseHour = 9;
  const hours = baseHour + Math.floor(clock / 60);
  const minutes = clock % 60;
  const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;

  return (
    <header className="border-b border-[#3a2e26] bg-[#1a1412]/95 backdrop-blur-md sticky top-0 z-40 px-4 py-3 shadow-xl text-[#f7f2ee]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Brand & Theme Switcher */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#d97736] via-[#c88a4b] to-[#e0a96d] flex items-center justify-center shadow-lg shadow-[#d97736]/25 border border-[#e0a96d]/40">
              <Cpu className="w-5 h-5 text-black font-bold animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-[#f7f2ee] font-['Outfit']">
                  PARK<span className="text-[#d97736]">OS</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#2b211b] text-[#e0a96d] border border-[#d97736]/50">
                  SCHEDULER v2.4
                </span>
              </div>
              <p className="text-xs text-[#d1c7bd] hidden sm:block">
                Deterministic OS Process & Resource Allocation Simulation
              </p>
            </div>
          </div>

          {/* Theme Switcher Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#2b211b] hover:bg-[#362a23] border border-[#4a3b32] text-xs font-mono text-[#d1c7bd] hover:text-[#f7f2ee] transition-all shadow-inner"
              title="Toggle Theme: Warm Mocha vs Cyber Dark"
            >
              {theme === 'mocha' ? (
                <>
                  <Coffee className="w-3.5 h-3.5 text-[#d97736]" />
                  <span className="hidden sm:inline font-semibold text-[#e0a96d]">Mocha</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline font-semibold text-cyan-300">Cyber</span>
                </>
              )}
            </button>

            {/* Mobile quick actions */}
            <div className="flex lg:hidden items-center gap-1">
              <button
                onClick={() => onQuickSpawn('AMBULANCE')}
                className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs"
                title="Spawn Ambulance"
              >
                <Ambulance className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenAddSlotModal}
                className="p-1.5 rounded-lg bg-[#d97736]/20 border border-[#d97736]/40 text-[#e0a96d] text-xs"
                title="Add Slot"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenConfig}
                className="p-1.5 rounded-lg bg-[#2b211b] text-[#d1c7bd] border border-[#4a3b32]"
                title="Configuration"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center: Interactive Simulation Clock & Time Engine Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 bg-[#231b17] px-3 py-1.5 rounded-xl border border-[#3a2e26] shadow-inner">
          {/* Clock Display Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#16100d] rounded-lg border border-[#4a3b32] font-mono text-sm">
            <span className="w-2 h-2 rounded-full bg-[#84cc16] animate-ping inline-block" />
            <span className="text-[#9c8e82] text-xs">SIM TIME:</span>
            <span className="font-bold text-[#e0a96d]">{timeFormatted}</span>
            <span className="text-[#9c8e82] text-xs">(+{clock}m)</span>
          </div>

          <div className="h-5 w-px bg-[#3a2e26] hidden sm:block" />

          {/* Play / Pause Toggle */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
              isRunning
                ? 'bg-amber-500/20 text-[#f59e0b] border border-[#f59e0b]/40 hover:bg-amber-500/30'
                : 'bg-[#84cc16] hover:bg-[#65a30d] text-black border border-[#a3e635]/40 font-bold'
            }`}
            title={isRunning ? 'Pause Simulation Clock' : 'Start Simulation Clock'}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Run
              </>
            )}
          </button>

          {/* Speed Multipliers */}
          <div className="flex items-center bg-[#16100d] rounded-lg p-0.5 border border-[#3a2e26] text-xs font-mono">
            {[1, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-1 rounded transition-colors ${
                  speedMultiplier === s
                    ? 'bg-[#d97736] text-black font-bold shadow'
                    : 'text-[#9c8e82] hover:text-[#f7f2ee]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Step Clock (+1m / +5m) */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onStep(1)}
              className="px-2 py-1.5 rounded-lg bg-[#2b211b] hover:bg-[#362a23] text-[#d1c7bd] hover:text-white border border-[#4a3b32] text-xs font-mono font-medium"
              title="Advance Clock +1 Minute"
            >
              +1m Step
            </button>
            <button
              onClick={() => onStep(5)}
              className="px-2 py-1.5 rounded-lg bg-[#2b211b] hover:bg-[#362a23] text-[#d1c7bd] hover:text-white border border-[#4a3b32] text-xs font-mono font-medium hidden sm:block"
              title="Advance Clock +5 Minutes"
            >
              +5m
            </button>
          </div>

          {/* Run Scheduling Cycle Immediately */}
          <button
            onClick={onRunCycle}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#d97736]/20 hover:bg-[#d97736]/35 text-[#e0a96d] border border-[#d97736]/40 text-xs font-medium"
            title="Trigger Immediate Scheduler Cycle"
          >
            <Zap className="w-3.5 h-3.5 text-[#d97736]" />
            <span className="hidden md:inline">Cycle Queue</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg bg-[#2b211b] hover:bg-rose-950/60 text-[#9c8e82] hover:text-rose-300 border border-[#4a3b32] hover:border-rose-800/60 transition-colors"
            title="Reset Simulation State to Initial Seed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Side: Quick Action Presets & Modals */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Quick Spawn Buttons */}
          <div className="flex items-center gap-1 bg-[#231b17] p-1 rounded-xl border border-[#3a2e26]">
            <button
              onClick={() => onQuickSpawn('AMBULANCE')}
              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs flex items-center gap-1 transition-all"
              title="Spawn Emergency Ambulance (Urgency=100)"
            >
              <Ambulance className="w-3.5 h-3.5 text-rose-400" />
              <span>Ambulance</span>
            </button>
            <button
              onClick={() => onQuickSpawn('EV')}
              className="px-2 py-1 rounded-lg bg-[#84cc16]/10 hover:bg-[#84cc16]/25 text-[#84cc16] border border-[#84cc16]/30 text-xs flex items-center gap-1 transition-all"
              title="Spawn EV Vehicle (Requires EV Slot)"
            >
              <Zap className="w-3.5 h-3.5 text-[#84cc16]" />
              <span>EV</span>
            </button>
            <button
              onClick={() => onQuickSpawn('ACCESSIBLE')}
              className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs flex items-center gap-1 transition-all"
              title="Spawn Wheelchair Accessible Vehicle"
            >
              <Accessibility className="w-3.5 h-3.5 text-blue-400" />
              <span>Accessible</span>
            </button>
            <button
              onClick={() => onQuickSpawn('RUSH_HOUR')}
              className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-[#e0a96d] border border-amber-500/30 text-xs flex items-center gap-1 transition-all font-mono"
              title="Simulate Rush Hour: Burst queue to trigger High Demand [P_H]"
            >
              <Flame className="w-3.5 h-3.5 text-[#d97736]" />
              <span>Rush</span>
            </button>
          </div>

          {/* Hot-Plug Slot / Zone Button */}
          <button
            onClick={onOpenAddSlotModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2b211b] hover:bg-[#362a23] text-[#e0a96d] font-semibold text-xs border border-[#4a3b32] transition-all font-mono"
            title="Hot-Plug Resource Block / Zone"
          >
            <Layers className="w-3.5 h-3.5 text-[#d97736]" />
            <span>+ Slot</span>
          </button>

          {/* Custom Spawn Modal Button */}
          <button
            onClick={onOpenSpawnModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d97736] hover:bg-[#c88a4b] text-black font-bold text-xs transition-all shadow-md shadow-[#d97736]/20 font-mono"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Process</span>
          </button>

          {/* Admin Config Button */}
          <button
            onClick={onOpenConfig}
            className="p-2 rounded-xl bg-[#2b211b] hover:bg-[#362a23] text-[#d1c7bd] border border-[#4a3b32] transition-colors"
            title="Scheduler Formula & Weight Configurations"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
