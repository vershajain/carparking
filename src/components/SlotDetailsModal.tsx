import React from 'react';
import { ParkingSlotResource, VehiclePCB, SlotState } from '../core/types';
import {
  X,
  MapPin,
  Clock,
  Zap,
  Accessibility,
  Crown,
  UserCheck,
  AlertTriangle,
  LogOut,
  Layers,
  CheckCircle,
  Wrench,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface SlotDetailsModalProps {
  slot: ParkingSlotResource | null;
  vehicle: VehiclePCB | null;
  currentClock: number;
  onClose: () => void;
  onRelease: (vehicleId: string) => void;
  onInspectVehicle: (vehicle: VehiclePCB) => void;
  onToggleMaintenance: (slotId: string, newState: SlotState) => void;
  onDeleteSlot: (slotId: string) => void;
}

export const SlotDetailsModal: React.FC<SlotDetailsModalProps> = ({
  slot,
  vehicle,
  currentClock,
  onClose,
  onRelease,
  onInspectVehicle,
  onToggleMaintenance,
  onDeleteSlot,
}) => {
  if (!slot) return null;

  const timeRemaining =
    slot.expectedReleaseTime !== null
      ? Math.max(0, slot.expectedReleaseTime - currentClock)
      : null;

  const graceRemaining =
    slot.reservationExpiresAt !== null
      ? Math.max(0, slot.reservationExpiresAt - currentClock)
      : null;

  const isMaintenance = slot.state === 'MAINTENANCE';

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
        <div className="flex items-center gap-3 border-b border-[#3a2e26] pb-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#d97736] to-[#c88a4b] flex items-center justify-center font-mono font-bold text-lg text-black shadow-lg shadow-[#d97736]/30">
            {slot.id}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#f7f2ee] font-['Outfit']">
                Resource Block {slot.id}
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  slot.state === 'FREE'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : slot.state === 'OCCUPIED'
                    ? 'bg-rose-950 text-rose-300 border border-rose-700'
                    : slot.state === 'RESERVED'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700'
                    : 'bg-[#2b211b] text-[#9c8e82] border border-[#4a3b32]'
                }`}
              >
                {slot.state}
              </span>
            </div>
            <p className="text-xs text-[#d1c7bd] font-mono mt-0.5">
              {slot.zone} &bull; Distance: {slot.distance}m from entrance
            </p>
          </div>
        </div>

        {/* Resource Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-[#16100d] p-3 rounded-xl border border-[#3a2e26]">
            <span className="text-[#9c8e82] text-[10px]">Resource Capability</span>
            <div className="text-[#f7f2ee] font-semibold mt-1 flex items-center gap-1.5">
              {slot.type === 'EV_CHARGER' && <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
              {slot.type === 'ACCESSIBLE' && <Accessibility className="w-3.5 h-3.5 text-blue-400" />}
              {slot.type === 'VIP' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
              {slot.type}
            </div>
          </div>

          <div className="bg-[#16100d] p-3 rounded-xl border border-[#3a2e26]">
            <span className="text-[#9c8e82] text-[10px]">Lifetime Vehicles Served</span>
            <div className="text-[#f7f2ee] font-semibold mt-1">
              {slot.totalVehiclesServed} processes
            </div>
          </div>
        </div>

        {/* Occupant / Reservation Section */}
        {slot.state === 'OCCUPIED' && vehicle ? (
          <div className="bg-[#16100d] p-4 rounded-xl border border-rose-900/40 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs border-b border-[#3a2e26] pb-2">
              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-rose-400" />
                ACTIVE PROCESS OCCUPANT
              </span>
              <button
                onClick={() => onInspectVehicle(vehicle)}
                className="text-[11px] text-[#e0a96d] hover:underline"
              >
                Inspect PCB &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[#9c8e82] text-[10px]">Process ID:</span>
                <div className="font-bold text-white">{vehicle.id}</div>
              </div>
              <div>
                <span className="text-[#9c8e82] text-[10px]">License Plate:</span>
                <div className="text-[#d1c7bd]">{vehicle.licensePlate}</div>
              </div>
              <div>
                <span className="text-[#9c8e82] text-[10px]">Burst Duration:</span>
                <div className="text-[#d1c7bd]">{vehicle.expectedDuration} mins</div>
              </div>
              <div>
                <span className="text-[#9c8e82] text-[10px]">Time Left:</span>
                <div className="font-bold text-rose-300">{timeRemaining} mins</div>
              </div>
            </div>

            {vehicle.fineIncurred > 0 && (
              <div className="p-2 rounded bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs flex items-center justify-between">
                <span>Overstay Fine Accrued:</span>
                <span className="font-bold">₹{vehicle.fineIncurred}</span>
              </div>
            )}

            {/* Early Departure Trigger Button */}
            <button
              onClick={() => {
                onRelease(vehicle.id);
                onClose();
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-semibold text-xs transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Trigger Early Departure / Release Resource</span>
            </button>
          </div>
        ) : slot.state === 'RESERVED' ? (
          <div className="bg-[#16100d] p-4 rounded-xl border border-amber-900/40 space-y-2 font-mono text-xs">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              RESERVATION HOLD ACTIVE
            </div>
            <div className="text-[#d1c7bd]">
              Reserved For: <strong className="text-white">{slot.reservedForVehicleId}</strong>
            </div>
            <div className="text-amber-300/80">
              Strict 10-Min Grace Expires in: <strong>{graceRemaining} mins</strong>
            </div>
            <p className="text-[10px] text-[#9c8e82] mt-1">
              If process does not arrive before expiry, resource will automatically revert to FREE.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Resource is completely free and ready for next scheduled process.</span>
          </div>
        )}

        {/* Slot Management Buttons: Toggle Maintenance & Delete Slot */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#3a2e26] font-mono text-xs">
          <button
            onClick={() => {
              onToggleMaintenance(slot.id, isMaintenance ? 'FREE' : 'MAINTENANCE');
              onClose();
            }}
            className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-colors font-semibold ${
              isMaintenance
                ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/60'
                : 'bg-[#2b211b] hover:bg-[#362a23] text-[#d1c7bd] border-[#4a3b32]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-[#e0a96d]" />
            <span>{isMaintenance ? 'Restore to Online' : 'Set Offline (Maint)'}</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to remove slot ${slot.id}?`)) {
                onDeleteSlot(slot.id);
                onClose();
              }
            }}
            className="py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 flex items-center gap-1.5 transition-colors font-semibold"
            title="Delete Resource Block"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
