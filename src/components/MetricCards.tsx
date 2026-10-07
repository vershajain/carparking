import React from 'react';
import {
  Layers,
  CheckCircle2,
  Car,
  Bookmark,
  TrendingUp,
  AlertOctagon,
  Clock,
  Gauge,
  Sparkles,
} from 'lucide-react';

interface MetricCardsProps {
  metrics: {
    totalSlots: number;
    availableSlots: number;
    occupiedSlots: number;
    reservedSlots: number;
    waitingVehicles: number;
    demandPercent: number;
    isHighDemand: boolean;
    demandFormula: 'P_L' | 'P_H';
    utilizationRate: number;
    ewtMinutes: number;
    nextSlotExpected: string | null;
  };
  demandThreshold: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, demandThreshold }) => {
  const isFullCapacity = metrics.availableSlots === 0;

  return (
    <div className="space-y-3">
      {/* FULL CAPACITY EWT ALERT BANNER */}
      {isFullCapacity && (
        <div className="bg-gradient-to-r from-[#3a1818] via-[#4d1f1f] to-[#3a1818] border border-[#ef4444]/60 rounded-2xl p-4 shadow-lg shadow-black/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <AlertOctagon className="w-6 h-6 text-rose-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide text-rose-200 uppercase font-mono">
                  🚨 PARKING FULL CAPACITY
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-900/80 text-rose-300 border border-rose-700/60 font-semibold">
                  QUEUE ACTIVE
                </span>
              </div>
              <p className="text-xs text-rose-300/80 mt-0.5">
                All resource blocks occupied. Incoming processes queued into Ready Queue.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-rose-500/30 font-mono text-sm">
            <Clock className="w-4 h-4 text-rose-300" />
            <span className="text-[#d1c7bd] text-xs">ESTIMATED WAIT TIME (EWT):</span>
            <span className="text-rose-300 font-bold text-base">
              ~{metrics.ewtMinutes} mins
            </span>
            {metrics.nextSlotExpected && (
              <span className="text-xs text-rose-400/80">
                (Next slot: <strong className="text-white">{metrics.nextSlotExpected}</strong>)
              </span>
            )}
          </div>
        </div>
      )}

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Slots */}
        <div className="glass-panel p-3.5 rounded-2xl border border-[#4a3b32] relative overflow-hidden group hover:border-[#c88a4b]/60 transition-all">
          <div className="flex items-center justify-between text-[#9c8e82] mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Slots</span>
            <Layers className="w-4 h-4 text-[#e0a96d] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Outfit'] text-[#f7f2ee]">
              {metrics.totalSlots}
            </span>
            <span className="text-[10px] text-[#9c8e82] font-mono">RESOURCES</span>
          </div>
          <div className="mt-2 text-[10px] text-[#9c8e82] flex items-center justify-between">
            <span>Dynamic Registry</span>
            <span className="text-[#e0a96d] font-mono">100% Tracked</span>
          </div>
        </div>

        {/* Available Free Slots */}
        <div className="glass-panel p-3.5 rounded-2xl border border-[#2e5228] relative overflow-hidden group hover:border-[#84cc16]/70 transition-all">
          <div className="flex items-center justify-between text-[#84cc16]/90 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Free</span>
            <CheckCircle2 className="w-4 h-4 text-[#84cc16] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Outfit'] text-[#84cc16] text-glow-sage">
              {metrics.availableSlots}
            </span>
            <span className="text-[10px] text-[#84cc16]/80 font-mono">🟢 FREE</span>
          </div>
          <div className="mt-2 text-[10px] text-[#9c8e82] flex items-center justify-between">
            <span>Ready for alloc</span>
            <span className="text-[#84cc16] font-mono">
              {metrics.totalSlots > 0
                ? Math.round((metrics.availableSlots / metrics.totalSlots) * 100)
                : 0}
              %
            </span>
          </div>
        </div>

        {/* Occupied Slots */}
        <div className="glass-panel p-3.5 rounded-2xl border border-[#5e2222] relative overflow-hidden group hover:border-[#ef4444]/70 transition-all">
          <div className="flex items-center justify-between text-[#f87171]/90 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Occupied</span>
            <Car className="w-4 h-4 text-[#f87171] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Outfit'] text-[#f87171] text-glow-crimson">
              {metrics.occupiedSlots}
            </span>
            <span className="text-[10px] text-[#f87171]/80 font-mono">🔴 ACTIVE</span>
          </div>
          <div className="mt-2 text-[10px] text-[#9c8e82] flex items-center justify-between">
            <span>Executing burst</span>
            <span className="text-[#f87171] font-mono">In-use</span>
          </div>
        </div>

        {/* Reserved Slots */}
        <div className="glass-panel p-3.5 rounded-2xl border border-[#593d19] relative overflow-hidden group hover:border-[#f59e0b]/70 transition-all">
          <div className="flex items-center justify-between text-[#f59e0b]/90 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Reserved</span>
            <Bookmark className="w-4 h-4 text-[#f59e0b] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Outfit'] text-[#f59e0b] text-glow-amber">
              {metrics.reservedSlots}
            </span>
            <span className="text-[10px] text-[#f59e0b]/80 font-mono">🟡 10M GRACE</span>
          </div>
          <div className="mt-2 text-[10px] text-[#9c8e82] flex items-center justify-between">
            <span>Auto-release hold</span>
            <span className="text-[#f59e0b] font-mono">Hold</span>
          </div>
        </div>

        {/* Active Demand Status */}
        <div
          className={`p-3.5 rounded-2xl relative overflow-hidden group border transition-all ${
            metrics.isHighDemand
              ? 'bg-[#331818]/60 border-[#ef4444]/40'
              : 'bg-[#291c0e]/60 border-[#d97736]/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#d1c7bd]">
              Demand Status
            </span>
            <TrendingUp
              className={`w-4 h-4 ${
                metrics.isHighDemand ? 'text-[#f87171]' : 'text-[#e0a96d]'
              } group-hover:scale-110 transition-transform`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-bold font-['Outfit'] ${
                metrics.isHighDemand ? 'text-[#f87171]' : 'text-[#e0a96d]'
              }`}
            >
              {metrics.isHighDemand ? 'HIGH DEMAND' : 'LOW DEMAND'}
            </span>
          </div>
          <div className="mt-2 text-[10px] flex items-center justify-between">
            <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-[#16100d] border border-[#4a3b32] text-[#f7f2ee]">
              Formula: {metrics.demandFormula}
            </span>
            <span className="text-[#9c8e82] font-mono">
              {metrics.demandPercent}% (Thresh: {demandThreshold}%)
            </span>
          </div>
        </div>

        {/* System Utilization Rate */}
        <div className="glass-panel p-3.5 rounded-2xl border border-[#4a3b32] relative overflow-hidden group hover:border-[#c88a4b]/60 transition-all">
          <div className="flex items-center justify-between text-[#9c8e82] mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Utilization</span>
            <Gauge className="w-4 h-4 text-[#e0a96d] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-['Outfit'] text-[#f7f2ee]">
              {metrics.utilizationRate}%
            </span>
            <span className="text-[10px] text-[#9c8e82] font-mono">CAPACITY</span>
          </div>
          {/* Visual Mini Progress Bar */}
          <div className="mt-2 w-full bg-[#16100d] rounded-full h-1.5 overflow-hidden border border-[#3a2e26]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.utilizationRate > 85
                  ? 'bg-[#ef4444]'
                  : metrics.utilizationRate > 60
                  ? 'bg-[#f59e0b]'
                  : 'bg-[#84cc16]'
              }`}
              style={{ width: `${Math.min(100, metrics.utilizationRate)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
