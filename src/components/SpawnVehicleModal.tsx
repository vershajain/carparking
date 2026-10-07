import React, { useState } from 'react';
import { VehicleCategory } from '../core/types';
import {
  X,
  PlusCircle,
  Zap,
  Accessibility,
  Bookmark,
  Car,
  Ambulance,
  Flame,
  ShieldAlert,
  Crown,
} from 'lucide-react';

interface SpawnVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpawn: (params: {
    category: VehicleCategory;
    isEV: boolean;
    needsAccessible: boolean;
    expectedDuration: number;
    hasReservation: boolean;
    licensePlate?: string;
  }) => void;
}

export const SpawnVehicleModal: React.FC<SpawnVehicleModalProps> = ({
  isOpen,
  onClose,
  onSpawn,
}) => {
  if (!isOpen) return null;

  const [category, setCategory] = useState<VehicleCategory>('NORMAL');
  const [isEV, setIsEV] = useState<boolean>(false);
  const [needsAccessible, setNeedsAccessible] = useState<boolean>(false);
  const [hasReservation, setHasReservation] = useState<boolean>(false);
  const [expectedDuration, setExpectedDuration] = useState<number>(30);
  const [licensePlate, setLicensePlate] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSpawn({
      category,
      isEV,
      needsAccessible,
      expectedDuration: Number(expectedDuration) || 30,
      hasReservation,
      licensePlate: licensePlate.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1e1713] text-[#f7f2ee] border border-[#4a3b32] w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-5">
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
            <PlusCircle className="w-5 h-5 text-[#e0a96d]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#f7f2ee] font-['Outfit']">
              SPAWN NEW PROCESS (VEHICLE)
            </h3>
            <p className="text-xs text-[#d1c7bd]">
              Inject a new task with resource constraints into the Ready Queue
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {/* Category / Urgency Selection */}
          <div>
            <label className="text-[#d1c7bd] block mb-1.5 font-bold">
              Process Category & Urgency (U):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { cat: 'AMBULANCE', label: '🚑 Ambulance (100)' },
                { cat: 'FIRE_TRUCK', label: '🚒 Fire Truck (95)' },
                { cat: 'POLICE', label: '🚓 Police (90)' },
                { cat: 'VIP', label: '⭐ VIP / Auth (70)' },
                { cat: 'DISABLED', label: '♿ Disabled (65)' },
                { cat: 'NORMAL', label: '🚗 Normal (40)' },
              ].map(({ cat, label }) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat as VehicleCategory);
                    if (cat === 'DISABLED') setNeedsAccessible(true);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    category === cat
                      ? 'bg-[#d97736]/20 border-[#d97736] text-[#e0a96d] font-bold shadow-md'
                      : 'bg-[#16100d] border-[#3a2e26] text-[#d1c7bd] hover:bg-[#2b211b]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* License Plate (Optional) */}
          <div>
            <label className="text-[#d1c7bd] block mb-1">
              Vehicle Identifier / Plate (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. DL-01-AB-1234"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="w-full bg-[#16100d] border border-[#4a3b32] rounded-xl p-2.5 text-[#f7f2ee] focus:outline-none focus:border-[#d97736]"
            />
          </div>

          {/* Burst Duration */}
          <div>
            <label className="text-[#d1c7bd] block mb-1">
              Expected Burst Duration: <strong className="text-[#e0a96d]">{expectedDuration} mins</strong>
            </label>
            <input
              type="range"
              min="15"
              max="180"
              step="15"
              value={expectedDuration}
              onChange={(e) => setExpectedDuration(Number(e.target.value))}
              className="w-full accent-[#d97736] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#9c8e82] mt-0.5">
              <span>15m (High Turnover)</span>
              <span>180m (Long Stay)</span>
            </div>
          </div>

          {/* Resource Constraints Checkboxes */}
          <div className="space-y-2 bg-[#16100d] p-3 rounded-xl border border-[#3a2e26]">
            <label className="flex items-center gap-2 cursor-pointer text-[#d1c7bd] hover:text-white">
              <input
                type="checkbox"
                checked={isEV}
                onChange={(e) => setIsEV(e.target.checked)}
                className="w-4 h-4 accent-[#d97736] rounded"
              />
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#84cc16] fill-[#84cc16]" />
                Electric Vehicle (Hard Filter: Requires EV Charger)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-[#d1c7bd] hover:text-white">
              <input
                type="checkbox"
                checked={needsAccessible}
                onChange={(e) => setNeedsAccessible(e.target.checked)}
                className="w-4 h-4 accent-[#d97736] rounded"
              />
              <span className="flex items-center gap-1">
                <Accessibility className="w-3.5 h-3.5 text-blue-400" />
                Wheelchair Accessible (Hard Filter: Requires Accessible Slot)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-[#d1c7bd] hover:text-white">
              <input
                type="checkbox"
                checked={hasReservation}
                onChange={(e) => setHasReservation(e.target.checked)}
                className="w-4 h-4 accent-[#d97736] rounded"
              />
              <span className="flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                Valid Active Reservation (R = 100 Factor Bonus)
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 border-t border-[#3a2e26] pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#2b211b] hover:bg-[#362a23] text-[#d1c7bd] text-xs font-medium border border-[#4a3b32]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#d97736] hover:bg-[#c88a4b] text-black font-bold text-xs shadow-lg shadow-[#d97736]/30"
            >
              Enqueue Process
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
