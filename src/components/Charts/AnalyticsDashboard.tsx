import React from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Activity, BarChart2, PieChart as PieIcon, Zap, Server } from 'lucide-react';
import { ChartDataPoint, ElectricVehicle, StationConfig, SimulationLog } from '../../types/simulation';
import { unitsToKw } from '../../utils/calculations';

interface AnalyticsDashboardProps {
  chartData: ChartDataPoint[];
  vehicles: ElectricVehicle[];
  stationConfig: StationConfig;
  logs: SimulationLog[];
  showInKw: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  chartData,
  vehicles,
  stationConfig,
  logs,
  showInKw
}) => {
  const approvedCount = logs.filter(l => l.type === 'success' && l.title.includes('Approved')).length;
  const rejectedCount = logs.filter(l => l.type === 'error' && l.title.includes('Blocked')).length;
  const deferredCount = logs.filter(l => l.type === 'warning' && l.title.includes('Deferred')).length;

  const requestStats = [
    { name: 'Approved (Safe)', value: Math.max(1, approvedCount), color: '#10b981' },
    { name: 'Blocked (Unsafe)', value: Math.max(1, rejectedCount), color: '#f43f5e' },
    { name: 'Deferred (Shortage)', value: Math.max(1, deferredCount), color: '#f59e0b' },
  ];

  const vehiclePowerData = vehicles
    .filter(v => v.status === 'charging' && v.allocation[1] > 0)
    .map(v => ({
      name: v.id,
      fullName: v.name,
      powerKw: unitsToKw(v.allocation[1], stationConfig.powerUnitKw),
      color: v.color
    }));

  const displayChartData = chartData.length > 0 ? chartData : [
    {
      time: '00:00:00',
      timeSec: 0,
      powerAllocatedKw: 60,
      powerAvailableKw: 60,
      totalPowerKw: 120,
      portsOccupied: 3,
      portsAvailable: 1,
      totalPorts: 4,
      activeEvs: 3,
      waitingEvs: 3,
      completedEvs: 0
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-extrabold text-slate-900">Live Telemetry & Resource Analytics ⚡</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time telemetry tracking transformer electrical power draw, port saturation, vehicle power bars, and Banker's Algorithm decisions.
          </p>
        </div>
      </div>

      {/* Grid of 2 Top Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Power Utilization Over Time */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
              Transformer Electrical Power Draw (kW)
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Capacity: {stationConfig.totalPowerKw} kW
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="powerAllocatedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="powerAvailGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, stationConfig.totalPowerKw]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area 
                  type="monotone" 
                  dataKey="powerAllocatedKw" 
                  name="Allocated Power (kW)" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#powerAllocatedGrad)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="powerAvailableKw" 
                  name="Available Power (kW)" 
                  stroke="#059669" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#powerAvailGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Charging Port Occupancy Over Time */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              Charging Port Utilization (Bays In Use vs Free)
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Total Ports: {stationConfig.totalPorts}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayChartData.slice(-15)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, stationConfig.totalPorts]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="portsOccupied" name="Ports Occupied" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="portsAvailable" name="Ports Available" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Grid of 2 Bottom Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Power Allocation per EV */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              Power Allocation per Active EV (kW)
            </h3>
          </div>

          {vehiclePowerData.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              No vehicles currently charging.
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehiclePowerData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(val) => [`${val} kW`, 'Allocated Power']}
                  />
                  <Bar dataKey="powerKw" name="Active Power (kW)" radius={[0, 4, 4, 0]}>
                    {vehiclePowerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Banker's Algorithm Requests Distribution */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              Banker's Algorithm Decision Tally
            </h3>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={requestStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {requestStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Approved</span>
              <span className="font-mono font-bold text-emerald-700">{approvedCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Unsafe Blocked</span>
              <span className="font-mono font-bold text-rose-600">{rejectedCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Deferred</span>
              <span className="font-mono font-bold text-amber-600">{deferredCount}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
