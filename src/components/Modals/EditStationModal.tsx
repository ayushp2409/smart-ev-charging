import React, { useState } from 'react';
import { X, Server, Zap } from 'lucide-react';
import { StationConfig } from '../../types/simulation';

interface EditStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationConfig: StationConfig;
  onSaveConfig: (newConfig: StationConfig) => void;
}

export const EditStationModal: React.FC<EditStationModalProps> = ({
  isOpen,
  onClose,
  stationConfig,
  onSaveConfig
}) => {
  if (!isOpen) return null;

  const [totalPorts, setTotalPorts] = useState(stationConfig.totalPorts);
  const [totalPowerKw, setTotalPowerKw] = useState(stationConfig.totalPowerKw);
  const [transformerName, setTransformerName] = useState(stationConfig.transformerName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...stationConfig,
      totalPorts,
      totalPowerKw,
      transformerName,
      maxChargingBays: totalPorts
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-emerald-100 p-6 space-y-4 shadow-2xl bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Reconfigure Station Resources</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Transformer Substation Name:</label>
            <input
              type="text"
              required
              value={transformerName}
              onChange={e => setTransformerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-700 font-bold mb-1">
              <span>Total Charging Ports (R1):</span>
              <span className="font-mono text-emerald-700">{totalPorts} Ports</span>
            </div>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              value={totalPorts}
              onChange={e => setTotalPorts(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>2 ports</span>
              <span>8 ports</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-700 font-bold mb-1">
              <span>Transformer Power Capacity (R2):</span>
              <span className="font-mono text-amber-600">⚡ {totalPowerKw} kW ({Math.round(totalPowerKw / 10)} units)</span>
            </div>
            <input
              type="range"
              min="60"
              max="240"
              step="10"
              value={totalPowerKw}
              onChange={e => setTotalPowerKw(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>60 kW</span>
              <span>240 kW</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 font-medium">
            <strong>Note:</strong> Modifying station capacity automatically recalculates the Available vector ($Available = Total - \sum Allocation$) and re-verifies invariants.
          </p>

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
              Save Configuration ⚡
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
