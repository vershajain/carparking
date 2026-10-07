import React, { useState } from 'react';
import { SchedulerConfig } from '../core/types';
import {
  X,
  Sliders,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Ambulance,
  Flame,
} from 'lucide-react';

interface AdminConfigModalProps {
  config: SchedulerConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: SchedulerConfig) => void;
  onResetDefaults: () => void;
  onTriggerRushHour: () => void;
  onTriggerStarvationTest: () => void;
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({
  config,
  isOpen,
  onClose,
  onSave,
  onResetDefaults,
  onTriggerRushHour,
  onTriggerStarvationTest,
}) => {
  if (!isOpen) return null;

  const [localConfig, setLocalConfig] = useState<SchedulerConfig>({ ...config });

  const lowWeightsSum =
    localConfig.weightsLow.w +
    localConfig.weightsLow.u +
    localConfig.weightsLow.r +
    localConfig.weightsLow.f +
    localConfig.weightsLow.v;

  const highWeightsSum =
    localConfig.weightsHigh.w +
    localConfig.weightsHigh.u +
    localConfig.weightsHigh.r +
    localConfig.weightsHigh.f +
    localConfig.weightsHigh.v;

  const isLowValid = Math.abs(lowWeightsSum - 1.0) < 0.01;
  const isHighValid = Math.abs(highWeightsSum - 1.0) < 0.01;

  const handleLowWeightChange = (key: keyof SchedulerConfig['weightsLow'], val: number) => {
    setLocalConfig((prev) => ({
      ...prev,
      weightsLow: {
        ...prev.weightsLow,
        [key]: Math.round(val * 100) / 100,
      },
    }));
  };

  const handleHighWeightChange = (key: keyof SchedulerConfig['weightsHigh'], val: number) => {
    setLocalConfig((prev) => ({
      ...prev,
      weightsHigh: {
        ...prev.weightsHigh,
        [key]: Math.round(val * 100) / 100,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1e1713] text-[#f7f2ee] border border-[#4a3b32] w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg bg-[#2b211b] text-[#d1c7bd] hover:text-white hover:bg-[#362a23] transition-colors border border-[#4a3b32]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#3a2e26] pb-3">
          <div className="p-2.5 rounded-xl bg-[#d97736]/20 text-[#e0a96d] border border-[#d97736]/30">
            <Sliders className="w-5 h-5 text-[#e0a96d]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#f7f2ee] font-['Outfit']">
              OS SCHEDULER SYSTEM CONFIGURATION
            </h3>
            <p className="text-xs text-[#d1c7bd]">
              Tune dynamic weight formulas ($P_L$, $P_H$), congestion thresholds, and penalties
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Threshold & Policy Parameters */}
          <div className="bg-[#16100d] p-4 rounded-xl border border-[#3a2e26] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#e0a96d] font-mono">
              1. Demand Classification & Timers
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <label className="text-[#d1c7bd] block mb-1">
                  Demand Threshold: <strong className="text-white">{localConfig.demandThreshold}%</strong>
                </label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={localConfig.demandThreshold}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, demandThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-[#d97736] cursor-pointer"
                />
                <span className="text-[10px] text-[#9c8e82]">
                  Queue/Free ratio switch point
                </span>
              </div>

              <div>
                <label className="text-[#d1c7bd] block mb-1">
                  Reservation Grace: <strong className="text-white">{localConfig.reservationGracePeriod}m</strong>
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={localConfig.reservationGracePeriod}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      reservationGracePeriod: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#1e1713] border border-[#4a3b32] rounded-lg p-1.5 text-white"
                />
                <span className="text-[10px] text-[#9c8e82]">Auto-release timeout</span>
              </div>

              <div>
                <label className="text-[#d1c7bd] block mb-1">
                  Fine Rate: <strong className="text-white">₹{localConfig.fineRatePerMinute}/min</strong>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={localConfig.fineRatePerMinute}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      fineRatePerMinute: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#1e1713] border border-[#4a3b32] rounded-lg p-1.5 text-white"
                />
                <span className="text-[10px] text-[#9c8e82]">Overstay penalty rate</span>
              </div>
            </div>
          </div>

          {/* Section 2: Low Demand Formula Weights (P_L) */}
          <div className="bg-[#16100d] p-4 rounded-xl border border-[#3a2e26] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#84cc16] flex items-center gap-1.5 uppercase text-xs">
                2. Low Demand Formula ($P_L$) Weights
              </h4>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isLowValid
                    ? 'bg-[#162414] text-[#84cc16] border border-[#2e5228]'
                    : 'bg-[#2b1212] text-[#f87171] border border-[#5e2222]'
                }`}
              >
                Sum = {lowWeightsSum.toFixed(2)} (Target: 1.0)
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
              <div>
                <label className="text-[#9c8e82] block">Wait (W)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={localConfig.weightsLow.w}
                  onChange={(e) => handleLowWeightChange('w', Number(e.target.value))}
                  className="w-full bg-[#1e1713] border border-[#4a3b32] rounded p-1 text-center font-bold text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[#9c8e82] block">Urgency (U)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={localConfig.weightsLow.u}
                  onChange={(e) => handleLowWeightChange('u', Number(e.target.value))}
                  className="w-full bg-[#1e1713] border border-[#4a3b32] rounded p-1 text-center font-bold text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[#9c8e82] block">Reserve (R)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={localConfig.weightsLow.r}
                  onChange={(e) => handleLowWeightChange('r', Number(e.target.value))}
                  className="w-full bg-[#1e1713] border border-[#4a3b32] rounded p-1 text-center font-bold text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[#9c8e82] block">Aging (F)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={localConfig.weightsLow.f}
                  onChange={(e) => handleLowWeightChange('f', Number(e.target.value))}
                  className="w-full bg-[#1e1713] border border-[#4a3b32] rounded p-1 text-center font-bold text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[#9c8e82] block">Turnover (V)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={localConfig.weightsLow.v}
                  onChange={(e) => handleLowWeightChange('v', Number(e.target.value))}
                  className="w-full bg-[#1e1713] border border-[#4a3b32] rounded p-1 text-center font-bold text-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Section 3: High Demand Formula Weights (P_H) */}
          <div className="bg-[#16100d] p-4 rounded-xl border border-[#3a2e26] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#f87171] flex items-center gap-1.5 uppercase text-xs">
                3. High Demand Formula ($P_H$) Weights
              </h4>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isHighValid
                    ? 'bg-[#162414] text-[#84cc16] border border-[#2e5228]'
                    : 'bg-[#2b1212] text-[#f87171] border border-[#5e2222]'
                }`}
              >
                Sum = {highWeightsSum.toFixed(2)} (Target: 1.0)
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
              <div>
                <label className="text-[#9c8e82] block">Wait (W)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={localConfig.weightsHigh.w}
                  onChange={(e) => handleHighWeightChange('w', Number(e.target.value))}
                  className="w-full bg-[#1e1713] border border-[#4a3b32] rounded p-1 text-center font-bold text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[#9c8e82] block">Urgency (U)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={localConfig.weightsHigh.u}
                  onChange={(e) => handleHighWeightChange('u', Number(e.target.value))}
                  className="w-full bg-[#1e1713] border border-[#4a3b32] rounded p-1 text-center font-bold text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[#9c8e82] block">Reserve (R)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={localConfig.weightsHigh.r}
                  onChange={(e) => handleHighWeightChange('r', Number(e.target.value))}
                  className="w-full bg-[#1e1713] border border-[#4a3b32] rounded p-1 text-center font-bold text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[#9c8e82] block">Aging (F)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={localConfig.weightsHigh.f}
                  onChange={(e) => handleHighWeightChange('f', Number(e.target.value))}
                  className="w-full bg-[#1e1713] border border-[#4a3b32] rounded p-1 text-center font-bold text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[#9c8e82] block">Turnover (V)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={localConfig.weightsHigh.v}
                  onChange={(e) => handleHighWeightChange('v', Number(e.target.value))}
                  className="w-full bg-[#1e1713] border border-[#4a3b32] rounded p-1 text-center font-bold text-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Live Demonstration Presets */}
          <div className="bg-[#16100d] p-3.5 rounded-xl border border-[#3a2e26] space-y-2">
            <span className="text-xs font-bold text-[#d1c7bd] font-mono uppercase">
              Viva Demonstration Quick Scenarios
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onTriggerRushHour();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#d97736]/20 hover:bg-[#d97736]/30 text-[#e0a96d] border border-[#d97736]/40 text-xs flex items-center gap-1.5 font-mono"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Simulate Rush Hour (Trigger P_H)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onTriggerStarvationTest();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[#f59e0b] border border-amber-500/30 text-xs flex items-center gap-1.5 font-mono"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Starvation Aging Test</span>
              </button>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between border-t border-[#3a2e26] pt-4">
            <button
              type="button"
              onClick={onResetDefaults}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2b211b] hover:bg-[#362a23] text-[#9c8e82] hover:text-white text-xs font-mono transition-colors border border-[#4a3b32]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#2b211b] hover:bg-[#362a23] text-[#d1c7bd] text-xs font-medium border border-[#4a3b32]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isLowValid || !isHighValid}
                className="px-5 py-2 rounded-xl bg-[#d97736] hover:bg-[#c88a4b] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs transition-colors shadow-lg shadow-[#d97736]/30"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
