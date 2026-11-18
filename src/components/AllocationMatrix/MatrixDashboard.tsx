import React from 'react';
import { 
  CheckCircle2, 
  Cpu, 
  Database,
  Zap
} from 'lucide-react';
import { ElectricVehicle, StationConfig, ResourceVector } from '../../types/simulation';
import { calculateNeed } from '../../engine/bankersAlgorithm';
import { unitsToKw } from '../../utils/calculations';

interface MatrixDashboardProps {
  stationConfig: StationConfig;
  available: ResourceVector;
  vehicles: ElectricVehicle[];
  showInKw: boolean;
  setShowInKw: (show: boolean) => void;
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
}

export const MatrixDashboard: React.FC<MatrixDashboardProps> = ({
  stationConfig,
  available,
  vehicles,
  showInKw,
  setShowInKw,
  selectedVehicleId,
  onSelectVehicle
}) => {
  const activeVehicles = vehicles.filter(v => v.status !== 'completed');
  const totalPowerUnits = Math.round(stationConfig.totalPowerKw / stationConfig.powerUnitKw);

  // Compute sum of allocations
  let sumAllocPorts = 0;
  let sumAllocPower = 0;
  activeVehicles.forEach(v => {
    sumAllocPorts += v.allocation[0];
    sumAllocPower += v.allocation[1];
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Explanation */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-extrabold text-slate-900">Banker's Algorithm State Matrices</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time mathematical representation of system state: Available, Maximum Claim, Allocation, and dynamic Need.
          </p>
        </div>

        <button
          onClick={() => setShowInKw(!showInKw)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-xs font-bold text-slate-700 border border-slate-200 transition"
        >
          <span>Display Power in:</span>
          <span className="text-emerald-700">{showInKw ? 'Kilowatts (kW)' : '10 kW Units'}</span>
        </button>
      </div>

      {/* Available Vector Banner Card (Electric Green & Gold) */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold shadow-sm">
              AVAILABLE VECTOR [1 × 2]
            </span>
            <span className="text-xs font-semibold text-slate-700">
              Free resources currently in the station reservoir:
            </span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-sm">
            <div className="flex items-center space-x-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-emerald-200 shadow-sm">
              <span className="text-slate-500 text-xs font-sans">Ports (R1):</span>
              <span className="text-emerald-700 font-bold">{available[0]}</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-emerald-200 shadow-sm">
              <span className="text-slate-500 text-xs font-sans">Power (R2):</span>
              <span className="text-amber-600 font-bold">
                ⚡ {showInKw ? `${unitsToKw(available[1], stationConfig.powerUnitKw)} kW` : `${available[1]} u`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Matrix Table */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            Complete State Matrices (Active Electric Vehicles)
          </h3>
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            Formula: Need[i] = Maximum[i] - Allocation[i]
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            {/* Table Column Headers */}
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4 font-sans">Vehicle ID</th>
                <th className="py-3 px-4 font-sans">Status</th>
                <th className="py-3 px-3 text-center bg-blue-50/50 border-l border-slate-200 font-sans text-blue-900" colSpan={2}>
                  Maximum Claim (Max)
                </th>
                <th className="py-3 px-3 text-center bg-emerald-50/60 border-l border-slate-200 font-sans text-emerald-900" colSpan={2}>
                  Current Allocation (Alloc)
                </th>
                <th className="py-3 px-3 text-center bg-amber-50/60 border-l border-slate-200 font-sans text-amber-900" colSpan={2}>
                  Remaining Need (Need)
                </th>
                <th className="py-3 px-4 text-center border-l border-slate-200 font-sans">Action</th>
              </tr>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-[10px] font-bold font-sans">
                <th className="py-2 px-4">Process i</th>
                <th className="py-2 px-4">Location</th>
                {/* Max columns */}
                <th className="py-2 px-3 text-right bg-blue-50/30 border-l border-slate-200">Ports (R1)</th>
                <th className="py-2 px-3 text-right bg-blue-50/30">Power (R2)</th>
                {/* Alloc columns */}
                <th className="py-2 px-3 text-right bg-emerald-50/40 border-l border-slate-200">Ports (R1)</th>
                <th className="py-2 px-3 text-right bg-emerald-50/40">Power (R2)</th>
                {/* Need columns */}
                <th className="py-2 px-3 text-right bg-amber-50/40 border-l border-slate-200">Ports (R1)</th>
                <th className="py-2 px-3 text-right bg-amber-50/40">Power (R2)</th>
                <th className="py-2 px-4 text-center border-l border-slate-200">-</th>
              </tr>
            </thead>

            {/* Rows */}
            <tbody className="divide-y divide-slate-100">
              {vehicles.map(v => {
                const isSelected = v.id === selectedVehicleId;
                const need = calculateNeed(v.maxClaim, v.allocation);
                const isCompleted = v.status === 'completed';

                return (
                  <tr 
                    key={v.id}
                    onClick={() => onSelectVehicle(v.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-50' 
                        : isCompleted
                        ? 'opacity-40 bg-slate-50'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Vehicle ID & Name */}
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: v.color }} 
                      />
                      <span>{v.id}</span>
                      <span className="text-[11px] text-slate-500 font-sans truncate max-w-[120px] hidden sm:inline">
                        ({v.name})
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        v.status === 'charging'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.status === 'waiting'
                          ? 'bg-amber-100 text-amber-800'
                          : v.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {v.assignedBay ? `Bay ${v.assignedBay}` : v.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Maximum Claim */}
                    <td className="py-3 px-3 text-right text-slate-700 border-l border-slate-100">
                      {v.maxClaim[0]}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700">
                      {showInKw ? `${unitsToKw(v.maxClaim[1], stationConfig.powerUnitKw)} kW` : `${v.maxClaim[1]} u`}
                    </td>

                    {/* Allocation */}
                    <td className="py-3 px-3 text-right text-emerald-700 font-bold border-l border-slate-100">
                      {v.allocation[0]}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                      {showInKw ? `${unitsToKw(v.allocation[1], stationConfig.powerUnitKw)} kW` : `${v.allocation[1]} u`}
                    </td>

                    {/* Need (Need = Max - Alloc) */}
                    <td className="py-3 px-3 text-right text-amber-700 font-bold border-l border-slate-100">
                      {need[0]}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-700 font-bold">
                      {showInKw ? `${unitsToKw(need[1], stationConfig.powerUnitKw)} kW` : `${need[1]} u`}
                    </td>

                    {/* Action button */}
                    <td className="py-3 px-4 text-center border-l border-slate-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectVehicle(v.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-slate-200 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Sum Totals Row */}
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
                <td className="py-3 px-4 font-sans" colSpan={2}>
                  Total System Sums:
                </td>
                {/* Max Sum */}
                <td className="py-3 px-3 text-right border-l border-slate-200 text-slate-600">
                  {vehicles.reduce((acc, v) => acc + (v.status !== 'completed' ? v.maxClaim[0] : 0), 0)}
                </td>
                <td className="py-3 px-3 text-right text-slate-600">
                  {showInKw 
                    ? `${unitsToKw(vehicles.reduce((acc, v) => acc + (v.status !== 'completed' ? v.maxClaim[1] : 0), 0), stationConfig.powerUnitKw)} kW`
                    : `${vehicles.reduce((acc, v) => acc + (v.status !== 'completed' ? v.maxClaim[1] : 0), 0)} u`
                  }
                </td>
                {/* Alloc Sum */}
                <td className="py-3 px-3 text-right text-emerald-700 border-l border-slate-200">
                  {sumAllocPorts}
                </td>
                <td className="py-3 px-3 text-right text-emerald-700">
                  {showInKw ? `${unitsToKw(sumAllocPower, stationConfig.powerUnitKw)} kW` : `${sumAllocPower} u`}
                </td>
                {/* Need Sum */}
                <td className="py-3 px-3 text-right text-amber-700 border-l border-slate-200">
                  {vehicles.reduce((acc, v) => acc + (v.status !== 'completed' ? calculateNeed(v.maxClaim, v.allocation)[0] : 0), 0)}
                </td>
                <td className="py-3 px-3 text-right text-amber-700">
                  {showInKw 
                    ? `${unitsToKw(vehicles.reduce((acc, v) => acc + (v.status !== 'completed' ? calculateNeed(v.maxClaim, v.allocation)[1] : 0), 0), stationConfig.powerUnitKw)} kW`
                    : `${vehicles.reduce((acc, v) => acc + (v.status !== 'completed' ? calculateNeed(v.maxClaim, v.allocation)[1] : 0), 0)} u`
                  }
                </td>
                <td className="border-l border-slate-200" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Invariant Verification Formula Box */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm text-xs font-mono space-y-2">
        <div className="flex items-center space-x-2 text-emerald-700 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>System Invariant Law: Total Resources = Available + Sum(Allocations)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500">Charging Ports (R1): </span>
            <span className="text-slate-900 font-bold">{stationConfig.totalPorts} (Total)</span> = 
            <span className="text-emerald-700 font-bold"> {available[0]} (Available)</span> + 
            <span className="text-emerald-700 font-bold"> {sumAllocPorts} (Allocated)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500">Power Capacity (R2): </span>
            <span className="text-slate-900 font-bold">{showInKw ? `${stationConfig.totalPowerKw} kW` : `${totalPowerUnits} u`}</span> = 
            <span className="text-amber-600 font-bold"> {showInKw ? `${unitsToKw(available[1], stationConfig.powerUnitKw)} kW` : `${available[1]} u`}</span> + 
            <span className="text-emerald-700 font-bold"> {showInKw ? `${unitsToKw(sumAllocPower, stationConfig.powerUnitKw)} kW` : `${sumAllocPower} u`}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
