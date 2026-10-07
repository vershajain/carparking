import React, { useState, useEffect } from 'react';
import { SlotType, SlotState, ParkingSlotResource } from '../core/types';
import {
  X,
  Layers,
  PlusCircle,
  Zap,
  Accessibility,
  Crown,
  MapPin,
  CheckCircle,
  Wrench,
  Bookmark,
  FolderPlus,
} from 'lucide-react';

interface AddSlotModalProps {
  isOpen: boolean;
  existingSlots: ParkingSlotResource[];
  onClose: () => void;
  onAddSlot: (slotData: {
    id: string;
    zone: string;
    type: SlotType;
    distance: number;
    state?: SlotState;
  }) => void;
}

export const AddSlotModal: React.FC<AddSlotModalProps> = ({
  isOpen,
  existingSlots,
  onClose,
  onAddSlot,
}) => {
  if (!isOpen) return null;

  const existingZones = Array.from(new Set(existingSlots.map((s) => s.zone))).sort();

  // Mode: 'SINGLE_SLOT' or 'NEW_ZONE'
  const [mode, setMode] = useState<'SINGLE_SLOT' | 'NEW_ZONE'>('SINGLE_SLOT');

  const [selectedZone, setSelectedZone] = useState<string>(existingZones[0] || 'Zone A');
  const [newZoneName, setNewZoneName] = useState<string>('Zone D');
  const [slotId, setSlotId] = useState<string>('');
  const [slotType, setSlotType] = useState<SlotType>('STANDARD');
  const [distance, setDistance] = useState<number>(30);
  const [initialState, setInitialState] = useState<SlotState>('FREE');

  // Auto-generate slot ID based on zone selection
  useEffect(() => {
    const activeZone = mode === 'SINGLE_SLOT' ? selectedZone : newZoneName;
    // Extract letter or prefix from zone
    const match = activeZone.match(/Zone\s*([A-Za-z0-9]+)/i);
    const zoneKey = match ? match[1].toUpperCase() : activeZone.substring(0, 1).toUpperCase();

    // Count existing slots in this zone
    const slotsInZone = existingSlots.filter((s) => s.zone === activeZone);
    const nextNum = slotsInZone.length + 1;
    const suggestedId = `SLOT-${zoneKey}${nextNum.toString().padStart(2, '0')}`;
    setSlotId(suggestedId);

    // Auto set estimated distance based on zone
    if (activeZone.includes('A')) setDistance(25);
    else if (activeZone.includes('B')) setDistance(55);
    else if (activeZone.includes('C')) setDistance(90);
    else setDistance(110);
  }, [selectedZone, newZoneName, mode, existingSlots]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalZone = mode === 'SINGLE_SLOT' ? selectedZone : newZoneName.trim() || 'Zone D';
    const finalId = slotId.trim() || `SLOT-${Date.now().toString().slice(-4)}`;

    onAddSlot({
      id: finalId,
      zone: finalZone,
      type: slotType,
      distance: Number(distance) || 30,
      state: initialState,
    });
    onClose();
  };

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
        <div className="flex items-center gap-3 border-b border-[#3a2e26] pb-3">
          <div className="p-2.5 rounded-xl bg-[#d97736]/20 text-[#e0a96d] border border-[#d97736]/40 shadow-lg shadow-[#d97736]/20">
            <PlusCircle className="w-5 h-5 text-[#e0a96d]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#f7f2ee] font-['Outfit']">
              HOT-PLUG RESOURCE EXPANSION
            </h3>
            <p className="text-xs text-[#d1c7bd]">
              Dynamically add new physical memory blocks / parking slots to the OS scheduler
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#16100d] rounded-xl border border-[#3a2e26]">
          <button
            type="button"
            onClick={() => setMode('SINGLE_SLOT')}
            className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'SINGLE_SLOT'
                ? 'bg-[#d97736] text-black shadow-md font-bold'
                : 'text-[#d1c7bd] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Add Single Slot</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('NEW_ZONE')}
            className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'NEW_ZONE'
                ? 'bg-[#d97736] text-black shadow-md font-bold'
                : 'text-[#d1c7bd] hover:text-white'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Create New Zone</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {/* Zone Selection or New Zone Input */}
          {mode === 'SINGLE_SLOT' ? (
            <div>
              <label className="text-[#d1c7bd] block mb-1">
                Target Parking Zone:
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full bg-[#16100d] border border-[#4a3b32] rounded-xl p-2.5 text-[#f7f2ee] focus:outline-none focus:border-[#d97736]"
              >
                {existingZones.map((z) => (
                  <option key={z} value={z}>
                    {z} ({existingSlots.filter((s) => s.zone === z).length} existing slots)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-[#d1c7bd] block mb-1">
                New Zone Name / Identifier:
              </label>
              <input
                type="text"
                placeholder="e.g. Zone D - Rooftop Deck"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                className="w-full bg-[#16100d] border border-[#4a3b32] rounded-xl p-2.5 text-[#f7f2ee] focus:outline-none focus:border-[#d97736]"
              />
            </div>
          )}

          {/* Slot ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#d1c7bd]">Slot Identifier:</label>
              <span className="text-[10px] text-[#9c8e82]">Auto-calculated</span>
            </div>
            <input
              type="text"
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              className="w-full bg-[#16100d] border border-[#4a3b32] rounded-xl p-2.5 text-[#f7f2ee] font-bold focus:outline-none focus:border-[#d97736]"
            />
          </div>

          {/* Slot Capabilities / Type */}
          <div>
            <label className="text-[#d1c7bd] block mb-1.5 font-bold">
              Resource Block Type & Hard Constraints:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'STANDARD', label: '🚗 Standard (STD)', icon: Layers },
                { type: 'EV_CHARGER', label: '⚡ EV Charger (EV)', icon: Zap },
                { type: 'ACCESSIBLE', label: '♿ Accessible (ACC)', icon: Accessibility },
                { type: 'VIP', label: '👑 VIP Bay (VIP)', icon: Crown },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSlotType(type as SlotType)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-1.5 ${
                    slotType === type
                      ? 'bg-[#d97736]/20 border-[#d97736] text-[#e0a96d] font-bold shadow-md'
                      : 'bg-[#16100d] border-[#3a2e26] text-[#d1c7bd] hover:bg-[#2b211b]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-[#e0a96d]" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Distance from Entrance Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#d1c7bd]">
                Distance from Entry: <strong className="text-[#e0a96d]">{distance}m</strong>
              </label>
              <span className="text-[10px] text-[#9c8e82]">
                Suitability Weight: 0.40 × (100 - Dist)
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="150"
              step="5"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="w-full accent-[#d97736] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#9c8e82] mt-0.5">
              <span>5m (Very Close)</span>
              <span>150m (Distant / Overflow)</span>
            </div>
          </div>

          {/* Initial State Selector */}
          <div>
            <label className="text-[#d1c7bd] block mb-1.5">Initial Allocation State:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { s: 'FREE', label: '🟢 FREE', desc: 'Ready for allocation' },
                { s: 'RESERVED', label: '🟡 RESERVED', desc: 'Hold for reservation' },
                { s: 'MAINTENANCE', label: '⚫ OFFLINE', desc: 'Maintenance mode' },
              ].map(({ s, label }) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInitialState(s as SlotState)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    initialState === s
                      ? 'bg-[#d97736]/25 border-[#d97736] text-[#f7f2ee] font-bold'
                      : 'bg-[#16100d] border-[#3a2e26] text-[#d1c7bd] hover:bg-[#2b211b]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit & Cancel */}
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
              className="px-5 py-2 rounded-xl bg-[#d97736] hover:bg-[#c88a4b] text-black font-bold text-xs shadow-lg shadow-[#d97736]/30 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Plug Resource Block</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
