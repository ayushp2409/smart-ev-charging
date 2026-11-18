import React, { useState } from 'react';
import { X, Car, Zap } from 'lucide-react';
import { ElectricVehicle } from '../../types/simulation';
import { kwToUnits } from '../../utils/calculations';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVehicle: (newEv: Omit<ElectricVehicle, 'id' | 'status' | 'allocation' | 'energyDeliveredKwh' | 'assignedBay'>) => void;
  powerUnitKw: number;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  onAddVehicle,
  powerUnitKw
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('TerraPulse Hyper');
  const [model, setModel] = useState('All-Electric SUV');
  const [color, setColor] = useState('#10b981');
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState(80);
  const [currentSocPercent, setCurrentSocPercent] = useState(25);
  const [targetSocPercent, setTargetSocPercent] = useState(85);
  const [maxPowerKw, setMaxPowerKw] = useState(40);
  const [priority, setPriority] = useState<ElectricVehicle['priority']>('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const maxPowerUnits = kwToUnits(maxPowerKw, powerUnitKw);
    onAddVehicle({
      name,
      model,
      color,
      batteryCapacityKwh,
      currentSocPercent,
      targetSocPercent,
      maxClaim: [1, maxPowerUnits],
      priority
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-emerald-100 p-6 space-y-4 shadow-2xl bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Register New Electric Vehicle</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Vehicle Name & Model:</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Voltix Cypher"
                className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
              />
              <input
                type="text"
                required
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="e.g. Sport Sedan"
                className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Battery Size (kWh):</label>
              <input
                type="number"
                min="20"
                max="150"
                value={batteryCapacityKwh}
                onChange={e => setBatteryCapacityKwh(parseInt(e.target.value) || 60)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Vehicle Color:</label>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer p-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Current Battery %:</label>
              <input
                type="number"
                min="5"
                max="95"
                value={currentSocPercent}
                onChange={e => setCurrentSocPercent(parseInt(e.target.value) || 20)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Target Battery %:</label>
              <input
                type="number"
                min="50"
                max="100"
                value={targetSocPercent}
                onChange={e => setTargetSocPercent(parseInt(e.target.value) || 80)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-medium"
              />
            </div>
          </div>

          {/* Banker's Claim declaration */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
            <span className="text-[11px] font-bold text-emerald-800 block uppercase">
              Banker's Algorithm Claim Declaration:
            </span>
            <div className="flex justify-between items-center text-slate-700 font-medium">
              <span>Max Power Claim:</span>
              <span className="font-mono font-bold text-emerald-700">⚡ {maxPowerKw} kW ({kwToUnits(maxPowerKw, powerUnitKw)} units)</span>
            </div>
            <input
              type="range"
              min="10"
              max="70"
              step="10"
              value={maxPowerKw}
              onChange={e => setMaxPowerKw(parseInt(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Priority Level:</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold"
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
              <option value="emergency">Emergency Priority</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md shadow-emerald-500/20 thunder-glow"
            >
              Register & Enqueue ⚡
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
