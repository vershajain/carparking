import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  VehiclePCB,
  VehicleCategory,
  ScoreBreakdown,
} from '../core/types';
import {
  computeVehiclePriorityScore,
} from '../core/scheduler';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Zap,
  Accessibility,
  Ambulance,
  ShieldAlert,
  Flame,
  Crown,
  Car,
  Bookmark,
  TrendingUp,
} from 'lucide-react';

interface ReadyQueueProps {
  vehicles: VehiclePCB[];
  currentClock: number;
  isHighDemand: boolean;
  onVehicleClick: (vehicle: VehiclePCB) => void;
}

export const ReadyQueue: React.FC<ReadyQueueProps> = ({
  vehicles,
  currentClock,
  isHighDemand,
  onVehicleClick,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const readyVehicles = vehicles.filter((v) => v.state === 'READY');

  // Compute maximum waiting time in ready queue
  const waits = readyVehicles.map((v) => Math.max(0, currentClock - v.arrivalTime));
  const maxWait = Math.max(1, ...waits);

  // Compute live scores and ranking
  const ranked = readyVehicles.map((v) => {
    const breakdown = computeVehiclePriorityScore(
      v,
      currentClock,
      maxWait,
      isHighDemand
    );
    return {
      vehicle: v,
      score: breakdown.totalScore,
      breakdown,
    };
  });

  // Sort descending by total score, then FIFO arrival
  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.vehicle.arrivalTime - b.vehicle.arrivalTime;
  });

  const getCategoryBadge = (category: VehicleCategory) => {
    switch (category) {
      case 'AMBULANCE':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-[#f87171] border border-rose-500/40 font-mono">
            <Ambulance className="w-3 h-3 text-[#f87171]" /> AMBULANCE (U:100)
          </span>
        );
      case 'FIRE_TRUCK':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 font-mono">
            <Flame className="w-3 h-3 text-orange-400" /> FIRE TRUCK (U:95)
          </span>
        );
      case 'POLICE':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
            <ShieldAlert className="w-3 h-3 text-blue-400" /> POLICE (U:90)
          </span>
        );
      case 'VIP':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-[#e0a96d] border border-amber-500/40 font-mono">
            <Crown className="w-3 h-3 text-[#e0a96d]" /> VIP (U:70)
          </span>
        );
      case 'DISABLED':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
            <Accessibility className="w-3 h-3 text-indigo-400" /> DISABLED (U:65)
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#2b211b] text-[#d1c7bd] border border-[#4a3b32] font-mono">
            <Car className="w-3 h-3 text-[#9c8e82]" /> NORMAL (U:40)
          </span>
        );
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3a2e26] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#d97736]/20 text-[#e0a96d] border border-[#d97736]/30">
            <TrendingUp className="w-5 h-5 text-[#e0a96d]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#f7f2ee] tracking-wide font-['Outfit']">
              READY QUEUE <span className="text-[#9c8e82] text-sm font-normal">(Dynamic Priority Heap)</span>
            </h2>
            <p className="text-xs text-[#d1c7bd]">
              Evaluated under active formula: <strong className="text-[#e0a96d]">{isHighDemand ? 'P_H (High Demand)' : 'P_L (Low Demand)'}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#16100d] border border-[#4a3b32] text-[#e0a96d] font-semibold">
            {readyVehicles.length} Processes Waiting
          </span>
        </div>
      </div>

      {/* Empty State */}
      {readyVehicles.length === 0 ? (
        <div className="text-center py-10 bg-[#16100d]/50 rounded-xl border border-dashed border-[#4a3b32]">
          <Clock className="w-8 h-8 text-[#9c8e82] mx-auto mb-2" />
          <p className="text-sm text-[#d1c7bd] font-mono">Ready Queue is currently empty</p>
          <p className="text-xs text-[#9c8e82] mt-1">
            Spawn new processes or trigger rush hour to see dynamic scheduling!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#3a2e26] bg-[#16100d]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1f1612] text-[#9c8e82] uppercase font-mono tracking-wider text-[11px] border-b border-[#3a2e26]">
              <tr>
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Process / Plate</th>
                <th className="py-3 px-3">Category & Constraint</th>
                <th className="py-3 px-3">Wait (W)</th>
                <th className="py-3 px-3">Aging (F)</th>
                <th className="py-3 px-3 text-right">Priority Score (P)</th>
                <th className="py-3 px-2 text-center">Formula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e231c] font-mono">
              <AnimatePresence>
                {ranked.map(({ vehicle, score, breakdown }, index) => {
                  const waitMinutes = Math.max(0, currentClock - vehicle.arrivalTime);
                  const isTopRanked = index === 0;
                  const isExpanded = expandedId === vehicle.id;

                  return (
                    <React.Fragment key={vehicle.id}>
                      <motion.tr
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => onVehicleClick(vehicle)}
                        className={`cursor-pointer transition-colors ${
                          isTopRanked
                            ? 'bg-[#36251a]/40 hover:bg-[#453022]/60'
                            : 'hover:bg-[#231b17]'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-3">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                              isTopRanked
                                ? 'bg-[#d97736] text-black shadow-md shadow-[#d97736]/30'
                                : 'bg-[#2b211b] text-[#9c8e82] border border-[#4a3b32]'
                            }`}
                          >
                            #{index + 1}
                          </span>
                        </td>

                        {/* PID / License */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#f7f2ee] flex items-center gap-1.5">
                            <span>{vehicle.id}</span>
                            {isTopRanked && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#d97736]/30 text-[#e0a96d] border border-[#d97736]/60">
                                NEXT POP
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#9c8e82]">{vehicle.licensePlate}</div>
                        </td>

                        {/* Category & Badges */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {getCategoryBadge(vehicle.category)}
                            {vehicle.isEV && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-[#162414] text-[#84cc16] border border-[#2e5228] font-semibold">
                                <Zap className="w-2.5 h-2.5 text-[#84cc16] fill-[#84cc16]" /> EV
                              </span>
                            )}
                            {vehicle.needsAccessible && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-[#182333] text-[#60a5fa] border border-[#233d5e] font-semibold">
                                <Accessibility className="w-2.5 h-2.5 text-blue-400" /> ACC
                              </span>
                            )}
                            {vehicle.hasReservation && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-[#291c0e] text-[#f59e0b] border border-[#593d19] font-semibold">
                                <Bookmark className="w-2.5 h-2.5 text-[#f59e0b] fill-[#f59e0b]" /> RES (R:100)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Wait Time */}
                        <td className="py-3 px-3 text-[#d1c7bd]">
                          <div>{waitMinutes}m</div>
                          <div className="text-[10px] text-[#9c8e82]">
                            W={breakdown.factors.w.toFixed(0)}
                          </div>
                        </td>

                        {/* Aging Accumulator (F) */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                              vehicle.agingCycles >= 50
                                ? 'bg-amber-950 text-[#f59e0b] border border-amber-600 font-bold animate-pulse'
                                : 'bg-[#2b211b] text-[#d1c7bd] border border-[#4a3b32]'
                            }`}
                            title={`Incremented +10 for each skipped cycle (F=${vehicle.agingCycles})`}
                          >
                            +{vehicle.agingCycles}
                          </span>
                        </td>

                        {/* Total Score */}
                        <td className="py-3 px-3 text-right">
                          <span className="text-base font-bold text-[#e0a96d] font-mono tracking-tight text-glow-caramel">
                            {score.toFixed(2)}
                          </span>
                        </td>

                        {/* Expand Button */}
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={(e) => toggleExpand(vehicle.id, e)}
                            className="p-1 rounded hover:bg-[#2b211b] text-[#9c8e82] hover:text-white transition-colors"
                            title="Inspect Exact Arithmetic Steps"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#e0a96d]" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </motion.tr>

                      {/* Expandable Exact Formula Breakdown Row */}
                      {isExpanded && (
                        <tr className="bg-[#1f1612] border-b border-[#4a3b32]">
                          <td colSpan={7} className="p-4">
                            <div className="bg-[#16100d] p-3.5 rounded-xl border border-[#4a3b32] space-y-3 font-mono text-xs">
                              <div className="flex items-center justify-between text-[#e0a96d] border-b border-[#3a2e26] pb-2">
                                <span className="font-bold flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-[#e0a96d]" />
                                  EXACT DETERMINISTIC ARITHMETIC EVALUATION
                                </span>
                                <span className="text-[11px] text-[#9c8e82]">
                                  Formula: <strong className="text-white">{breakdown.formulaType}</strong>
                                </span>
                              </div>

                              {/* Normalized Factors Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                                <div className="bg-[#231b17] p-2 rounded border border-[#3a2e26]">
                                  <div className="text-[#9c8e82]">Wait Time (W)</div>
                                  <div className="text-white font-bold">{breakdown.factors.w} / 100</div>
                                  <div className="text-[9px] text-[#9c8e82]">
                                    Raw: {breakdown.rawWaitMinutes}m (Max: {breakdown.maxWaitInQueue}m)
                                  </div>
                                </div>
                                <div className="bg-[#231b17] p-2 rounded border border-[#3a2e26]">
                                  <div className="text-[#9c8e82]">Urgency (U)</div>
                                  <div className="text-white font-bold">{breakdown.factors.u} / 100</div>
                                  <div className="text-[9px] text-[#9c8e82]">{vehicle.category}</div>
                                </div>
                                <div className="bg-[#231b17] p-2 rounded border border-[#3a2e26]">
                                  <div className="text-[#9c8e82]">Reservation (R)</div>
                                  <div className="text-white font-bold">{breakdown.factors.r} / 100</div>
                                  <div className="text-[9px] text-[#9c8e82]">
                                    {vehicle.hasReservation ? 'Active (100)' : 'None (0)'}
                                  </div>
                                </div>
                                <div className="bg-[#231b17] p-2 rounded border border-[#3a2e26]">
                                  <div className="text-[#9c8e82]">Fairness Aging (F)</div>
                                  <div className="text-white font-bold">{breakdown.factors.f} / 100</div>
                                  <div className="text-[9px] text-[#9c8e82]">Skipped cycles × 10</div>
                                </div>
                                <div className="bg-[#231b17] p-2 rounded border border-[#3a2e26]">
                                  <div className="text-[#9c8e82]">Turnover (V)</div>
                                  <div className="text-white font-bold">{breakdown.factors.v} / 100</div>
                                  <div className="text-[9px] text-[#9c8e82]">
                                    Duration: {breakdown.durationMinutes}m
                                  </div>
                                </div>
                              </div>

                              {/* Weighted Calculation Equation */}
                              <div className="p-2.5 rounded bg-[#291c0e] border border-[#593d19] text-[#e0a96d] text-xs overflow-x-auto">
                                <span className="font-semibold text-white">Equation: </span>
                                <code>{breakdown.formattedString}</code>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
