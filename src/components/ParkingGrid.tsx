import React from 'react';
import {
  ParkingSlotResource,
  VehiclePCB,
  SlotState,
  SlotType,
} from '../core/types';
import {
  Zap,
  Accessibility,
  Crown,
  Clock,
  MapPin,
  Wrench,
  CheckCircle,
  AlertCircle,
  Timer,
  PlusCircle,
  Layers,
} from 'lucide-react';

interface ParkingGridProps {
  slots: ParkingSlotResource[];
  vehicles: VehiclePCB[];
  currentClock: number;
  onSlotClick: (slot: ParkingSlotResource) => void;
  onOpenAddSlotModal: () => void;
}

export const ParkingGrid: React.FC<ParkingGridProps> = ({
  slots,
  vehicles,
  currentClock,
  onSlotClick,
  onOpenAddSlotModal,
}) => {
  // Group slots by Zone (Zone A, Zone B, Zone C, etc.)
  const zones = Array.from(new Set(slots.map((s) => s.zone))).sort();

  const getSlotStateMeta = (state: SlotState) => {
    switch (state) {
      case 'FREE':
        return {
          bg: 'bg-[#1a2818]/40 hover:bg-[#233820]/60',
          border: 'border-[#4ade80]/40 hover:border-[#84cc16]',
          indicator: 'bg-[#84cc16]',
          label: 'FREE',
          textColor: 'text-[#84cc16]',
          badgeBg: 'bg-[#162414] text-[#84cc16] border-[#2e5228]',
        };
      case 'OCCUPIED':
        return {
          bg: 'bg-[#331818]/40 hover:bg-[#451f1f]/60',
          border: 'border-[#ef4444]/40 hover:border-[#f87171]',
          indicator: 'bg-[#ef4444] animate-pulse',
          label: 'OCCUPIED',
          textColor: 'text-[#f87171]',
          badgeBg: 'bg-[#2b1212] text-[#f87171] border-[#5e2222]',
        };
      case 'RESERVED':
        return {
          bg: 'bg-[#332514]/40 hover:bg-[#453118]/60',
          border: 'border-[#f59e0b]/40 hover:border-[#fbbf24]',
          indicator: 'bg-[#f59e0b] animate-pulse',
          label: 'RESERVED',
          textColor: 'text-[#f59e0b]',
          badgeBg: 'bg-[#291c0e] text-[#f59e0b] border-[#593d19]',
        };
      case 'MAINTENANCE':
        return {
          bg: 'bg-[#1e1713]/50 hover:bg-[#2b211b]',
          border: 'border-[#4a3b32] hover:border-[#634f43]',
          indicator: 'bg-[#786b63]',
          label: 'OFFLINE',
          textColor: 'text-[#9c8e82]',
          badgeBg: 'bg-[#1e1713] text-[#9c8e82] border-[#3a2e26]',
        };
    }
  };

  const getTypeIcon = (type: SlotType) => {
    switch (type) {
      case 'EV_CHARGER':
        return (
          <span
            className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#162414] text-[#84cc16] border border-[#2e5228]"
            title="EV Fast Charging Port"
          >
            <Zap className="w-3 h-3 text-[#84cc16] fill-[#84cc16]" /> EV
          </span>
        );
      case 'ACCESSIBLE':
        return (
          <span
            className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#182333] text-[#60a5fa] border border-[#233d5e]"
            title="Wheelchair Accessible Bay"
          >
            <Accessibility className="w-3 h-3 text-[#60a5fa]" /> ACC
          </span>
        );
      case 'VIP':
        return (
          <span
            className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#291c0e] text-[#e0a96d] border border-[#593d19]"
            title="Designated VIP Bay"
          >
            <Crown className="w-3 h-3 text-[#e0a96d]" /> VIP
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono text-[#9c8e82] px-1 py-0.5 rounded bg-[#16100d] border border-[#3a2e26]">
            STD
          </span>
        );
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-6">
      {/* Title, Actions & Legend Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3a2e26] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#f7f2ee] tracking-wide font-['Outfit']">
              RESOURCE MAP <span className="text-[#9c8e82] text-sm font-normal">(Parking Memory Grid)</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-[#2b211b] text-[#d1c7bd] border border-[#4a3b32]">
              {slots.length} Blocks Total
            </span>
          </div>
          <p className="text-xs text-[#d1c7bd] mt-0.5">
            Real-time physical slot allocation registry. Click any slot to inspect PCB or toggle maintenance.
          </p>
        </div>

        {/* Action Button: Hot-Plug Slot / Zone Expansion */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenAddSlotModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d97736] hover:bg-[#c88a4b] text-black font-bold text-xs shadow-md shadow-[#d97736]/30 transition-all font-mono"
            title="Hot-Plug Resource: Add Slot or New Zone"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Slot / Zone</span>
          </button>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#162414] border border-[#2e5228] text-[#84cc16]">
              <span className="w-2 h-2 rounded-full bg-[#84cc16]" /> FREE
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#2b1212] border border-[#5e2222] text-[#f87171]">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> OCCUPIED
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#291c0e] border border-[#593d19] text-[#f59e0b]">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> RESERVED
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1e1713] border border-[#3a2e26] text-[#9c8e82]">
              <span className="w-2 h-2 rounded-full bg-[#786b63]" /> OFFLINE
            </div>
          </div>
        </div>
      </div>

      {/* Grid Grouped by Zone */}
      <div className="space-y-6">
        {zones.map((zone) => {
          const zoneSlots = slots.filter((s) => s.zone === zone);
          const freeInZone = zoneSlots.filter((s) => s.state === 'FREE').length;

          return (
            <div key={zone} className="space-y-3">
              {/* Zone Subtitle */}
              <div className="flex items-center justify-between text-xs border-l-2 border-[#d97736] pl-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#f7f2ee] tracking-wider font-mono text-sm uppercase">
                    {zone}
                  </span>
                  <span className="text-[#9c8e82] font-mono">
                    ({freeInZone}/{zoneSlots.length} available)
                  </span>
                </div>
                <div className="text-[#9c8e82] font-mono text-[11px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#d97736]" />
                  <span>Entry proximity: ~{Math.min(...zoneSlots.map((s) => s.distance))}m</span>
                </div>
              </div>

              {/* Slots Row / Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {zoneSlots.map((slot) => {
                  const meta = getSlotStateMeta(slot.state);
                  const vehicle = vehicles.find((v) => v.id === slot.currentVehicleId);
                  const reservedVeh = vehicles.find((v) => v.id === slot.reservedForVehicleId);

                  // Calculate time remaining if occupied
                  const timeRemaining =
                    slot.expectedReleaseTime !== null
                      ? Math.max(0, slot.expectedReleaseTime - currentClock)
                      : null;

                  // Reservation grace remaining
                  const graceRemaining =
                    slot.reservationExpiresAt !== null
                      ? Math.max(0, slot.reservationExpiresAt - currentClock)
                      : null;

                  return (
                    <button
                      key={slot.id}
                      onClick={() => onSlotClick(slot)}
                      className={`text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer relative group flex flex-col justify-between min-h-[120px] ${meta.bg} ${meta.border}`}
                    >
                      {/* Top Bar: Slot ID & Capabilities */}
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${meta.indicator}`} />
                          <span className="font-mono font-bold text-xs text-white group-hover:text-[#e0a96d]">
                            {slot.id}
                          </span>
                        </div>
                        {getTypeIcon(slot.type)}
                      </div>

                      {/* Middle: Occupant / Reservation Info */}
                      <div className="my-2">
                        {slot.state === 'OCCUPIED' && vehicle ? (
                          <div className="space-y-1">
                            <div className="font-mono text-xs font-semibold text-[#f87171] truncate">
                              {vehicle.id}
                            </div>
                            <div className="text-[10px] text-[#d1c7bd] truncate font-mono">
                              {vehicle.licensePlate}
                            </div>
                          </div>
                        ) : slot.state === 'RESERVED' ? (
                          <div className="space-y-1">
                            <div className="font-mono text-xs font-semibold text-[#f59e0b] truncate">
                              {slot.reservedForVehicleId || 'Reserved'}
                            </div>
                            <div className="text-[10px] text-[#e0a96d] font-mono">
                              Grace: {graceRemaining}m left
                            </div>
                          </div>
                        ) : slot.state === 'MAINTENANCE' ? (
                          <div className="text-[10px] text-[#9c8e82] font-mono flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Offline
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono text-[#84cc16] flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-[#84cc16]" /> Ready
                          </div>
                        )}
                      </div>

                      {/* Bottom Bar: Distance & Timers */}
                      <div className="flex items-center justify-between text-[10px] text-[#9c8e82] font-mono border-t border-[#3a2e26] pt-1.5 w-full">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-[#9c8e82]" />
                          {slot.distance}m
                        </span>

                        {timeRemaining !== null && (
                          <span className="flex items-center gap-0.5 text-[#f87171] font-semibold">
                            <Timer className="w-2.5 h-2.5" />
                            {timeRemaining}m
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
