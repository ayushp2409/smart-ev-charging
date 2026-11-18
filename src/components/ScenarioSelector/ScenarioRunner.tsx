import React from 'react';
import { 
  Layers, 
  RotateCcw, 
  Play, 
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { SCENARIOS } from '../../data/sampleScenarios';

interface ScenarioRunnerProps {
  currentScenarioId: string | null;
  onLoadScenario: (id: string) => void;
  onReset: () => void;
  onSubmitRequest: (vehicleId: string, ports: number, powerUnits: number) => void;
  onCompleteVehicle: (vehicleId: string) => void;
}

export const ScenarioRunner: React.FC<ScenarioRunnerProps> = ({
  currentScenarioId,
  onLoadScenario,
  onReset,
  onSubmitRequest,
  onCompleteVehicle
}) => {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-extrabold text-slate-900">Predefined Simulation Scenarios ⚡</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Mathematically validated test benches demonstrating safe allocation, deadlock avoidance, queue shortages, and dynamic deallocation.
          </p>
        </div>

        <button
          onClick={onReset}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Scenario</span>
        </button>
      </div>

      {/* Scenario Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SCENARIOS.map(sc => {
          const isActive = sc.id === currentScenarioId;

          return (
            <div
              key={sc.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between shadow-sm ${
                isActive
                  ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-300 shadow-md scale-[1.01]'
                  : 'bg-white border-emerald-100 hover:border-emerald-300'
              }`}
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    sc.expectedOutcome === 'SAFE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : sc.expectedOutcome === 'UNSAFE_PREVENTED'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : sc.expectedOutcome === 'DYNAMIC_RECOVERY'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {sc.badge}
                  </span>

                  {isActive && (
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      ACTIVE SCENARIO
                    </span>
                  )}
                </div>

                <h3 className="text-base font-extrabold text-slate-900 mb-2">{sc.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">{sc.description}</p>

                {/* Academic Objective */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 mb-4 text-xs shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">
                    Academic Objective:
                  </span>
                  <p className="text-slate-700 font-medium">{sc.objective}</p>
                </div>

                {/* Key Execution Highlights */}
                <div className="space-y-1.5 mb-5 text-[11px] text-slate-600 font-medium">
                  {sc.highlightSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-600 font-bold">›</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200/60 flex flex-wrap gap-2">
                <button
                  onClick={() => onLoadScenario(sc.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    isActive
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                  }`}
                >
                  <span>{isActive ? 'Reset Scenario' : 'Load Scenario'}</span>
                </button>

                {/* Suggested Action Trigger */}
                {sc.suggestedAction && (
                  <button
                    onClick={() => {
                      const action = sc.suggestedAction;
                      if (!action) return;
                      if (!isActive) onLoadScenario(sc.id);
                      if (sc.id === 'scenario-d') {
                        onCompleteVehicle('EV-01');
                      } else {
                        onSubmitRequest(
                          action.vehicleId,
                          action.request[0],
                          action.request[1]
                        );
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition flex items-center justify-center space-x-1 thunder-glow"
                    title={sc.suggestedAction.description}
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>{sc.suggestedAction.label}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
