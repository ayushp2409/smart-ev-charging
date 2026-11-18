import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  ShieldAlert, 
  SkipForward, 
  SkipBack, 
  RotateCcw,
  ListOrdered,
  Layers,
  Zap
} from 'lucide-react';
import { SafetyCheckResult, SafetyStep, ElectricVehicle, StationConfig } from '../../types/simulation';
import { findAllSafeSequences } from '../../engine/bankersAlgorithm';
import { unitsToKw } from '../../utils/calculations';

interface SafeSequenceFlowProps {
  safetyState: SafetyCheckResult;
  vehicles: ElectricVehicle[];
  stationConfig: StationConfig;
  showInKw: boolean;
  onSelectVehicle: (id: string) => void;
}

export const SafeSequenceFlow: React.FC<SafeSequenceFlowProps> = ({
  safetyState,
  vehicles,
  stationConfig,
  showInKw,
  onSelectVehicle
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [showAlternatives, setShowAlternatives] = useState<boolean>(false);

  const available: [number, number] = safetyState.steps.length > 0
    ? safetyState.steps[0].workBefore
    : [0, 0];

  const alternativeSequences = showAlternatives
    ? findAllSafeSequences(available, vehicles, 6)
    : [];

  const totalSteps = safetyState.steps.length;
  const currentStep: SafetyStep | undefined = safetyState.steps[activeStepIndex];

  return (
    <div className="space-y-6">
      
      {/* Header and System State Summary */}
      <div className={`p-5 rounded-2xl border transition-all shadow-sm ${
        safetyState.isSafe 
          ? 'bg-emerald-50/80 border-emerald-200' 
          : 'bg-rose-50/80 border-rose-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl shadow-sm ${
              safetyState.isSafe ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              {safetyState.isSafe ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  Algorithm Verdict: {safetyState.isSafe ? 'SYSTEM IS SAFE ⚡' : 'UNSAFE STATE (DEADLOCK RISK)'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {safetyState.isSafe
                  ? 'A guaranteed deadlock-free execution sequence exists under declared maximum claims.'
                  : 'No safe sequence exists. Under worst-case simultaneous claims, deadlock could occur!'}
              </p>
            </div>
          </div>

          {/* Safe Sequence Display Badge */}
          {safetyState.isSafe && safetyState.safeSequence.length > 0 && (
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-emerald-200 font-mono text-xs shadow-sm">
              <span className="text-slate-500 font-sans font-medium">Safe Order:</span>
              <span className="font-bold text-emerald-800">
                {safetyState.safeSequence.join(' → ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Connected Visual Flow of Safe Sequence Nodes */}
      {safetyState.isSafe && safetyState.safeSequence.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-emerald-600" />
              Connected Safe Completion Flow
            </h4>
            <span className="text-xs text-slate-500 hidden sm:inline font-medium">
              Hypothetical completion order proving deadlock avoidance
            </span>
          </div>

          {/* Node Chain */}
          <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto py-3 scrollbar-none">
            {safetyState.safeSequence.map((evId, idx) => {
              const ev = vehicles.find(v => v.id === evId);
              const isCurrentStep = currentStep?.vehicleId === evId;

              return (
                <React.Fragment key={evId}>
                  <div 
                    onClick={() => {
                      const stepIdx = safetyState.steps.findIndex(s => s.vehicleId === evId);
                      if (stepIdx !== -1) setActiveStepIndex(stepIdx);
                      onSelectVehicle(evId);
                    }}
                    className={`flex-shrink-0 p-3.5 rounded-xl border transition-all cursor-pointer min-w-[140px] shadow-sm ${
                      isCurrentStep
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 scale-105'
                        : 'bg-slate-50/70 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono text-emerald-700 font-bold">#{idx + 1}</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Safe ⚡
                      </span>
                    </div>

                    <div className="font-bold text-xs text-slate-900 truncate">
                      {ev ? ev.name : evId}
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 mt-1 font-medium">
                      {ev ? `Frees: [${ev.allocation[0]}p, ${unitsToKw(ev.allocation[1], stationConfig.powerUnitKw)} kW]` : ''}
                    </div>
                  </div>

                  {/* Arrow to next */}
                  {idx < safetyState.safeSequence.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100 font-medium">
            <strong>Note:</strong> A safe sequence is a <em>hypothetical completion schedule</em> demonstrating mathematical feasibility; it is not necessarily the physical real-time charging order.
          </p>
        </div>
      )}

      {/* Interactive Step-Through Inspector */}
      {safetyState.steps.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Step-by-Step Algorithm Inspector
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Inspect every iteration of the Banker's Safety Algorithm step-by-step
              </p>
            </div>

            {/* Step Controls */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-600 mr-2 font-medium">
                Step <span className="text-emerald-700 font-bold">{activeStepIndex + 1}</span> of {totalSteps}
              </span>
              <button
                onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))}
                disabled={activeStepIndex === 0}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 border border-slate-200 transition"
                title="Previous Iteration"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveStepIndex(Math.min(totalSteps - 1, activeStepIndex + 1))}
                disabled={activeStepIndex === totalSteps - 1}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 border border-slate-200 transition"
                title="Next Iteration"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveStepIndex(0)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 transition"
                title="Reset to Step 1"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Step Spotlight Card */}
          {currentStep && (
            <div className={`p-4 rounded-xl border mb-6 transition-all ${
              currentStep.canFinish
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-rose-50/70 border-rose-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 font-mono text-xs font-bold shadow-sm">
                    Iteration #{currentStep.stepNumber}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    Evaluating: {currentStep.vehicleName} ({currentStep.vehicleId})
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  currentStep.canFinish 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  {currentStep.canFinish ? 'CONDITION MET (FINISH = TRUE)' : 'STUCK: NEED > WORK'}
                </span>
              </div>

              {/* Mathematical Work & Need Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3 text-xs font-mono">
                {/* Work Vector Before */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">Current Work Vector</span>
                  <span className="text-emerald-700 font-bold text-sm">
                    [{currentStep.workBefore[0]} ports, {showInKw ? `${unitsToKw(currentStep.workBefore[1], stationConfig.powerUnitKw)} kW` : `${currentStep.workBefore[1]} u`}]
                  </span>
                </div>

                {/* Need Vector */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">Remaining Need</span>
                  <span className="text-amber-600 font-bold text-sm">
                    [{currentStep.need[0]} ports, {showInKw ? `${unitsToKw(currentStep.need[1], stationConfig.powerUnitKw)} kW` : `${currentStep.need[1]} u`}]
                  </span>
                </div>

                {/* Work Vector After */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">Work After (+Alloc)</span>
                  <span className="text-emerald-800 font-bold text-sm">
                    [{currentStep.workAfter[0]} ports, {showInKw ? `${unitsToKw(currentStep.workAfter[1], stationConfig.powerUnitKw)} kW` : `${currentStep.workAfter[1]} u`}]
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 font-medium mt-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm leading-relaxed">
                {currentStep.explanation}
              </p>
            </div>
          )}

          {/* Full Execution Steps Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold font-sans">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Work Before</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Need Vector</th>
                  <th className="py-2.5 px-3">Need ≤ Work?</th>
                  <th className="py-2.5 px-3">Released Alloc</th>
                  <th className="py-2.5 px-3">New Work</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safetyState.steps.map((s, idx) => (
                  <tr 
                    key={idx}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`transition cursor-pointer ${
                      idx === activeStepIndex ? 'bg-emerald-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-slate-500">{s.stepNumber}</td>
                    <td className="py-2 px-3 text-emerald-700">
                      [{s.workBefore[0]}p, {showInKw ? `${unitsToKw(s.workBefore[1], stationConfig.powerUnitKw)} kW` : `${s.workBefore[1]}u`}]
                    </td>
                    <td className="py-2 px-3 text-slate-900 font-sans font-bold">
                      {s.vehicleName} ({s.vehicleId})
                    </td>
                    <td className="py-2 px-3 text-amber-600">
                      [{s.need[0]}p, {showInKw ? `${unitsToKw(s.need[1], stationConfig.powerUnitKw)} kW` : `${s.need[1]}u`}]
                    </td>
                    <td className="py-2 px-3">
                      {s.canFinish ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1 font-sans">
                          <CheckCircle className="w-3.5 h-3.5" /> YES
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1 font-sans">
                          <XCircle className="w-3.5 h-3.5" /> NO
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      [{s.allocation[0]}p, {showInKw ? `${unitsToKw(s.allocation[1], stationConfig.powerUnitKw)} kW` : `${s.allocation[1]}u`}]
                    </td>
                    <td className="py-2 px-3 text-emerald-800 font-bold">
                      [{s.workAfter[0]}p, {showInKw ? `${unitsToKw(s.workAfter[1], stationConfig.powerUnitKw)} kW` : `${s.workAfter[1]}u`}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alternative Safe Sequences Enumerate Drawer */}
      {safetyState.isSafe && (
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Alternative Valid Safe Sequences
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Multiple topological orders may satisfy safety. Enumerate alternative valid permutations.
              </p>
            </div>
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-xs font-bold text-emerald-700 border border-slate-200 transition"
            >
              {showAlternatives ? 'Hide Alternatives' : 'Enumerate Alternative Sequences'}
            </button>
          </div>

          {showAlternatives && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              {alternativeSequences.length === 0 ? (
                <p className="text-xs text-slate-500">No alternative sequences found for this tight state.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
                  {alternativeSequences.map((seq, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center space-x-2">
                      <span className="text-emerald-700 font-bold">#{i + 1}:</span>
                      <span>{seq.join(' → ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
