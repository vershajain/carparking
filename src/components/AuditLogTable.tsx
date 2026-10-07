import React, { useState } from 'react';
import { AuditLogEntry } from '../core/types';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  Flame,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldAlert,
} from 'lucide-react';

interface AuditLogTableProps {
  logs: AuditLogEntry[];
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'ALL' && log.eventType !== filterType) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchVehicle = log.vehicleId?.toLowerCase().includes(q);
      const matchSlot = log.slotId?.toLowerCase().includes(q);
      const matchMsg = log.message.toLowerCase().includes(q);
      return matchVehicle || matchSlot || matchMsg;
    }
    return true;
  });

  const getEventBadge = (type: AuditLogEntry['eventType']) => {
    switch (type) {
      case 'ALLOCATION':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#162414] text-[#84cc16] border border-[#2e5228] font-mono">
            <CheckCircle className="w-3 h-3 text-[#84cc16]" /> ALLOCATION
          </span>
        );
      case 'RELEASE':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#291c0e] text-[#e0a96d] border border-[#593d19] font-mono">
            <ArrowUpCircle className="w-3 h-3 text-[#d97736]" /> RELEASE
          </span>
        );
      case 'ENQUEUE':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#182333] text-[#60a5fa] border border-[#233d5e] font-mono">
            <ArrowDownCircle className="w-3 h-3 text-blue-400" /> ENQUEUE
          </span>
        );
      case 'AGING_TICK':
      case 'STARVATION_RESOLVED':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#332514] text-[#f59e0b] border border-[#593d19] font-mono">
            <Flame className="w-3 h-3 text-[#f59e0b]" /> AGING_FAIRNESS
          </span>
        );
      case 'OVERSTAY_ALERT':
      case 'PENALTY_FINED':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#2b1212] text-[#f87171] border border-[#5e2222] font-mono">
            <ShieldAlert className="w-3 h-3 text-[#ef4444]" /> OVERSTAY_FINE
          </span>
        );
      case 'RESERVATION_EXPIRED':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 font-mono">
            <Clock className="w-3 h-3 text-purple-400" /> RES_EXPIRED
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#2b211b] text-[#d1c7bd] border border-[#4a3b32] font-mono">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3a2e26] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#2b211b] text-[#d1c7bd] border border-[#4a3b32]">
            <FileText className="w-5 h-5 text-[#e0a96d]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#f7f2ee] tracking-wide font-['Outfit']">
              OS AUDIT LOGS & EVENT TRACE
            </h2>
            <p className="text-xs text-[#d1c7bd]">
              Deterministic state change events & penalty audit records
            </p>
          </div>
        </div>

        {/* Search & Filter Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9c8e82] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by PID or Slot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#16100d] border border-[#4a3b32] text-[#f7f2ee] text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#d97736] w-44 font-mono placeholder:text-[#9c8e82]"
            />
          </div>

          {/* Event Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#16100d] border border-[#4a3b32] text-[#d1c7bd] text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#d97736] font-mono"
          >
            <option value="ALL">All Events</option>
            <option value="ALLOCATION">Allocations</option>
            <option value="RELEASE">Releases</option>
            <option value="ENQUEUE">Enqueue</option>
            <option value="STARVATION_RESOLVED">Aging Fairness</option>
            <option value="OVERSTAY_ALERT">Overstay & Penalties</option>
            <option value="RESERVATION_EXPIRED">Reservation Expirations</option>
            <option value="CONFIG_CHANGE">Config / Hot-Plug</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-xl border border-[#3a2e26] bg-[#16100d] max-h-72 overflow-y-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#1f1612] text-[#9c8e82] text-[10px] uppercase border-b border-[#3a2e26] sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">Event Type</th>
              <th className="py-2.5 px-3">Process</th>
              <th className="py-2.5 px-3">Slot</th>
              <th className="py-2.5 px-3">Message & Arithmetic Trace</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e231c] text-[11px]">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#9c8e82]">
                  No matching log entries found
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#231b17] transition-colors">
                  <td className="py-2.5 px-3 text-[#e0a96d] font-bold whitespace-nowrap">
                    +{log.timestamp}m
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {getEventBadge(log.eventType)}
                  </td>
                  <td className="py-2.5 px-3 text-[#f7f2ee] whitespace-nowrap">
                    {log.vehicleId || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-[#f7f2ee] whitespace-nowrap">
                    {log.slotId || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-[#d1c7bd]">
                    <span
                      className={
                        log.severity === 'error'
                          ? 'text-[#f87171] font-semibold'
                          : log.severity === 'warning'
                          ? 'text-[#f59e0b]'
                          : log.severity === 'success'
                          ? 'text-[#84cc16]'
                          : 'text-[#d1c7bd]'
                      }
                    >
                      {log.message}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
