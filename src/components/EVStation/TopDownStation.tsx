import React from 'react';
import { 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Plug,
  BatteryCharging
} from 'lucide-react';
import { ElectricVehicle, StationConfig, ResourceVector } from '../../types/simulation';
import { unitsToKw } from '../../utils/calculations';

interface TopDownStationProps {
  stationConfig: StationConfig;
  vehicles: ElectricVehicle[];
  available: ResourceVector;
  showInKw: boolean;
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  onCompleteCharging: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenRequestForVehicle: (id: string) => void;
  onAdmitWaitingVehicle?: (id: string) => void;
}

export const TopDownStation: React.FC<TopDownStationProps> = ({
  stationConfig,
  vehicles,
  available,
  showInKw,
  selectedVehicleId,
  onSelectVehicle,
  onCompleteCharging,
  onOpenAddModal,
  onOpenRequestForVehicle,
  onAdmitWaitingVehicle
}) => {
  const bays = Array.from({ length: stationConfig.totalPorts }, (_, i) => i + 1);

  // Actively charging vehicles
  const chargingVehicles = vehicles.filter(v => v.status === 'charging');
  const occupiedBaySet = new Set<number>();

  // Map each bay to its assigned vehicle
  const bayVehicles: (ElectricVehicle | null)[] = bays.map(bayNum => {
    const found = chargingVehicles.find(v => v.assignedBay === bayNum);
    if (found) occupiedBaySet.add(bayNum);
    return found || null;
  });

  // Self-healing fallback: If any vehicle is charging but doesn't have an assignedBay,
  // place it into the first unoccupied bay immediately so it's always visible!
  chargingVehicles.forEach(v => {
    if (!v.assignedBay || !bays.includes(v.assignedBay) || !bayVehicles.includes(v)) {
      for (let i = 0; i < bays.length; i++) {
        const bayNum = bays[i];
        if (!bayVehicles[i]) {
          bayVehicles[i] = v;
          occupiedBaySet.add(bayNum);
          v.assignedBay = bayNum;
          break;
        }
      }
    }
  });

  const waitingVehicles = vehicles.filter(v => v.status === 'waiting' || v.status === 'rejected');
  const completedVehicles = vehicles.filter(v => v.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Visual Station Canvas - Light Green & Thundering */}
      <div className="bg-gradient-to-b from-white via-emerald-50/20 to-slate-50 p-6 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
        
        {/* Canvas Header & Infrastructure Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-emerald-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              Live Charging Station & Electrical Grid ⚡
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              4 Charging Bays connected to {stationConfig.transformerName} · Safe State Monitoring
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Transformer Load Tag */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 font-medium text-amber-900">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Grid Load:</span>
              <span className="font-bold text-amber-700">
                {showInKw 
                  ? `${stationConfig.totalPowerKw - unitsToKw(available[1], stationConfig.powerUnitKw)} / ${stationConfig.totalPowerKw} kW`
                  : `${Math.round(stationConfig.totalPowerKw / stationConfig.powerUnitKw) - available[1]} / ${Math.round(stationConfig.totalPowerKw / stationConfig.powerUnitKw)} u`
                }
              </span>
            </div>

            {/* Available Ports Tag */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 font-medium text-emerald-900">
              <Plug className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free Bays:</span>
              <span className="font-bold text-emerald-700">{available[0]} / {stationConfig.totalPorts}</span>
            </div>
          </div>
        </div>

        {/* Physical Grid Diagram: Transformer Substation on left, 4 Bays on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Transformer Substation Box (Thundering Green + Gold) */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-green-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3 thunder-glow">
              <Zap className="w-8 h-8 text-white fill-white" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 text-center">{stationConfig.transformerName}</h4>
            <p className="text-[11px] text-slate-500 text-center mt-0.5 font-medium">Step-down 480V 3-Phase</p>
            
            {/* Bus bar indicators */}
            <div className="w-full mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Total Capacity:</span>
                <span className="text-slate-900 font-bold">{stationConfig.totalPowerKw} kW</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Available Reserve:</span>
                <span className="text-emerald-700 font-bold">
                  {unitsToKw(available[1], stationConfig.powerUnitKw)} kW
                </span>
              </div>
            </div>

            <div className="w-full mt-3 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-700 text-center flex items-center justify-center gap-1">
              <span>⚡ ENERGIZED BUS BAR</span>
            </div>
          </div>

          {/* 4 Physical Charging Bays */}
          <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {bays.map((bayNum, index) => {
              const ev = bayVehicles[index];
              const isSelected = ev && ev.id === selectedVehicleId;

              return (
                <div
                  key={bayNum}
                  onClick={() => ev && onSelectVehicle(ev.id)}
                  className={`relative rounded-2xl p-4 transition-all duration-300 border flex flex-col justify-between min-h-[300px] cursor-pointer shadow-sm ${
                    ev
                      ? isSelected
                        ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20 shadow-md scale-[1.01]'
                        : 'bg-white border-emerald-200/80 hover:border-emerald-400'
                      : 'bg-slate-50/50 border-dashed border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {/* Bay Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        BAY #{bayNum}
                      </span>
                      {ev && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ev.status === 'charging' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {ev.status.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Charger Plug Icon */}
                    <div className={`p-1.5 rounded-lg ${
                      ev ? 'bg-emerald-100 text-emerald-700 thunder-glow' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Plug className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Vehicle Body Visual Representation */}
                  {ev ? (
                    <div className="my-auto space-y-3">
                      {/* Car Graphic */}
                      <div className="relative py-2 flex flex-col items-center">
                        <div 
                          className="w-32 h-20 rounded-xl relative border shadow-sm flex flex-col justify-between p-2 transition-all bg-white"
                          style={{ 
                            borderColor: ev.color,
                            boxShadow: `0 4px 12px ${ev.color}20`
                          }}
                        >
                          {/* Headlights */}
                          <div className="flex justify-between items-center px-1">
                            <span className="w-2.5 h-1.5 rounded-full bg-amber-400 shadow-sm" />
                            <span className="text-[10px] font-mono font-bold text-slate-800">{ev.id}</span>
                            <span className="w-2.5 h-1.5 rounded-full bg-amber-400 shadow-sm" />
                          </div>

                          {/* Car model label */}
                          <div className="text-center">
                            <p className="text-[11px] font-bold text-slate-900 truncate">{ev.name}</p>
                            <p className="text-[9px] text-slate-500 font-medium">{ev.model}</p>
                          </div>

                          {/* Rear lights */}
                          <div className="flex justify-between items-center px-1">
                            <span className="w-2.5 h-1 rounded-full bg-rose-500" />
                            <span className="w-2.5 h-1 rounded-full bg-rose-500" />
                          </div>
                        </div>

                        {/* Power Cable Line with Lightning */}
                        <div className="mt-2.5 flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Zap className="w-3 h-3 text-amber-500 fill-amber-400 animate-bounce" />
                          <span>
                            {showInKw 
                              ? `${unitsToKw(ev.allocation[1], stationConfig.powerUnitKw)} kW active`
                              : `${ev.allocation[1]} units active`
                            }
                          </span>
                        </div>
                      </div>

                      {/* Battery Progress Bar */}
                      <div>
                        <div className="flex justify-between items-center text-xs text-slate-700 font-semibold mb-1">
                          <span className="flex items-center gap-1 text-emerald-700">
                            <BatteryCharging className="w-3.5 h-3.5" />
                            {ev.currentSocPercent}%
                          </span>
                          <span className="text-[10px] text-slate-500">Target: {ev.targetSocPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 via-green-500 to-amber-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${ev.currentSocPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium mt-1">
                          <span>Delivered: {ev.energyDeliveredKwh} kWh</span>
                          <span>Max: {unitsToKw(ev.maxClaim[1], stationConfig.powerUnitKw)} kW</span>
                        </div>
                      </div>

                      {/* Action buttons inside Bay */}
                      <div className="flex space-x-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRequestForVehicle(ev.id);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm transition text-center"
                        >
                          Request Power ⚡
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompleteCharging(ev.id);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-xs font-semibold text-slate-600 hover:text-rose-600 border border-slate-200 transition"
                          title="Finish charging & release resources"
                        >
                          Release
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Empty Bay State */
                    <div 
                      onClick={() => {
                        if (waitingVehicles.length > 0 && onAdmitWaitingVehicle) {
                          onAdmitWaitingVehicle(waitingVehicles[0].id);
                        } else {
                          onOpenAddModal();
                        }
                      }}
                      className="my-auto flex flex-col items-center justify-center text-center p-4 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 group-hover:border-emerald-500 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 mb-2 transition">
                        <Plug className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-600 group-hover:text-emerald-700">Bay #{bayNum} Empty</p>
                      {waitingVehicles.length > 0 ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded mt-1.5 border border-emerald-200">
                          ⚡ Click to Admit {waitingVehicles[0].id}
                        </span>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Ready for vehicle plug-in</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Waiting Fleet & Completed Sessions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Waiting Queue */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Waiting Queue ({waitingVehicles.length})</h3>
            </div>
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </button>
          </div>

          {waitingVehicles.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No vehicles currently waiting. All active vehicles are accommodated.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {waitingVehicles.map(v => (
                <div 
                  key={v.id}
                  onClick={() => onSelectVehicle(v.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    v.id === selectedVehicleId
                      ? 'bg-emerald-50/80 border-emerald-400 shadow-sm ring-1 ring-emerald-300'
                      : 'bg-slate-50/60 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: v.color }} 
                        />
                        <span className="font-bold text-xs text-slate-900">{v.id} · {v.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.priority === 'emergency' 
                          ? 'bg-rose-100 text-rose-700' 
                          : v.priority === 'high' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {v.priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
                      <div>
                        <span className="text-slate-400">Max:</span> {v.maxClaim[0]}p, {unitsToKw(v.maxClaim[1], stationConfig.powerUnitKw)} kW
                      </div>
                      <div>
                        <span className="text-slate-400">SOC:</span> {v.currentSocPercent}% / {v.targetSocPercent}%
                      </div>
                    </div>

                    {v.rejectionReason && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-700 flex items-start gap-1 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <span>{v.rejectionReason}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5 justify-between items-center">
                    <span className="text-[10px] text-slate-500 capitalize">{v.status}</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAdmitWaitingVehicle) {
                            onAdmitWaitingVehicle(v.id);
                          } else {
                            onOpenRequestForVehicle(v.id);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white shadow-sm transition flex items-center gap-1 thunder-glow"
                        title="Evaluate with Banker's Algorithm and admit to empty bay"
                      >
                        <Zap className="w-3 h-3 fill-white" />
                        <span>Admit to Bay</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRequestForVehicle(v.id);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 border border-slate-200 transition"
                        title="Customize requested power"
                      >
                        ⚙
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Vehicles Panel */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Completed ({completedVehicles.length})</h3>
            </div>
          </div>

          {completedVehicles.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              Vehicles will appear here once they complete charging and release all resources.
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {completedVehicles.map(v => (
                <div key={v.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{v.name}</span>
                    <p className="text-[10px] text-slate-500 font-medium">Delivered: {v.energyDeliveredKwh} kWh</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    DONE
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
