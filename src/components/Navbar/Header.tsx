import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Zap, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Activity,
  Cpu,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { SafetyCheckResult, StationConfig, ResourceVector } from '../../types/simulation';
import { unitsToKw } from '../../utils/calculations';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  safetyState: SafetyCheckResult;
  invariantValid: boolean;
  simRunning: boolean;
  togglePlay: () => void;
  simSpeed: number;
  setSimSpeed: (speed: number) => void;
  stepSimulationTick: () => void;
  resetSimulation: () => void;
  showInKw: boolean;
  setShowInKw: (show: boolean) => void;
  available: ResourceVector;
  stationConfig: StationConfig;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  safetyState,
  invariantValid,
  simRunning,
  togglePlay,
  simSpeed,
  setSimSpeed,
  stepSimulationTick,
  resetSimulation,
  showInKw,
  setShowInKw,
  available,
  stationConfig
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'simulation', label: 'Live Station ⚡', icon: Zap },
    { id: 'bankers', label: "Banker's Algorithm", icon: Cpu },
    { id: 'workbench', label: 'Request Power', icon: Sliders },
    { id: 'scenarios', label: 'Scenarios', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'learn', label: "Learn Deadlocks", icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm shadow-emerald-500/5">
      {/* Top Banner: Brand, System Status & Simulation Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Project Brand with Electric Lightning Glow */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-green-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 thunder-glow">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                Smart EV Station
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="text-amber-500">⚡</span> Banker's Avoidance
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block font-medium">
              Electric Grid Deadlock Prevention · Operating Systems Simulation
            </p>
          </div>
        </div>

        {/* Center: System Status & Invariant Badges */}
        <div className="flex items-center space-x-3">
          {/* Safety Status Badge */}
          <div className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
            safetyState.isSafe
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
          }`}>
            {safetyState.isSafe ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>STATE: SAFE ⚡</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>STATE: UNSAFE (BLOCKED)</span>
              </>
            )}
          </div>

          {/* Available Resources Quick Pill */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
            <span className="text-slate-500">Available:</span>
            <span className="text-emerald-700 font-bold">{available[0]} Ports</span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-600 font-bold flex items-center gap-0.5">
              ⚡ {showInKw ? `${unitsToKw(available[1], stationConfig.powerUnitKw)} kW` : `${available[1]} units`}
            </span>
          </div>

          {/* Invariant badge */}
          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
            <CheckCircle2 className={`w-3.5 h-3.5 ${invariantValid ? 'text-emerald-600' : 'text-rose-600'}`} />
            <span>Invariant OK</span>
          </div>
        </div>

        {/* Right: Simulation Controls & Unit Toggle */}
        <div className="flex items-center space-x-2">
          {/* Unit Toggle */}
          <button
            onClick={() => setShowInKw(!showInKw)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition"
            title="Toggle between kW and internal 10 kW units"
          >
            Unit: <span className="font-bold text-emerald-700">{showInKw ? 'kW' : 'Units'}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center space-x-0.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            {[1, 5, 20].map(s => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-2 py-1 text-xs rounded-md font-bold transition ${
                  simSpeed === s ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Play / Pause Button */}
          <button
            onClick={togglePlay}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-md transition ${
              simRunning 
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' 
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25 thunder-glow'
            }`}
          >
            {simRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Charge ⚡</span>
              </>
            )}
          </button>

          {/* Step Button */}
          <button
            onClick={stepSimulationTick}
            disabled={simRunning}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 border border-slate-200 transition"
            title="Step Forward 1 Tick"
          >
            <FastForward className="w-4 h-4" />
          </button>

          {/* Reset Button */}
          <button
            onClick={resetSimulation}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-emerald-50">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
