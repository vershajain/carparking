import React from 'react';
import { VehiclePCB } from '../core/types';
import {
  X,
  Cpu,
  Clock,
  Layers,
  Sparkles,
  Zap,
  Accessibility,
  LogOut,
  AlertOctagon,
  CheckCircle,
} from 'lucide-react';

interface VehiclePcbModalProps {
  vehicle: VehiclePCB | null;
  currentClock: number;
  onClose: () => void;
  onRelease: (vehicleId: string) => void;
}

export const VehiclePcbModal: React.FC<VehiclePcbModalProps> = ({
  vehicle,
  currentClock,
  onClose,
  onRelease,
}) => {
  if (!vehicle) return null;

  const waitMinutes = Math.max(0, currentClock - vehicle.arrivalTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1e1713] text-[#f7f2ee] border border-[#4a3b32] w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg bg-[#2b211b] text-[#d1c7bd] hover:text-white hover:bg-[#362a23] transition-colors border border-[#4a3b32]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#3a2e26] pb-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#d97736] to-[#c88a4b] flex items-center justify-center font-mono font-bold text-lg text-black shadow-lg shadow-[#d97736]/30">
            <Cpu className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#f7f2ee] font-['Outfit']">
                PCB: {vehicle.id}
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  vehicle.state === 'READY'
                    ? 'bg-blue-950 text-blue-300 border border-blue-700'
                    : vehicle.state === 'PARKED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : vehicle.state === 'OVERSTAY'
                    ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                    : 'bg-[#2b211b] text-[#9c8e82] border border-[#4a3b32]'
                }`}
              >
                STATE: {vehicle.state}
              </span>
            </div>
            <p className="text-xs text-[#d1c7bd] font-mono mt-0.5">
              Plate: <strong className="text-white">{vehicle.licensePlate}</strong> &bull; Category: {vehicle.category}
            </p>
          </div>
        </div>

        {/* OS Process Descriptor Table */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="bg-[#16100d] p-2.5 rounded-xl border border-[#3a2e26]">
            <span className="text-[#9c8e82] text-[10px]">Arrival Time (t_arr)</span>
            <div className="text-white font-bold mt-0.5">+{vehicle.arrivalTime} mins</div>
          </div>
          <div className="bg-[#16100d] p-2.5 rounded-xl border border-[#3a2e26]">
            <span className="text-[#9c8e82] text-[10px]">Burst Duration (t_burst)</span>
            <div className="text-white font-bold mt-0.5">{vehicle.expectedDuration} mins</div>
          </div>
          <div className="bg-[#16100d] p-2.5 rounded-xl border border-[#3a2e26]">
            <span className="text-[#9c8e82] text-[10px]">Current Wait (W)</span>
            <div className="text-[#e0a96d] font-bold mt-0.5">{waitMinutes} mins</div>
          </div>
          <div className="bg-[#16100d] p-2.5 rounded-xl border border-[#3a2e26]">
            <span className="text-[#9c8e82] text-[10px]">Fairness Aging (F)</span>
            <div className="text-[#f59e0b] font-bold mt-0.5">+{vehicle.agingCycles} (Max 100)</div>
          </div>
          <div className="bg-[#16100d] p-2.5 rounded-xl border border-[#3a2e26]">
            <span className="text-[#9c8e82] text-[10px]">Allocated Resource</span>
            <div className="text-[#84cc16] font-bold mt-0.5">
              {vehicle.allocatedSlotId || 'None (Queue)'}
            </div>
          </div>
          <div className="bg-[#16100d] p-2.5 rounded-xl border border-[#3a2e26]">
            <span className="text-[#9c8e82] text-[10px]">Fine Incurred</span>
            <div className={`font-bold mt-0.5 ${vehicle.fineIncurred > 0 ? 'text-[#f87171]' : 'text-[#9c8e82]'}`}>
              ₹{vehicle.fineIncurred}
            </div>
          </div>
        </div>

        {/* Constraints & Requirements */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          {vehicle.isEV && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#162414] text-[#84cc16] border border-[#2e5228] font-semibold">
              <Zap className="w-3.5 h-3.5 text-[#84cc16] fill-[#84cc16]" /> Hard Filter: Requires EV Charger
            </span>
          )}
          {vehicle.needsAccessible && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#182333] text-[#60a5fa] border border-[#233d5e] font-semibold">
              <Accessibility className="w-3.5 h-3.5 text-blue-400" /> Hard Filter: Requires Accessible Slot
            </span>
          )}
          {vehicle.hasReservation && (
            <span className="px-2 py-1 rounded-lg bg-[#291c0e] text-[#f59e0b] border border-[#593d19] font-semibold">
              Active Reservation (10m Grace)
            </span>
          )}
        </div>

        {/* Dynamic Formula Breakdown if calculated */}
        {vehicle.lastScoreBreakdown && (
          <div className="bg-[#16100d] p-3.5 rounded-xl border border-[#4a3b32] space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[#e0a96d]">
              <span className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Latest Priority Evaluation
              </span>
              <span className="text-white font-bold text-sm">
                Score: {vehicle.lastScoreBreakdown.totalScore.toFixed(2)}
              </span>
            </div>
            <div className="p-2 rounded bg-[#231b17] border border-[#3a2e26] text-[11px] text-[#e0a96d]">
              <code>{vehicle.lastScoreBreakdown.formattedString}</code>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[#3a2e26] pt-4">
          {vehicle.state === 'PARKED' || vehicle.state === 'OVERSTAY' ? (
            <button
              onClick={() => {
                onRelease(vehicle.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Evict / Release from Slot</span>
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#2b211b] hover:bg-[#362a23] text-[#d1c7bd] text-xs font-medium border border-[#4a3b32] transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
