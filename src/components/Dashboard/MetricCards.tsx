import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Clock, 
  CheckCircle, 
  Server,
  Sparkles
} from 'lucide-react';
import { ElectricVehicle, StationConfig, ResourceVector, SafetyCheckResult } from '../../types/simulation';
import { unitsToKw } from '../../utils/calculations';

interface MetricCardsProps {
  stationConfig: StationConfig;
  available: ResourceVector;
  vehicles: ElectricVehicle[];
  safetyState: SafetyCheckResult;
  showInKw: boolean;
  invariantValid: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  stationConfig,
  available,
  vehicles,
  safetyState,
  showInKw,
  invariantValid
}) => {
  const totalPowerUnits = Math.round(stationConfig.totalPowerKw / stationConfig.powerUnitKw);
  const allocatedPowerUnits = totalPowerUnits - available[1];
  const allocatedPorts = stationConfig.totalPorts - available[0];

  const chargingVehicles = vehicles.filter(v => v.status === 'charging');
  const waitingVehicles = vehicles.filter(v => v.status === 'waiting');
  const completedVehicles = vehicles.filter(v => v.status === 'completed');

  const powerPercent = Math.min(100, Math.round((allocatedPowerUnits / totalPowerUnits) * 100));
  const portPercent = Math.min(100, Math.round((allocatedPorts / stationConfig.totalPorts) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Charging Ports Card */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Charging Ports (R1)</span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Server className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900 font-mono">{available[0]}</span>
          <span className="text-xs font-medium text-slate-500">/ {stationConfig.totalPorts} available</span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span>Occupied: {allocatedPorts}</span>
            <span className="text-emerald-700">{portPercent}% in use</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${portPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Electrical Power Card (Thunder Aesthetic) */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transformer Power (R2)</span>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-500 border border-amber-100">
            <Zap className="w-4 h-4 fill-amber-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900 font-mono">
            {showInKw ? `${unitsToKw(available[1], stationConfig.powerUnitKw)}` : available[1]}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {showInKw ? `kW avail / ${stationConfig.totalPowerKw} kW` : `u avail / ${totalPowerUnits} u`}
          </span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span>Delivering: {showInKw ? `${unitsToKw(allocatedPowerUnits, stationConfig.powerUnitKw)} kW` : `${allocatedPowerUnits} u`}</span>
            <span className="text-amber-600 font-bold">⚡ {powerPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                powerPercent > 85 ? 'bg-rose-500' : powerPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${powerPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. EV Fleet Status */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle Queue</span>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900 font-mono">{chargingVehicles.length}</span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            ⚡ Charging Active
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 font-medium">
          <div className="flex items-center space-x-1.5 text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Waiting: {waitingVehicles.length}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-600">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Done: {completedVehicles.length}</span>
          </div>
        </div>
      </div>

      {/* 4. Safety State & Invariant Card */}
      <div className={`p-5 rounded-2xl border transition-all shadow-sm ${
        safetyState.isSafe 
          ? 'bg-emerald-50/50 border-emerald-200' 
          : 'bg-rose-50/70 border-rose-200 animate-pulse'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banker's Safety</span>
          <div className={`p-2 rounded-xl ${
            safetyState.isSafe ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {safetyState.isSafe ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className={`text-2xl font-extrabold tracking-tight ${
            safetyState.isSafe ? 'text-emerald-800' : 'text-rose-700'
          }`}>
            {safetyState.isSafe ? 'STATE: SAFE' : 'UNSAFE STATE'}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs border-t border-emerald-100/60 pt-1.5 font-medium text-slate-600">
          <span>Invariant Proof:</span>
          <span className={`font-bold ${invariantValid ? 'text-emerald-700' : 'text-rose-600'}`}>
            {invariantValid ? '✓ Verified Safe' : '✕ Violation'}
          </span>
        </div>
      </div>
    </div>
  );
};
