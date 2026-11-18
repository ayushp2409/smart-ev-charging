import React, { useState } from 'react';
import { 
  Sliders, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Cpu, 
  RefreshCw,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { 
  ElectricVehicle, 
  StationConfig, 
  ResourceVector, 
  RequestEvaluationResult 
} from '../../types/simulation';
import { calculateNeed } from '../../engine/bankersAlgorithm';
import { unitsToKw } from '../../utils/calculations';

interface RequestWorkbenchProps {
  vehicles: ElectricVehicle[];
  stationConfig: StationConfig;
  available: ResourceVector;
  showInKw: boolean;
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  onSubmitRequest: (vehicleId: string, ports: number, powerUnits: number) => RequestEvaluationResult | undefined;
  lastEvaluation: RequestEvaluationResult | null;
}

export const RequestWorkbench: React.FC<RequestWorkbenchProps> = ({
  vehicles,
  stationConfig,
  available,
  showInKw,
  selectedVehicleId,
  onSelectVehicle,
  onSubmitRequest,
  lastEvaluation
}) => {
  const activeVehicles = vehicles.filter(v => v.status !== 'completed');
  const currentVehicleId = selectedVehicleId || (activeVehicles[0]?.id ?? '');
  const currentVehicle = vehicles.find(v => v.id === currentVehicleId);

  // Request form state
  const [reqPorts, setReqPorts] = useState<number>(currentVehicle?.allocation[0] === 0 ? 1 : 0);
  const [reqPowerUnits, setReqPowerUnits] = useState<number>(2);

  // Auto-set 1 port whenever switching to a waiting vehicle
  React.useEffect(() => {
    if (currentVehicle) {
      if (currentVehicle.allocation[0] === 0) {
        setReqPorts(1);
      } else {
        setReqPorts(0);
      }
      const need = calculateNeed(currentVehicle.maxClaim, currentVehicle.allocation);
      setReqPowerUnits(Math.min(2, need[1] > 0 ? need[1] : 2));
    }
  }, [currentVehicleId]);

  const currentNeed: ResourceVector = currentVehicle 
    ? calculateNeed(currentVehicle.maxClaim, currentVehicle.allocation)
    : [0, 0];

  const handleQuickPreFill = (type: 'safe' | 'unsafe' | 'exceed_need' | 'exceed_avail') => {
    if (!currentVehicle) return;

    if (type === 'safe') {
      const ports = Math.min(currentNeed[0], available[0]);
      const power = Math.min(currentNeed[1], available[1], 2);
      setReqPorts(ports);
      setReqPowerUnits(power);
    } else if (type === 'unsafe') {
      setReqPorts(Math.min(1, currentNeed[0]));
      setReqPowerUnits(Math.min(2, currentNeed[1]));
    } else if (type === 'exceed_need') {
      setReqPorts(currentNeed[0] + 1);
      setReqPowerUnits(currentNeed[1] + 2);
    } else if (type === 'exceed_avail') {
      setReqPorts(available[0] + 1);
      setReqPowerUnits(available[1] + 3);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle) return;
    onSubmitRequest(currentVehicle.id, reqPorts, reqPowerUnits);
  };

  return (
    <div className="space-y-6">
      
      {/* Workbench Header */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-extrabold text-slate-900">Resource Request Workbench ⚡</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Submit resource requests [Ports, Power]. Watch Banker's Algorithm run feasibility checks, perform tentative deduction, execute safety verification, and commit or rollback.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Request Form & Quick Presets (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            1. Formulate Resource Request
          </h3>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Target EV Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Requesting Vehicle:
              </label>
              <select
                value={currentVehicleId}
                onChange={(e) => onSelectVehicle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} disabled={v.status === 'completed'}>
                    {v.id} — {v.name} ({v.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Vehicle Context Card */}
            {currentVehicle && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1.5">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Current Allocation:</span>
                  <span className="text-emerald-700 font-bold">
                    [{currentVehicle.allocation[0]} port, {showInKw ? `${unitsToKw(currentVehicle.allocation[1], stationConfig.powerUnitKw)} kW` : `${currentVehicle.allocation[1]} u`}]
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Max Declared Claim:</span>
                  <span className="text-slate-900 font-bold">
                    [{currentVehicle.maxClaim[0]} port, {showInKw ? `${unitsToKw(currentVehicle.maxClaim[1], stationConfig.powerUnitKw)} kW` : `${currentVehicle.maxClaim[1]} u`}]
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium pt-1 border-t border-slate-200">
                  <span>Remaining Need:</span>
                  <span className="text-amber-700 font-bold">
                    [{currentNeed[0]} port, {showInKw ? `${unitsToKw(currentNeed[1], stationConfig.powerUnitKw)} kW` : `${currentNeed[1]} u`}]
                  </span>
                </div>
              </div>
            )}

            {/* Requested Ports Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-700 font-semibold mb-1">
                <span>Requested Ports (R1):</span>
                <span className="font-mono text-emerald-700 font-bold">{reqPorts} Port(s)</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(1, currentVehicle?.maxClaim[0] || 1)}
                step="1"
                value={reqPorts}
                onChange={(e) => setReqPorts(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0</span>
                <span>1 port max</span>
              </div>
            </div>

            {/* Requested Power Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-700 font-semibold mb-1">
                <span>Requested Power (R2):</span>
                <span className="font-mono text-amber-600 font-bold">
                  ⚡ {showInKw ? `${unitsToKw(reqPowerUnits, stationConfig.powerUnitKw)} kW` : `${reqPowerUnits} units`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(6, currentVehicle?.maxClaim[1] || 6)}
                step="1"
                value={reqPowerUnits}
                onChange={(e) => setReqPowerUnits(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0 kW</span>
                <span>{showInKw ? `${unitsToKw(Math.max(6, currentVehicle?.maxClaim[1] || 6), stationConfig.powerUnitKw)} kW` : `${Math.max(6, currentVehicle?.maxClaim[1] || 6)} units`}</span>
              </div>
            </div>

            {/* Submit Button (Electric Green & Thunder) */}
            <button
              type="submit"
              disabled={reqPorts === 0 && reqPowerUnits === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-40 font-bold text-xs text-white shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 transition thunder-glow"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Evaluate & Deliver Power ⚡</span>
            </button>
          </form>

          {/* Quick Pre-fill Test Cases */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block mb-2">
              Experimental Presets (1-Click Test):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => handleQuickPreFill('safe')}
                className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold hover:bg-emerald-100 transition text-left"
              >
                ✓ Safe Request (≤ Need, ≤ Avail)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreFill('unsafe')}
                className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold hover:bg-rose-100 transition text-left"
              >
                ⚠ Unsafe Trap (Avoidance Test)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreFill('exceed_avail')}
                className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold hover:bg-amber-100 transition text-left"
              >
                ⏳ Resource Shortage (&gt; Avail)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreFill('exceed_need')}
                className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold hover:bg-slate-200 transition text-left"
              >
                ✕ Invalid Claim (&gt; Need)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Banker's Algorithm 5-Step Evaluation Panel (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              2. Banker's Algorithm Real-Time Decision Pipeline
            </span>
            {lastEvaluation && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                lastEvaluation.status === 'GRANTED_SAFE'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : lastEvaluation.status === 'REJECTED_UNSAFE'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {lastEvaluation.status}
              </span>
            )}
          </h3>

          {!lastEvaluation ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              <Zap className="w-8 h-8 mx-auto text-amber-400 mb-2 animate-bounce" />
              Select an EV on the left and submit a request to watch Banker's Algorithm evaluate safety in real time.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              
              {/* Check 1: Request <= Need */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                lastEvaluation.status !== 'REJECTED_INVALID_NEED'
                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center space-x-2.5">
                  {lastEvaluation.status !== 'REJECTED_INVALID_NEED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span className="font-sans font-semibold">Check 1: Request ≤ Declared Max Claim (Need)</span>
                </div>
                <span className="text-[10px] font-bold">
                  {lastEvaluation.status !== 'REJECTED_INVALID_NEED' ? 'VALID' : 'INVALID (EXCEEDS CLAIM)'}
                </span>
              </div>

              {/* Check 2: Request <= Available */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                lastEvaluation.status !== 'DEFERRED_INSUFFICIENT' && lastEvaluation.status !== 'REJECTED_INVALID_NEED'
                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                  : lastEvaluation.status === 'DEFERRED_INSUFFICIENT'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'opacity-50 bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center space-x-2.5">
                  {lastEvaluation.status !== 'DEFERRED_INSUFFICIENT' && lastEvaluation.status !== 'REJECTED_INVALID_NEED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600" />
                  )}
                  <span className="font-sans font-semibold">Check 2: Request ≤ Currently Available</span>
                </div>
                <span className="text-[10px] font-bold">
                  {lastEvaluation.status === 'DEFERRED_INSUFFICIENT' ? 'SHORTAGE (DEFERRED TO QUEUE)' : 'SUFFICIENT'}
                </span>
              </div>

              {/* Step 3: Tentative Allocation */}
              {lastEvaluation.tentativeAvailable && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-slate-500 font-sans font-medium text-xs">
                    <span>Step 3: Tentative Deduction</span>
                    <span className="text-emerald-700 font-bold">Available' = Available - Request</span>
                  </div>
                  <div className="text-[11px] text-slate-700">
                    Tentative Available: [{lastEvaluation.tentativeAvailable[0]} ports, {showInKw ? `${unitsToKw(lastEvaluation.tentativeAvailable[1], stationConfig.powerUnitKw)} kW` : `${lastEvaluation.tentativeAvailable[1]} u`}]
                  </div>
                </div>
              )}

              {/* Step 4: Safety Algorithm Verification */}
              {lastEvaluation.safetyResult && (
                <div className={`p-3.5 rounded-xl border ${
                  lastEvaluation.isSafe
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className="flex items-center justify-between mb-1 font-sans">
                    <span className="font-bold flex items-center gap-1.5 text-xs">
                      {lastEvaluation.isSafe ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                      )}
                      Step 4: Safety Algorithm Verification
                    </span>
                    <span className="text-xs font-bold">
                      {lastEvaluation.isSafe ? 'SAFE STATE VERIFIED ⚡' : 'UNSAFE STATE DETECTED'}
                    </span>
                  </div>
                  
                  {lastEvaluation.isSafe ? (
                    <p className="text-[11px] text-emerald-800 font-sans">
                      Safe Sequence discovered: {lastEvaluation.safetyResult.safeSequence.join(' → ')}.
                    </p>
                  ) : (
                    <p className="text-[11px] text-rose-800 font-sans">
                      Deadlock risk! Vehicles {lastEvaluation.safetyResult.unfinishableVehicles.join(', ')} cannot finish under declared maximum claims.
                    </p>
                  )}
                </div>
              )}

              {/* Step 5: Final Action (Commit or Rollback) */}
              <div className={`p-4 rounded-xl border shadow-sm ${
                lastEvaluation.granted
                  ? 'bg-emerald-100/70 border-emerald-300'
                  : lastEvaluation.rolledBack
                  ? 'bg-rose-100/70 border-rose-300'
                  : 'bg-slate-100 border-slate-200'
              }`}>
                <div className="flex items-center space-x-2 font-bold mb-1 text-sm font-sans">
                  {lastEvaluation.granted ? (
                    <span className="text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Step 5: REQUEST GRANTED ⚡
                    </span>
                  ) : lastEvaluation.rolledBack ? (
                    <span className="text-rose-900 flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-rose-600 animate-spin" /> Step 5: TENTATIVE ALLOCATION ROLLED BACK
                    </span>
                  ) : (
                    <span className="text-amber-800">Step 5: REQUEST DEFERRED</span>
                  )}
                </div>
                <p className="text-xs font-sans text-slate-700 leading-relaxed">
                  {lastEvaluation.message}
                </p>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
