import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Settings,
  Zap
} from 'lucide-react';
import { useSimulation } from './hooks/useSimulation';
import { Header } from './components/Navbar/Header';
import { MetricCards } from './components/Dashboard/MetricCards';
import { TopDownStation } from './components/EVStation/TopDownStation';
import { MatrixDashboard } from './components/AllocationMatrix/MatrixDashboard';
import { SafeSequenceFlow } from './components/SafeSequence/SafeSequenceFlow';
import { RequestWorkbench } from './components/RequestModal/RequestWorkbench';
import { ScenarioRunner } from './components/ScenarioSelector/ScenarioRunner';
import { AnalyticsDashboard } from './components/Charts/AnalyticsDashboard';
import { EducationalSection } from './components/Learn/EducationalSection';
import { ActivityLogs } from './components/Dashboard/ActivityLogs';
import { AddVehicleModal } from './components/Modals/AddVehicleModal';
import { EditStationModal } from './components/Modals/EditStationModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  const {
    stationConfig,
    setStationConfig,
    vehicles,
    available,
    safetyState,
    invariantCheck,
    showInKw,
    setShowInKw,
    simRunning,
    simSpeed,
    setSimSpeed,
    currentScenarioId,
    selectedVehicleId,
    setSelectedVehicleId,
    lastEvaluation,
    logs,
    chartData,
    submitRequest,
    completeVehicleCharging,
    loadScenario,
    resetSimulation,
    addVehicle,
    stepSimulationTick,
    togglePlay,
  } = useSimulation();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 text-slate-800 font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
      
      {/* Top Header & Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        safetyState={safetyState}
        invariantValid={invariantCheck.isValid}
        simRunning={simRunning}
        togglePlay={togglePlay}
        simSpeed={simSpeed}
        setSimSpeed={setSimSpeed}
        stepSimulationTick={() => stepSimulationTick(2)}
        resetSimulation={resetSimulation}
        showInKw={showInKw}
        setShowInKw={setShowInKw}
        available={available}
        stationConfig={stationConfig}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Unsafe State Alert Banner (if system enters unsafe state) */}
        {!safetyState.isSafe && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 shadow-sm flex items-start space-x-3 text-xs text-rose-900">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold text-sm text-rose-900 block">
                Warning: System is in an UNSAFE State (Deadlock Risk Detected)
              </span>
              <p className="mt-0.5 font-medium text-rose-800 leading-relaxed">
                No guaranteed safe sequence exists for current declared claims. Vehicles {safetyState.unfinishableVehicles.join(', ')} cannot finish under worst-case demands. Banker's Algorithm will block further allocations until resources are released.
              </p>
            </div>
          </div>
        )}

        {/* Tab 1: Overview Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top KPI Metrics */}
            <MetricCards
              stationConfig={stationConfig}
              available={available}
              vehicles={vehicles}
              safetyState={safetyState}
              showInKw={showInKw}
              invariantValid={invariantCheck.isValid}
            />

            {/* Top-Down Charging Station Bays */}
            <TopDownStation
              stationConfig={stationConfig}
              vehicles={vehicles}
              available={available}
              showInKw={showInKw}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
              onCompleteCharging={completeVehicleCharging}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenRequestForVehicle={(id) => {
                setSelectedVehicleId(id);
                setActiveTab('workbench');
              }}
            />

            {/* Matrices & Activity Logs in 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                <MatrixDashboard
                  stationConfig={stationConfig}
                  available={available}
                  vehicles={vehicles}
                  showInKw={showInKw}
                  setShowInKw={setShowInKw}
                  selectedVehicleId={selectedVehicleId}
                  onSelectVehicle={setSelectedVehicleId}
                />
              </div>

              <div className="lg:col-span-4 space-y-4">
                <ActivityLogs logs={logs} />
                
                {/* Station Config Shortcut */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Substation Settings</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Modify ports & transformer capacity</p>
                  </div>
                  <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-emerald-700 border border-slate-200 transition"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live EV Simulation View */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <TopDownStation
              stationConfig={stationConfig}
              vehicles={vehicles}
              available={available}
              showInKw={showInKw}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
              onCompleteCharging={completeVehicleCharging}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenRequestForVehicle={(id) => {
                setSelectedVehicleId(id);
                setActiveTab('workbench');
              }}
            />
            <ActivityLogs logs={logs} />
          </div>
        )}

        {/* Tab 3: Banker's Algorithm Core & Safe Sequence Flow */}
        {activeTab === 'bankers' && (
          <div className="space-y-6">
            <SafeSequenceFlow
              safetyState={safetyState}
              vehicles={vehicles}
              stationConfig={stationConfig}
              showInKw={showInKw}
              onSelectVehicle={setSelectedVehicleId}
            />

            <MatrixDashboard
              stationConfig={stationConfig}
              available={available}
              vehicles={vehicles}
              showInKw={showInKw}
              setShowInKw={setShowInKw}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
            />
          </div>
        )}

        {/* Tab 4: Resource Request Workbench */}
        {activeTab === 'workbench' && (
          <div className="space-y-6">
            <RequestWorkbench
              vehicles={vehicles}
              stationConfig={stationConfig}
              available={available}
              showInKw={showInKw}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
              onSubmitRequest={submitRequest}
              lastEvaluation={lastEvaluation}
            />

            <MatrixDashboard
              stationConfig={stationConfig}
              available={available}
              vehicles={vehicles}
              showInKw={showInKw}
              setShowInKw={setShowInKw}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
            />
          </div>
        )}

        {/* Tab 5: Predefined Scenarios */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6">
            <ScenarioRunner
              currentScenarioId={currentScenarioId}
              onLoadScenario={loadScenario}
              onReset={resetSimulation}
              onSubmitRequest={submitRequest}
              onCompleteVehicle={completeVehicleCharging}
            />
          </div>
        )}

        {/* Tab 6: Analytics & Charts */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsDashboard
              chartData={chartData}
              vehicles={vehicles}
              stationConfig={stationConfig}
              logs={logs}
              showInKw={showInKw}
            />
          </div>
        )}

        {/* Tab 7: Learn Banker's Algorithm & OS Theory */}
        {activeTab === 'learn' && (
          <div className="space-y-6">
            <EducationalSection />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-emerald-100 bg-white/80 py-4 text-center text-xs text-slate-500 font-medium">
        <p className="flex items-center justify-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          Smart EV Charging Station Simulator · Operating Systems Deadlock Avoidance with Banker's Algorithm
        </p>
      </footer>

      {/* Modals */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddVehicle={addVehicle}
        powerUnitKw={stationConfig.powerUnitKw}
      />

      <EditStationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        stationConfig={stationConfig}
        onSaveConfig={setStationConfig}
      />

    </div>
  );
};
export default App;
