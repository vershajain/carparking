import React, { useState } from 'react';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Activity,
  ShieldAlert,
  Clock,
  Zap,
  Info,
} from 'lucide-react';
import {
  BenchmarkResult,
  QueueWaitPoint,
  TimelineDataPoint,
} from '../core/benchmark';

interface BenchmarkChartsProps {
  result: BenchmarkResult;
}

export const BenchmarkCharts: React.FC<BenchmarkChartsProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'grouped' | 'waitCurve' | 'utilization'>('grouped');
  const [hoveredWaitPoint, setHoveredWaitPoint] = useState<QueueWaitPoint | null>(null);
  const [hoveredTimelinePoint, setHoveredTimelinePoint] = useState<TimelineDataPoint | null>(null);

  const { fcfsMetrics, adaptiveMetrics, queueWaitCurve, timeline, deltas } = result;

  // -------------------------------------------------------------
  // 1. Grouped Bar Chart: Avg Wait, Max Wait, Emergency Response
  // -------------------------------------------------------------
  const barData = [
    {
      metric: 'Avg Wait Time',
      unit: 'min',
      fcfs: fcfsMetrics.avgWaitTime,
      adapt: adaptiveMetrics.avgWaitTime,
      delta: deltas.avgWaitTime.formattedDelta,
      improved: deltas.avgWaitTime.improved,
      target: 'Lower is better',
    },
    {
      metric: 'Max Wait Time',
      unit: 'min',
      fcfs: fcfsMetrics.maxWaitTime,
      adapt: adaptiveMetrics.maxWaitTime,
      delta: deltas.maxWaitTime.formattedDelta,
      improved: deltas.maxWaitTime.improved,
      target: 'Lower is better',
    },
    {
      metric: 'Emergency Response',
      unit: 'min',
      fcfs: fcfsMetrics.emergencyResponseTime,
      adapt: adaptiveMetrics.emergencyResponseTime,
      delta: deltas.emergencyResponseTime.formattedDelta,
      improved: deltas.emergencyResponseTime.improved,
      target: 'Lower is better',
    },
  ];

  const maxBarValue = Math.max(
    ...barData.map((d) => Math.max(d.fcfs, d.adapt)),
    10
  );

  // -------------------------------------------------------------
  // 2. Timeline Queue Wait Curve (Step vs Wait Time)
  // -------------------------------------------------------------
  const maxWaitVal = Math.max(
    ...queueWaitCurve.map((p) => Math.max(p.fcfsWait, p.adaptiveWait)),
    25
  );
  const chartWidth = 720;
  const chartHeight = 260;
  const padding = { top: 25, right: 30, bottom: 40, left: 50 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const getX = (idx: number, total: number) => {
    return padding.left + (idx / Math.max(1, total - 1)) * graphWidth;
  };
  const getY = (val: number) => {
    return padding.top + graphHeight - (val / maxWaitVal) * graphHeight;
  };

  const fcfsPathD = queueWaitCurve
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, queueWaitCurve.length)} ${getY(pt.fcfsWait)}`)
    .join(' ');

  const adaptPathD = queueWaitCurve
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, queueWaitCurve.length)} ${getY(pt.adaptiveWait)}`)
    .join(' ');

  const starvationLineY = getY(20);

  // -------------------------------------------------------------
  // 3. Slot Utilization Area Chart Over Timeline
  // -------------------------------------------------------------
  const maxUtilMinute = timeline.length > 0 ? timeline[timeline.length - 1].minute : 120;
  const getUtilX = (minute: number) => {
    return padding.left + (minute / maxUtilMinute) * graphWidth;
  };
  const getUtilY = (pct: number) => {
    return padding.top + graphHeight - (pct / 100) * graphHeight;
  };

  const fcfsAreaD =
    timeline.length > 0
      ? `${timeline.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getUtilX(pt.minute)} ${getUtilY(pt.fcfsUtilization)}`).join(' ')} L ${getUtilX(maxUtilMinute)} ${padding.top + graphHeight} L ${padding.left} ${padding.top + graphHeight} Z`
      : '';

  const adaptAreaD =
    timeline.length > 0
      ? `${timeline.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getUtilX(pt.minute)} ${getUtilY(pt.adaptiveUtilization)}`).join(' ')} L ${getUtilX(maxUtilMinute)} ${padding.top + graphHeight} L ${padding.left} ${padding.top + graphHeight} Z`
      : '';

  return (
    <div className="bg-[#1f1714] border border-[#3d2e24] rounded-2xl p-5 shadow-xl space-y-5">
      {/* Chart Selector Tabs & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3d2e24] pb-4">
        <div className="flex items-center gap-1.5 bg-[#16100d] p-1 rounded-xl border border-[#3d2e24] text-xs font-mono">
          <button
            onClick={() => setActiveTab('grouped')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'grouped'
                ? 'bg-[#d97736] text-black font-bold shadow'
                : 'text-[#9c8e82] hover:text-[#f7f2ee]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Key Latencies (Grouped)</span>
          </button>
          <button
            onClick={() => setActiveTab('waitCurve')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'waitCurve'
                ? 'bg-[#d97736] text-black font-bold shadow'
                : 'text-[#9c8e82] hover:text-[#f7f2ee]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Queue Wait / Starvation Curve</span>
          </button>
          <button
            onClick={() => setActiveTab('utilization')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'utilization'
                ? 'bg-[#d97736] text-black font-bold shadow'
                : 'text-[#9c8e82] hover:text-[#f7f2ee]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Resource Utilization Over Time</span>
          </button>
        </div>

        {/* Universal Color Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-zinc-500 inline-block shadow" />
            <span className="text-[#a89b91]">Baseline: FCFS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#d97736] inline-block shadow shadow-[#d97736]/30" />
            <span className="text-[#e0a96d] font-semibold">Proposed: Adaptive</span>
          </div>
        </div>
      </div>

      {/* Tab 1: Grouped Bar Chart */}
      {activeTab === 'grouped' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {barData.map((item, idx) => {
              const fcfsHeightPct = (item.fcfs / maxBarValue) * 100;
              const adaptHeightPct = (item.adapt / maxBarValue) * 100;

              return (
                <div
                  key={idx}
                  className="bg-[#261d18] border border-[#423227] rounded-xl p-4 flex flex-col justify-between hover:border-[#d97736]/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-heading font-semibold text-sm text-[#f7f2ee]">{item.metric}</h4>
                      <p className="text-[11px] font-mono text-[#9c8e82]">{item.target}</p>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        item.improved
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-700/30 text-zinc-300 border border-zinc-600/30'
                      }`}
                    >
                      {item.delta}
                    </span>
                  </div>

                  {/* Vertical Visual Bars */}
                  <div className="h-44 flex items-end justify-center gap-6 pt-6 pb-2 border-b border-[#3d2e24]">
                    {/* FCFS Bar */}
                    <div className="flex flex-col items-center gap-1.5 w-14">
                      <span className="text-xs font-mono text-zinc-300 font-bold">
                        {item.fcfs}
                        <span className="text-[10px] text-zinc-500">{item.unit}</span>
                      </span>
                      <div className="w-full bg-[#16100d] rounded-t-lg h-32 flex items-end p-1 border border-zinc-700/50">
                        <div
                          style={{ height: `${Math.max(6, fcfsHeightPct)}%` }}
                          className="w-full bg-zinc-500 rounded-t transition-all duration-700 shadow"
                        />
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">FCFS</span>
                    </div>

                    {/* Adaptive Bar */}
                    <div className="flex flex-col items-center gap-1.5 w-14">
                      <span className="text-xs font-mono text-[#e0a96d] font-bold">
                        {item.adapt}
                        <span className="text-[10px] text-[#9c8e82]">{item.unit}</span>
                      </span>
                      <div className="w-full bg-[#16100d] rounded-t-lg h-32 flex items-end p-1 border border-[#d97736]/30">
                        <div
                          style={{ height: `${Math.max(6, adaptHeightPct)}%` }}
                          className="w-full bg-gradient-to-t from-[#b85d19] to-[#d97736] rounded-t transition-all duration-700 shadow-lg shadow-[#d97736]/20"
                        />
                      </div>
                      <span className="text-[11px] font-mono text-[#e0a96d] font-semibold">Adaptive</span>
                    </div>
                  </div>

                  <div className="pt-3 text-[11px] text-[#9c8e82] flex items-center justify-between font-mono">
                    <span>Absolute Diff:</span>
                    <strong className="text-[#f7f2ee]">
                      {Math.abs(item.fcfs - item.adapt).toFixed(1)} {item.unit}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#18110e] p-3 rounded-xl border border-[#3d2e24] flex items-start gap-2 text-xs text-[#9c8e82]">
            <Info className="w-4 h-4 text-[#d97736] shrink-0 mt-0.5" />
            <p>
              <strong>Metric Note:</strong> In high-contention or emergency workloads, the Adaptive Scheduler
              actively preempts priority vehicles and dynamically shifts formula weights ($P_L 	o P_H$). FCFS serves
              in strict arrival order, resulting in elongated emergency response times and uncontrolled queue wait spikes.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Queue Wait & Starvation Curve */}
      {activeTab === 'waitCurve' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#9c8e82] font-mono gap-2">
            <span>X-Axis: Vehicle Arrival Sequence (1 .. {queueWaitCurve.length}) &bull; Y-Axis: Wait Time (Minutes)</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-0.5 bg-rose-500 inline-block border border-dashed border-rose-400" />
                Starvation Threshold (20m)
              </span>
              <span className="flex items-center gap-1 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Emergency Vehicle
              </span>
            </div>
          </div>

          {/* SVG Line / Step Graph */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[620px] bg-[#16100d] rounded-xl border border-[#3d2e24] select-none"
            >
              <defs>
                <linearGradient id="adaptLineGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97736" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#d97736" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 10, 20, 30, 40].filter((v) => v <= maxWaitVal).map((val) => {
                const y = getY(val);
                return (
                  <g key={val}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="#2b211b"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      fill="#786b63"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      textAnchor="end"
                    >
                      {val}m
                    </text>
                  </g>
                );
              })}

              {/* Starvation Danger Line (20 mins) */}
              {maxWaitVal >= 20 && (
                <g>
                  <line
                    x1={padding.left}
                    y1={starvationLineY}
                    x2={chartWidth - padding.right}
                    y2={starvationLineY}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="5 5"
                    opacity="0.8"
                  />
                  <text
                    x={chartWidth - padding.right - 5}
                    y={starvationLineY - 4}
                    fill="#f87171"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    textAnchor="end"
                  >
                    STARVATION BOUND (20m)
                  </text>
                </g>
              )}

              {/* FCFS Path (Grey dashed or solid) */}
              <path
                d={fcfsPathD}
                fill="none"
                stroke="#71717a"
                strokeWidth="2.5"
                strokeDasharray="2 2"
                className="transition-all"
              />

              {/* Adaptive Path (Caramel Amber Solid) */}
              <path
                d={adaptPathD}
                fill="none"
                stroke="#d97736"
                strokeWidth="3"
                className="transition-all"
              />

              {/* Data points */}
              {queueWaitCurve.map((pt, idx) => {
                const x = getX(idx, queueWaitCurve.length);
                const yFcfs = getY(pt.fcfsWait);
                const yAdapt = getY(pt.adaptiveWait);

                return (
                  <g key={pt.vehicleId}>
                    {/* FCFS point */}
                    <circle
                      cx={x}
                      cy={yFcfs}
                      r={pt.isEmergency ? 4 : 2.5}
                      fill={pt.isEmergency ? '#f59e0b' : '#a1a1aa'}
                      opacity={0.7}
                    />

                    {/* Adaptive point */}
                    <circle
                      cx={x}
                      cy={yAdapt}
                      r={pt.isEmergency ? 5 : 3}
                      fill={pt.isEmergency ? '#fbbf24' : '#d97736'}
                      stroke="#16100d"
                      strokeWidth="1.5"
                      className="cursor-pointer hover:scale-150 transition-transform"
                      onMouseEnter={() => setHoveredWaitPoint(pt)}
                      onMouseLeave={() => setHoveredWaitPoint(null)}
                    />
                  </g>
                );
              })}

              {/* Axes */}
              <line
                x1={padding.left}
                y1={padding.top + graphHeight}
                x2={chartWidth - padding.right}
                y2={padding.top + graphHeight}
                stroke="#4a3b32"
                strokeWidth="1"
              />
              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={padding.top + graphHeight}
                stroke="#4a3b32"
                strokeWidth="1"
              />
            </svg>
          </div>

          {/* Interactive Tooltip Callout */}
          <div className="bg-[#18110e] border border-[#3d2e24] p-3 rounded-xl flex items-center justify-between text-xs font-mono">
            {hoveredWaitPoint ? (
              <div className="flex flex-wrap items-center gap-4 text-[#d1c7bd]">
                <span>
                  Process: <strong className="text-[#f7f2ee]">{hoveredWaitPoint.vehicleId}</strong>
                </span>
                <span>
                  Category: <strong className="text-[#e0a96d]">{hoveredWaitPoint.category}</strong>
                </span>
                <span>
                  FCFS Wait:{' '}
                  <strong className={hoveredWaitPoint.fcfsWait > 20 ? 'text-rose-400 font-bold' : 'text-zinc-300'}>
                    {hoveredWaitPoint.fcfsWait}m
                  </strong>
                </span>
                <span>
                  Adaptive Wait:{' '}
                  <strong className="text-emerald-400 font-bold">{hoveredWaitPoint.adaptiveWait}m</strong>
                </span>
                <span className="text-emerald-400">
                  Savings: {(hoveredWaitPoint.fcfsWait - hoveredWaitPoint.adaptiveWait).toFixed(0)}m
                </span>
              </div>
            ) : (
              <span className="text-[#9c8e82]">
                Hover over data points on the curve to inspect individual process wait times and aging effects.
              </span>
            )}
            <div className="flex items-center gap-2 text-[11px] text-[#9c8e82] hidden sm:flex">
              <span className="inline-block w-2.5 h-0.5 bg-zinc-500" /> FCFS Spike
              <span className="inline-block w-2.5 h-0.5 bg-[#d97736]" /> Adaptive Bounded
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Resource Utilization Over Time */}
      {activeTab === 'utilization' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#9c8e82] font-mono">
            <span>X-Axis: Simulation Clock (0 .. {maxUtilMinute}m) &bull; Y-Axis: Slot Occupancy (%)</span>
            <span>Capacity Target: Stable Resource Allocation</span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[620px] bg-[#16100d] rounded-xl border border-[#3d2e24] select-none"
            >
              {/* Horizontal Grid lines */}
              {[0, 25, 50, 75, 100].map((val) => {
                const y = getUtilY(val);
                return (
                  <g key={val}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="#2b211b"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      fill="#786b63"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      textAnchor="end"
                    >
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* 50% High Demand Line */}
              <line
                x1={padding.left}
                y1={getUtilY(50)}
                x2={chartWidth - padding.right}
                y2={getUtilY(50)}
                stroke="#d97736"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.5"
              />

              {/* FCFS Area */}
              <path
                d={fcfsAreaD}
                fill="rgba(113, 113, 122, 0.15)"
                stroke="#71717a"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Adaptive Area */}
              <path
                d={adaptAreaD}
                fill="rgba(217, 119, 54, 0.22)"
                stroke="#d97736"
                strokeWidth="2.5"
              />

              {/* Interactive Timeline Hover Points */}
              {timeline.filter((_, i) => i % 5 === 0).map((pt) => {
                const x = getUtilX(pt.minute);
                const y = getUtilY(pt.adaptiveUtilization);

                return (
                  <circle
                    key={pt.minute}
                    cx={x}
                    cy={y}
                    r={3}
                    fill="#e0a96d"
                    className="cursor-pointer hover:scale-150 transition-transform"
                    onMouseEnter={() => setHoveredTimelinePoint(pt)}
                    onMouseLeave={() => setHoveredTimelinePoint(null)}
                  />
                );
              })}

              {/* Axes */}
              <line
                x1={padding.left}
                y1={padding.top + graphHeight}
                x2={chartWidth - padding.right}
                y2={padding.top + graphHeight}
                stroke="#4a3b32"
                strokeWidth="1"
              />
              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={padding.top + graphHeight}
                stroke="#4a3b32"
                strokeWidth="1"
              />
            </svg>
          </div>

          <div className="bg-[#18110e] border border-[#3d2e24] p-3 rounded-xl flex items-center justify-between text-xs font-mono">
            {hoveredTimelinePoint ? (
              <div className="flex flex-wrap items-center gap-5 text-[#d1c7bd]">
                <span>
                  Minute: <strong className="text-[#f7f2ee]">t = {hoveredTimelinePoint.minute}m</strong>
                </span>
                <span>
                  FCFS Occupancy:{' '}
                  <strong className="text-zinc-300">
                    {hoveredTimelinePoint.fcfsOccupied} slots ({hoveredTimelinePoint.fcfsUtilization}%)
                  </strong>
                </span>
                <span>
                  Adaptive Occupancy:{' '}
                  <strong className="text-[#e0a96d]">
                    {hoveredTimelinePoint.adaptiveOccupied} slots ({hoveredTimelinePoint.adaptiveUtilization}%)
                  </strong>
                </span>
                <span>
                  Queue Length:{' '}
                  <strong className="text-amber-400">{hoveredTimelinePoint.adaptiveQueueSize} waiting</strong>
                </span>
              </div>
            ) : (
              <span className="text-[#9c8e82]">
                Hover over the timeline to inspect concurrent resource occupancy and queue backlog.
              </span>
            )}
            <span className="text-emerald-400 font-bold hidden sm:inline">
              Net Average: {adaptiveMetrics.slotUtilizationRate}% Capacity
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
