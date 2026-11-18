import React from 'react';
import { 
  Terminal, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Cpu, 
  Info,
  Clock
} from 'lucide-react';
import { SimulationLog } from '../../types/simulation';

interface ActivityLogsProps {
  logs: SimulationLog[];
  onClear?: () => void;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({ logs }) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Decision & Event Log ⚡</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
          {logs.length} entries
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs font-medium">
          No logs recorded yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 text-xs">
          {logs.map(log => {
            const Icon = 
              log.type === 'success' ? CheckCircle :
              log.type === 'error' ? XCircle :
              log.type === 'warning' ? AlertTriangle :
              log.type === 'banker' ? Cpu : Info;

            const iconColor = 
              log.type === 'success' ? 'text-emerald-600' :
              log.type === 'error' ? 'text-rose-600' :
              log.type === 'warning' ? 'text-amber-600' :
              log.type === 'banker' ? 'text-emerald-700' : 'text-blue-600';

            const borderColor = 
              log.type === 'success' ? 'border-emerald-200 bg-emerald-50/40' :
              log.type === 'error' ? 'border-rose-200 bg-rose-50/40' :
              log.type === 'warning' ? 'border-amber-200 bg-amber-50/40' :
              log.type === 'banker' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/60';

            return (
              <div key={log.id} className={`p-3 rounded-xl border ${borderColor} transition`}>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <div className="flex items-center space-x-1.5">
                    <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                    <span className="font-bold text-slate-900">{log.title}</span>
                  </div>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {log.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                  {log.message}
                </p>
                {log.details?.safeSequence && (
                  <div className="mt-1 pt-1 border-t border-emerald-100 text-[10px] font-bold text-emerald-800 font-mono">
                    Safe Sequence: {log.details.safeSequence.join(' → ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
