import React, { useState, useTransition } from 'react';
import {
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Ambulance,
  Bookmark,
  Hourglass,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sliders,
  Table,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Cpu,
  Clock,
  Car,
} from 'lucide-react';
import {
  BenchmarkScenarioId,
  PRESET_SCENARIOS,
  BenchmarkResult,
  runHeadToHeadBenchmark,
} from '../core/benchmark';
import { BenchmarkCharts } from './BenchmarkCharts';

interface PerformanceBenchmarkProps {
  onBackToDashboard?: () => void;
}

export const PerformanceBenchmark: React.FC<PerformanceBenchmarkProps> = ({
  onBackToDashboard,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<BenchmarkScenarioId>('HIGH_DEMAND');
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult>(() =>
    runHeadToHeadBenchmark('HIGH_DEMAND')
  );
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showTraceTable, setShowTraceTable] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  const handleRunSimulation = (scenarioId: BenchmarkScenarioId = selectedScenarioId) => {
    setIsSimulating(true);
    // Simulate brief asynchronous tick for realistic UI feedback
    setTimeout(() => {
      startTransition(() => {
        const res = runHeadToHeadBenchmark(scenarioId);
        setBenchmarkResult(res);
        setIsSimulating(false);
      });
    }, 280);
  };

  const handleSelectScenario = (id: BenchmarkScenarioId) => {
    setSelectedScenarioId(id);
    handleRunSimulation(id);
  };

  const handleExportCSV = () => {
    const headers = [
      'VehicleId',
      'Category',
      'ArrivalTime',
      'BurstDuration',
      'FCFS_WaitTime',
      'FCFS_Slot',
      'Adaptive_WaitTime',
      'Adaptive_Slot',
      'WaitDelta_Minutes',
      'Adaptive_Aging',
      'Adaptive_Score',
    ];

    const rows = benchmarkResult.trace.map((v) => {
      const f = benchmarkResult.fcfsMetrics.records.find((r) => r.vehicleId === v.id);
      const a = benchmarkResult.adaptiveMetrics.records.find((r) => r.vehicleId === v.id);
      const fWait = f ? f.waitTime : 0;
      const aWait = a ? a.waitTime : 0;
      return [
        v.id,
        v.category,
        v.arrivalTime,
        v.expectedDuration,
        fWait,
        f?.assignedSlotId ?? 'NONE',
        aWait,
        a?.assignedSlotId ?? 'NONE',
        fWait - aWait,
        a?.finalAgingCycles ?? 0,
        a?.peakPriorityScore ?? 0,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `benchmark_${benchmarkResult.scenario.id.toLowerCase()}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter vehicle trace records for drill-down table
  const filteredTrace = benchmarkResult.trace.filter((v) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      v.id.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.licensePlate.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. METHODOLOGY BANNER                                         */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#1f1714] border border-[#d97736]/40 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#d97736]/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#d97736]/20 border border-[#d97736]/40 text-[#d97736] shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#d97736] bg-[#d97736]/15 px-2 py-0.5 rounded border border-[#d97736]/30">
                  Academic Rigor
                </span>
                <span className="text-xs font-mono text-[#9c8e82]">Identical Input Trace Validation</span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-[#f7f2ee] mt-1 font-heading">
                Operating System Performance Benchmark Engine
              </h2>
              <blockquote className="text-xs sm:text-sm text-[#d1c7bd] mt-1 italic border-l-2 border-[#d97736] pl-3 py-0.5 font-sans">
                &ldquo;Evaluation Methodology: The proposed Adaptive Scheduler is validated purely against
                deterministic, measurable operating system performance metrics across identical scenario traces, rather
                than static assumptions.&rdquo;
              </blockquote>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2b211b] hover:bg-[#362a23] text-[#d1c7bd] border border-[#4a3b32] text-xs font-mono transition-colors shadow"
              title="Export Current Head-to-Head Trace Data to CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#d97736]" />
              <span>Export CSV</span>
            </button>
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2b211b] hover:bg-[#362a23] text-[#d1c7bd] border border-[#4a3b32] text-xs font-mono transition-colors"
              >
                <span>Live OS Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PRESET WORKLOAD SCENARIOS (IDENTICAL INPUT TRACES)         */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-3" aria-label="Scenario Selector">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-semibold text-base text-[#f7f2ee] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#d97736]" />
              <span>Preset Workload Scenarios (Identical Input Traces)</span>
            </h3>
            <p className="text-xs text-[#9c8e82]">
              Select a deterministic test workload. Each vehicle trace is executed independently through both FCFS and
              Adaptive algorithms on the exact same 20-slot physical topology.
            </p>
          </div>

          {/* Master Run Button */}
          <button
            onClick={() => handleRunSimulation(selectedScenarioId)}
            disabled={isSimulating}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs font-mono transition-all shadow-lg ${
              isSimulating
                ? 'bg-zinc-700 text-zinc-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#d97736] to-[#e0a96d] hover:from-[#c86c2f] hover:to-[#d97736] text-black shadow-[#d97736]/25 hover:scale-[1.02]'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Executing Simulation Traces...' : 'Run Head-to-Head Simulation'}</span>
          </button>
        </div>

        {/* 5 Scenario Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(Object.keys(PRESET_SCENARIOS) as BenchmarkScenarioId[]).map((key) => {
            const sc = PRESET_SCENARIOS[key];
            const isSelected = selectedScenarioId === key;

            const iconMap = {
              LOW_DEMAND: <Clock className="w-4 h-4" />,
              HIGH_DEMAND: <Flame className="w-4 h-4 text-orange-400" />,
              EMERGENCY_HEAVY: <Ambulance className="w-4 h-4 text-rose-400" />,
              RESERVATION_HEAVY: <Bookmark className="w-4 h-4 text-amber-400" />,
              MIXED_DURATION: <Hourglass className="w-4 h-4 text-emerald-400" />,
            };

            return (
              <div
                key={sc.id}
                onClick={() => handleSelectScenario(sc.id)}
                className={`cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#2b211b] border-[#d97736] shadow-md shadow-[#d97736]/20 ring-1 ring-[#d97736]/60'
                    : 'bg-[#1a1412] border-[#3a2e26] hover:bg-[#231b17] hover:border-[#4a3b32]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-[#16100d] border border-[#3a2e26] text-[#d97736]">
                      {iconMap[sc.id]}
                    </div>
                    <span className="text-[10px] font-mono text-[#9c8e82]">
                      {sc.vehicleCount} Vehicles
                    </span>
                  </div>

                  <h4
                    className={`font-heading text-xs font-bold ${
                      isSelected ? 'text-[#f7f2ee]' : 'text-[#d1c7bd]'
                    }`}
                  >
                    {sc.name}
                  </h4>
                  <p className="text-[11px] text-[#9c8e82] line-clamp-2 mt-1 leading-snug">
                    {sc.tagline}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#3a2e26]/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#a89b91]">{sc.durationMinutes}m Window</span>
                  {isSelected && (
                    <span className="text-[#d97736] font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. REAL-TIME DYNAMIC SUMMARY CALLOUT (VERDICT)                */}
      {/* ------------------------------------------------------------- */}
      <section
        className="bg-gradient-to-r from-[#241812] via-[#2b1f19] to-[#1e1511] border-2 border-[#d97736]/70 rounded-2xl p-5 shadow-2xl relative overflow-hidden"
        aria-label="Simulation Verdict"
      >
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-[#d97736]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-3.5 relative z-10">
          <div className="p-2.5 rounded-xl bg-[#d97736] text-black shrink-0 font-bold shadow-md shadow-[#d97736]/30 mt-0.5">
            <Zap className="w-5 h-5 fill-current" />
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-black bg-[#d97736] px-2.5 py-0.5 rounded shadow">
                Simulation Verdict
              </span>
              <span className="text-xs font-mono text-[#9c8e82]">
                Scenario: <strong className="text-[#f7f2ee]">{benchmarkResult.scenario.name}</strong>
              </span>
              <span className="text-xs font-mono text-[#9c8e82]">
                Topology: <strong className="text-[#f7f2ee]">{benchmarkResult.slotCount} Physical Slots</strong>
              </span>
            </div>

            <p className="text-sm sm:text-base font-semibold text-[#f7f2ee] leading-relaxed">
              &ldquo;{benchmarkResult.verdictSummary}&rdquo;
            </p>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-[#16100d]/80 rounded-xl p-2.5 border border-[#4a3b32]/60">
                <span className="text-[10px] font-mono text-[#9c8e82] uppercase">Avg Waiting Time</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-bold text-[#e0a96d] font-mono">
                    {benchmarkResult.adaptiveMetrics.avgWaitTime}m
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    (vs {benchmarkResult.fcfsMetrics.avgWaitTime}m)
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    benchmarkResult.deltas.avgWaitTime.improved ? 'text-emerald-400' : 'text-zinc-400'
                  }`}
                >
                  {benchmarkResult.deltas.avgWaitTime.formattedDelta} delta
                </span>
              </div>

              <div className="bg-[#16100d]/80 rounded-xl p-2.5 border border-[#4a3b32]/60">
                <span className="text-[10px] font-mono text-[#9c8e82] uppercase">Emergency Response</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-bold text-amber-300 font-mono">
                    {benchmarkResult.adaptiveMetrics.emergencyResponseTime}m
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    (vs {benchmarkResult.fcfsMetrics.emergencyResponseTime}m)
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    benchmarkResult.deltas.emergencyResponseTime.improved
                      ? 'text-emerald-400'
                      : 'text-zinc-400'
                  }`}
                >
                  {benchmarkResult.deltas.emergencyResponseTime.formattedDelta} accelerated
                </span>
              </div>

              <div className="bg-[#16100d]/80 rounded-xl p-2.5 border border-[#4a3b32]/60">
                <span className="text-[10px] font-mono text-[#9c8e82] uppercase">Slot Utilization</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-bold text-sky-300 font-mono">
                    {benchmarkResult.adaptiveMetrics.slotUtilizationRate}%
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    (vs {benchmarkResult.fcfsMetrics.slotUtilizationRate}%)
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  {benchmarkResult.deltas.slotUtilization.formattedDelta} capacity
                </span>
              </div>

              <div className="bg-[#16100d]/80 rounded-xl p-2.5 border border-[#4a3b32]/60">
                <span className="text-[10px] font-mono text-[#9c8e82] uppercase">Starved Processes</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span
                    className={`text-base font-bold font-mono ${
                      benchmarkResult.adaptiveMetrics.starvationCount === 0
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {benchmarkResult.adaptiveMetrics.starvationCount}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    (vs {benchmarkResult.fcfsMetrics.starvationCount} in FCFS)
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  Aging Capped at F=100
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. METRICS & KPI COMPARISON TABLE                             */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-[#1f1714] border border-[#3d2e24] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3d2e24] pb-3">
          <div>
            <h3 className="font-heading font-semibold text-base text-[#f7f2ee] flex items-center gap-2">
              <Table className="w-4 h-4 text-[#d97736]" />
              <span>Comparative Performance Metrics & KPI Evaluation</span>
            </h3>
            <p className="text-xs text-[#9c8e82]">
              Side-by-side operating system performance metrics evaluated on identical trace inputs.
            </p>
          </div>

          <span className="text-xs font-mono text-[#9c8e82]">
            Formula: Δ% = (|FCFS - Adaptive| / FCFS) × 100
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-[#16100d] text-[#9c8e82] border-b border-[#3d2e24]">
                <th className="py-3 px-4 font-semibold">Metric</th>
                <th className="py-3 px-4 font-semibold text-center">Target</th>
                <th className="py-3 px-4 font-semibold text-zinc-300">Baseline: FCFS</th>
                <th className="py-3 px-4 font-semibold text-[#e0a96d]">Proposed: Adaptive Scheduler</th>
                <th className="py-3 px-4 font-semibold text-right">Delta / % Improvement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e221b]">
              {/* Row 1: Average Waiting Time */}
              <tr className="hover:bg-[#261d18]/50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-semibold text-[#f7f2ee]">Average Waiting Time</span>
                  <div className="text-[11px] text-[#9c8e82]">Mean queue dwell time for served vehicles</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                    Lower
                  </span>
                </td>
                <td className="py-3 px-4 text-zinc-300 font-bold">
                  {benchmarkResult.fcfsMetrics.avgWaitTime.toFixed(1)} mins
                </td>
                <td className="py-3 px-4 text-[#e0a96d] font-bold">
                  {benchmarkResult.adaptiveMetrics.avgWaitTime.toFixed(1)} mins
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      benchmarkResult.deltas.avgWaitTime.improved
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-700/30 text-zinc-300'
                    }`}
                  >
                    {benchmarkResult.deltas.avgWaitTime.formattedDelta}
                  </span>
                </td>
              </tr>

              {/* Row 2: Maximum Waiting Time */}
              <tr className="hover:bg-[#261d18]/50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-semibold text-[#f7f2ee]">Maximum Waiting Time</span>
                  <div className="text-[11px] text-[#9c8e82]">Peak wait time experienced by worst-case process</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                    Lower
                  </span>
                </td>
                <td className="py-3 px-4 text-zinc-300 font-bold">
                  {benchmarkResult.fcfsMetrics.maxWaitTime.toFixed(1)} mins
                </td>
                <td className="py-3 px-4 text-[#e0a96d] font-bold">
                  {benchmarkResult.adaptiveMetrics.maxWaitTime.toFixed(1)} mins
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      benchmarkResult.deltas.maxWaitTime.improved
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-700/30 text-zinc-300'
                    }`}
                  >
                    {benchmarkResult.deltas.maxWaitTime.formattedDelta}
                  </span>
                </td>
              </tr>

              {/* Row 3: Slot Utilization Rate */}
              <tr className="hover:bg-[#261d18]/50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-semibold text-[#f7f2ee]">Slot Utilization Rate</span>
                  <div className="text-[11px] text-[#9c8e82]">Mean physical resource occupancy over trace runtime</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                    Higher
                  </span>
                </td>
                <td className="py-3 px-4 text-zinc-300 font-bold">
                  {benchmarkResult.fcfsMetrics.slotUtilizationRate.toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-[#e0a96d] font-bold">
                  {benchmarkResult.adaptiveMetrics.slotUtilizationRate.toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      benchmarkResult.deltas.slotUtilization.improved
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-700/30 text-zinc-300'
                    }`}
                  >
                    {benchmarkResult.deltas.slotUtilization.formattedDelta}
                  </span>
                </td>
              </tr>

              {/* Row 4: Emergency Response Time */}
              <tr className="hover:bg-[#261d18]/50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-semibold text-[#f7f2ee]">Emergency Response Time</span>
                  <div className="text-[11px] text-[#9c8e82]">
                    Latency specifically for Ambulances, Fire Trucks & Police
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                    Lower
                  </span>
                </td>
                <td className="py-3 px-4 text-zinc-300 font-bold">
                  {benchmarkResult.fcfsMetrics.emergencyResponseTime.toFixed(1)} mins
                </td>
                <td className="py-3 px-4 text-amber-300 font-bold">
                  {benchmarkResult.adaptiveMetrics.emergencyResponseTime.toFixed(1)} mins
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      benchmarkResult.deltas.emergencyResponseTime.improved
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-700/30 text-zinc-300'
                    }`}
                  >
                    {benchmarkResult.deltas.emergencyResponseTime.formattedDelta}
                  </span>
                </td>
              </tr>

              {/* Row 5: Starvation Count (Wait > 20m) */}
              <tr className="hover:bg-[#261d18]/50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-semibold text-[#f7f2ee]">Starvation Count (Wait &gt; 20m)</span>
                  <div className="text-[11px] text-[#9c8e82]">Processes stuck waiting beyond aging threshold</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                    Lower
                  </span>
                </td>
                <td className="py-3 px-4 text-zinc-300 font-bold">
                  {benchmarkResult.fcfsMetrics.starvationCount} processes
                </td>
                <td className="py-3 px-4 text-[#e0a96d] font-bold">
                  {benchmarkResult.adaptiveMetrics.starvationCount} processes
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      benchmarkResult.deltas.starvationCount.improved
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-700/30 text-zinc-300'
                    }`}
                  >
                    {benchmarkResult.deltas.starvationCount.diff >= 0 ? '-' : '+'}
                    {Math.abs(benchmarkResult.deltas.starvationCount.diff)} processes
                  </span>
                </td>
              </tr>

              {/* Row 6: Reservation Success Rate */}
              <tr className="hover:bg-[#261d18]/50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-semibold text-[#f7f2ee]">Reservation Success Rate</span>
                  <div className="text-[11px] text-[#9c8e82]">
                    Percentage of advance pre-bookings successfully honored
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                    Higher
                  </span>
                </td>
                <td className="py-3 px-4 text-zinc-300 font-bold">
                  {benchmarkResult.fcfsMetrics.reservationSuccessRate.toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-[#e0a96d] font-bold">
                  {benchmarkResult.adaptiveMetrics.reservationSuccessRate.toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      benchmarkResult.deltas.reservationSuccessRate.improved
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-700/30 text-zinc-300'
                    }`}
                  >
                    {benchmarkResult.deltas.reservationSuccessRate.formattedDelta}
                  </span>
                </td>
              </tr>

              {/* Row 7: Expired Reservations / No-Shows */}
              <tr className="hover:bg-[#261d18]/50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-semibold text-[#f7f2ee]">Expired Reservations / No-Shows</span>
                  <div className="text-[11px] text-[#9c8e82]">
                    Unclaimed slots auto-released after strict 10-minute grace
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                    Track
                  </span>
                </td>
                <td className="py-3 px-4 text-zinc-300 font-bold">
                  {benchmarkResult.fcfsMetrics.expiredReservationCount} expired
                </td>
                <td className="py-3 px-4 text-[#e0a96d] font-bold">
                  {benchmarkResult.adaptiveMetrics.expiredReservationCount} expired
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-zinc-400 font-bold">
                    Diff: {benchmarkResult.deltas.expiredReservations.diff}
                  </span>
                </td>
              </tr>

              {/* Row 8: Total / Avg Overstay & Fines */}
              <tr className="hover:bg-[#261d18]/50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-semibold text-[#f7f2ee]">Total / Avg Overstay &amp; Fines</span>
                  <div className="text-[11px] text-[#9c8e82]">
                    Penalty engine: ₹10/min after expected duration + 5m buffer
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                    Track
                  </span>
                </td>
                <td className="py-3 px-4 text-zinc-300 font-bold">
                  ₹{benchmarkResult.fcfsMetrics.totalOverstayFines} (avg ₹
                  {benchmarkResult.fcfsMetrics.avgOverstayFines})
                </td>
                <td className="py-3 px-4 text-[#e0a96d] font-bold">
                  ₹{benchmarkResult.adaptiveMetrics.totalOverstayFines} (avg ₹
                  {benchmarkResult.adaptiveMetrics.avgOverstayFines})
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-zinc-400 font-bold">
                    Diff: ₹{benchmarkResult.deltas.totalFines.diff}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. CHARTS & DATA VISUALIZATIONS                               */}
      {/* ------------------------------------------------------------- */}
      <section aria-label="Visualizations">
        <BenchmarkCharts result={benchmarkResult} />
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. VEHICLE-LEVEL PROCESS TRACE INSPECTION TABLE               */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-[#1f1714] border border-[#3d2e24] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3d2e24] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTraceTable(!showTraceTable)}
              className="text-left font-heading font-semibold text-base text-[#f7f2ee] hover:text-[#e0a96d] transition-colors flex items-center gap-2"
            >
              <Car className="w-4 h-4 text-[#d97736]" />
              <span>Process-by-Process Execution Trace ({benchmarkResult.trace.length} Vehicles)</span>
              <span className="text-xs text-[#9c8e82] font-mono">[{showTraceTable ? 'Hide' : 'Expand'}]</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search PID / Category..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#16100d] border border-[#3d2e24] text-xs font-mono text-[#f7f2ee] focus:outline-none focus:border-[#d97736] placeholder-[#786b63] w-48"
            />
          </div>
        </div>

        {showTraceTable && (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="sticky top-0 bg-[#16100d] z-10 text-[#9c8e82] border-b border-[#3d2e24]">
                <tr>
                  <th className="py-2.5 px-3">PID</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Arrival</th>
                  <th className="py-2.5 px-3">Burst</th>
                  <th className="py-2.5 px-3 text-zinc-300">FCFS Wait</th>
                  <th className="py-2.5 px-3 text-zinc-300">FCFS Slot</th>
                  <th className="py-2.5 px-3 text-[#e0a96d]">Adaptive Wait</th>
                  <th className="py-2.5 px-3 text-[#e0a96d]">Adaptive Slot</th>
                  <th className="py-2.5 px-3 text-right">Wait Savings</th>
                  <th className="py-2.5 px-3 text-right">Aging (F)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a1e17]">
                {filteredTrace.map((v) => {
                  const fcfsRec = benchmarkResult.fcfsMetrics.records.find((r) => r.vehicleId === v.id);
                  const adaptRec = benchmarkResult.adaptiveMetrics.records.find((r) => r.vehicleId === v.id);
                  const fWait = fcfsRec ? fcfsRec.waitTime : 0;
                  const aWait = adaptRec ? adaptRec.waitTime : 0;
                  const savings = fWait - aWait;
                  const isEmerg =
                    v.category === 'AMBULANCE' || v.category === 'FIRE_TRUCK' || v.category === 'POLICE';

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-[#261d18] transition-colors ${
                        isEmerg ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold text-[#f7f2ee]">{v.id}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            v.category === 'AMBULANCE'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : v.category === 'FIRE_TRUCK'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : v.category === 'POLICE'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : v.category === 'VIP'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : v.category === 'DISABLED'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {v.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#9c8e82]">t={v.arrivalTime}m</td>
                      <td className="py-2 px-3 text-[#9c8e82]">{v.expectedDuration}m</td>
                      <td
                        className={`py-2 px-3 font-bold ${
                          fWait > 20 ? 'text-rose-400' : 'text-zinc-300'
                        }`}
                      >
                        {fWait}m
                      </td>
                      <td className="py-2 px-3 text-zinc-400">
                        {fcfsRec?.assignedSlotId ?? 'NONE'}
                      </td>
                      <td
                        className={`py-2 px-3 font-bold ${
                          aWait === 0 ? 'text-emerald-400' : 'text-[#e0a96d]'
                        }`}
                      >
                        {aWait}m
                      </td>
                      <td className="py-2 px-3 text-[#e0a96d]">
                        {adaptRec?.assignedSlotId ?? 'NONE'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`font-bold ${
                            savings > 0
                              ? 'text-emerald-400'
                              : savings < 0
                              ? 'text-rose-400'
                              : 'text-zinc-500'
                          }`}
                        >
                          {savings > 0 ? `+${savings}m` : `${savings}m`}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-[#d1c7bd]">
                        {adaptRec?.finalAgingCycles ?? 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
