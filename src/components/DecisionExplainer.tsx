import React from 'react';
import { SchedulingDecision } from '../core/types';
import {
  HelpCircle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';

interface DecisionExplainerProps {
  decision: SchedulingDecision | null;
  onSelectSlot?: (slotId: string) => void;
}

export const DecisionExplainer: React.FC<DecisionExplainerProps> = ({
  decision,
  onSelectSlot,
}) => {
  if (!decision) {
    return (
      <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-[#3a2e26] pb-3">
          <div className="p-2 rounded-lg bg-[#d97736]/20 text-[#e0a96d] border border-[#d97736]/30">
            <Cpu className="w-5 h-5 text-[#e0a96d]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#f7f2ee] tracking-wide font-['Outfit']">
              ALLOCATION DECISION EXPLAINER
            </h2>
            <p className="text-xs text-[#d1c7bd]">
              Deterministic OS Scheduler Trace & Mathematical Viva Proof
            </p>
          </div>
        </div>
        <div className="text-center py-8 bg-[#16100d]/60 rounded-xl border border-dashed border-[#4a3b32] text-[#9c8e82] font-mono text-xs">
          No scheduling cycles executed yet. Advance clock or spawn processes to generate decision trace.
        </div>
      </div>
    );
  }

  const isHighDemand = decision.demandCondition === 'HIGH DEMAND';

  return (
    <div className="glass-panel-glow p-5 rounded-2xl shadow-2xl space-y-5 bg-gradient-to-b from-[#231b17] to-[#1a1412]">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#4a3b32] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#d97736]/20 text-[#e0a96d] border border-[#d97736]/40 shadow-md shadow-[#d97736]/20">
            <Cpu className="w-5 h-5 text-[#e0a96d] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#f7f2ee] tracking-wide font-['Outfit']">
                ALLOCATION DECISION EXPLAINER
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2b211b] text-[#e0a96d] border border-[#d97736]/60">
                CYCLE #{decision.cycleNumber} @ T={decision.timestamp}m
              </span>
            </div>
            <p className="text-xs text-[#d1c7bd]">
              100% Explainable OS Resource Allocation Pipeline (Viva Showcase)
            </p>
          </div>
        </div>

        {/* Demand Formula Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-xl font-mono text-xs font-bold border flex items-center gap-1.5 ${
              isHighDemand
                ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                : 'bg-[#162414] text-[#84cc16] border-[#2e5228]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {decision.demandCondition} &rarr; Formula {decision.formulaUsed}
          </span>
        </div>
      </div>

      {/* 3-Step Summary Pipeline Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Step 1: Demand Classification */}
        <div className="bg-[#16100d] p-3 rounded-xl border border-[#3a2e26] space-y-1">
          <div className="text-[10px] uppercase font-mono text-[#9c8e82] font-semibold">
            Step 1: Zone Congestion
          </div>
          <div className="font-bold text-sm text-[#f7f2ee] flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isHighDemand ? 'bg-[#ef4444]' : 'bg-[#84cc16]'
              }`}
            />
            {decision.demandCondition}
          </div>
          <p className="text-[11px] text-[#9c8e82]">
            Queue Size: <strong className="text-white">{decision.queueSizeAtDecision}</strong> waiting
          </p>
        </div>

        {/* Step 2: Vehicle Priority Popped */}
        <div className="bg-[#16100d] p-3 rounded-xl border border-[#d97736]/40 space-y-1">
          <div className="text-[10px] uppercase font-mono text-[#e0a96d] font-semibold">
            Step 2: Top Process Popped
          </div>
          <div className="font-bold text-sm text-[#e0a96d] flex items-center gap-1.5 font-mono">
            <Award className="w-4 h-4 text-[#d97736]" />
            {decision.selectedVehicleId} ({decision.selectedVehicleCategory})
          </div>
          <p className="text-[11px] text-[#d1c7bd] font-mono">
            Priority Score: <strong className="text-white">{decision.vehiclePriorityScore.toFixed(2)}</strong> (Max in heap)
          </p>
        </div>

        {/* Step 3: Slot Assigned */}
        <div className="bg-[#16100d] p-3 rounded-xl border border-[#2e5228] space-y-1">
          <div className="text-[10px] uppercase font-mono text-[#84cc16] font-semibold">
            Step 3: Best-Fit Resource
          </div>
          <div className="font-bold text-sm text-[#84cc16] flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-4 h-4 text-[#84cc16]" />
            {decision.assignedSlotId ? `Assigned to ${decision.assignedSlotId}` : 'No Slot Free'}
          </div>
          <p className="text-[11px] text-[#d1c7bd] font-mono">
            {decision.assignedSlotId
              ? `Selected from ${decision.candidateSlots.length} compatible candidates`
              : 'Process kept in Ready Queue'}
          </p>
        </div>
      </div>

      {/* Rationale Narration Card */}
      <div className="bg-[#16100d] p-3.5 rounded-xl border border-[#4a3b32] text-xs text-[#d1c7bd] space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-[#e0a96d] font-mono text-[11px] uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#d97736]" />
          Deterministic Rationale
        </div>
        <p className="leading-relaxed font-sans text-[#f7f2ee]">
          {decision.rationale}
        </p>
      </div>

      {/* Candidate Slots Comparison Table */}
      {decision.candidateSlots.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#f7f2ee] font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#e0a96d]" />
              CANDIDATE RESOURCE SUITABILITY EVALUATION TABLE
            </span>
            <span className="text-[11px] text-[#9c8e82]">
              Formula: 0.40(100 - Dist) + 0.30(100 - Demand) + 0.30(Fit)
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#3a2e26] bg-[#16100d]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#1f1612] text-[#9c8e82] text-[10px] uppercase border-b border-[#3a2e26]">
                <tr>
                  <th className="py-2.5 px-3">Slot ID</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Dist (0.40)</th>
                  <th className="py-2.5 px-3">Demand (0.30)</th>
                  <th className="py-2.5 px-3">Fit (0.30)</th>
                  <th className="py-2.5 px-3 text-right">Suitability Score</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e231c] text-[11px]">
                {decision.candidateSlots.map((cs) => {
                  return (
                    <tr
                      key={cs.slotId}
                      className={
                        cs.chosen
                          ? 'bg-[#162414] text-[#84cc16]'
                          : 'hover:bg-[#231b17] text-[#d1c7bd]'
                      }
                    >
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                        {cs.slotId}
                        {cs.chosen && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16] inline-block animate-ping" />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#9c8e82]">{cs.zone}</td>
                      <td className="py-2.5 px-3">{cs.type}</td>
                      <td className="py-2.5 px-3 text-[#d1c7bd]">
                        {cs.distance}m ({(100 - cs.normalizedDistance).toFixed(0)})
                      </td>
                      <td className="py-2.5 px-3 text-[#d1c7bd]">
                        {cs.zoneDemand}% ({(100 - cs.zoneDemand).toFixed(0)})
                      </td>
                      <td className="py-2.5 px-3 text-[#d1c7bd]">{cs.slotFitScore}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#e0a96d]">
                        {cs.totalScore.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {cs.chosen ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1e331b] text-[#84cc16] border border-[#2e5228]">
                            ALLOCATED
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#9c8e82] font-mono">
                            ALTERNATIVE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
