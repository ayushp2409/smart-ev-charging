import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ElectricVehicle, 
  StationConfig, 
  ResourceVector, 
  SafetyCheckResult, 
  RequestEvaluationResult, 
  SimulationLog, 
  ChartDataPoint 
} from '../types/simulation';
import { DEFAULT_STATION_CONFIG, INITIAL_SAMPLE_VEHICLES } from '../data/sampleVehicles';
import { SCENARIOS } from '../data/sampleScenarios';
import { 
  calculateAvailableResources, 
  runSafetyAlgorithm, 
  evaluateResourceRequest, 
  calculateNeed 
} from '../engine/bankersAlgorithm';
import { checkSystemInvariants } from '../utils/validators';
import { unitsToKw, calculateEnergyDeliveredStep } from '../utils/calculations';

const MAX_LOGS = 100;
const MAX_CHART_POINTS = 40;

export function useSimulation() {
  const [stationConfig, setStationConfig] = useState<StationConfig>(() => {
    const saved = localStorage.getItem('ev_station_config');
    return saved ? JSON.parse(saved) : DEFAULT_STATION_CONFIG;
  });

  const [vehicles, setVehicles] = useState<ElectricVehicle[]>(() => {
    const saved = localStorage.getItem('ev_station_vehicles');
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(INITIAL_SAMPLE_VEHICLES));
  });

  const [showInKw, setShowInKw] = useState<boolean>(true);
  const [simRunning, setSimRunning] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(5); // 5x speed default
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>('scenario-a');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>('EV-04');
  const [lastEvaluation, setLastEvaluation] = useState<RequestEvaluationResult | null>(null);

  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const simTimeSecRef = useRef<number>(0);

  // Helper to add simulation log
  const addLog = useCallback((
    type: SimulationLog['type'],
    title: string,
    message: string,
    details?: SimulationLog['details']
  ) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const newLog: SimulationLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      timeSec: simTimeSecRef.current,
      type,
      title,
      message,
      details
    };
    setLogs(prev => [newLog, ...prev.slice(0, MAX_LOGS - 1)]);
  }, []);

  // Compute available resources and safety status
  const available = calculateAvailableResources(stationConfig, vehicles);
  const safetyState: SafetyCheckResult = runSafetyAlgorithm(available, vehicles);
  const invariantCheck = checkSystemInvariants(stationConfig, available, vehicles);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ev_station_config', JSON.stringify(stationConfig));
  }, [stationConfig]);

  useEffect(() => {
    localStorage.setItem('ev_station_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  // Initial log
  useEffect(() => {
    addLog(
      'info',
      'System Initialized',
      `Smart EV Charging Station initialized with ${stationConfig.totalPorts} ports and ${stationConfig.totalPowerKw} kW capacity.`
    );
  }, [addLog]);

  // Submit a resource request for an EV
  const submitRequest = useCallback((
    vehicleId: string, 
    requestedPorts: number, 
    requestedPowerUnits: number
  ) => {
    const target = vehicles.find(v => v.id === vehicleId);
    if (!target) return;

    // If vehicle is waiting with 0 ports, it requires 1 port to occupy a bay
    const actualPorts = (target.allocation[0] === 0 && requestedPorts === 0) ? 1 : requestedPorts;
    const req: ResourceVector = [actualPorts, requestedPowerUnits];

    addLog(
      'banker',
      `Evaluating Request: ${target.name}`,
      `Submitted request for ${actualPorts} port(s) and ${unitsToKw(requestedPowerUnits, stationConfig.powerUnitKw)} kW. Running Banker's Algorithm...`,
      { vehicleId, request: req, available: [...available] }
    );

    const evalResult = evaluateResourceRequest(
      stationConfig,
      available,
      vehicles,
      vehicleId,
      req
    );

    setLastEvaluation(evalResult);

    if (evalResult.granted && evalResult.isSafe) {
      // Find an available bay if vehicle does not have one
      let assignedBay = target.assignedBay;
      if (!assignedBay) {
        const occupiedBays = new Set(
          vehicles
            .filter(v => v.id !== vehicleId && v.assignedBay !== null && v.status === 'charging')
            .map(v => v.assignedBay)
        );
        for (let i = 1; i <= stationConfig.totalPorts; i++) {
          if (!occupiedBays.has(i)) {
            assignedBay = i;
            break;
          }
        }
      }

      setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId) {
          const newAlloc: ResourceVector = [
            Math.max(1, v.allocation[0] + actualPorts),
            v.allocation[1] + requestedPowerUnits
          ];
          return {
            ...v,
            allocation: newAlloc,
            assignedBay: assignedBay,
            status: 'charging',
            chargingStartedTimestamp: v.chargingStartedTimestamp || Date.now(),
            lastRequest: req,
            rejectionReason: undefined
          };
        }
        return v;
      }));

      addLog(
        'success',
        `Request Approved (Safe Sequence Guaranteed)`,
        `Request granted! ${target.name} admitted to Bay ${assignedBay} with safe sequence: ${evalResult.safetyResult?.safeSequence.join(' -> ')}.`,
        { vehicleId, safeSequence: evalResult.safetyResult?.safeSequence }
      );
    } else if (evalResult.status === 'REJECTED_UNSAFE') {
      setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId) {
          return {
            ...v,
            status: 'rejected',
            rejectionReason: 'Request rejected: granting it leads to an UNSAFE state (potential deadlock under worst-case maximum claims).'
          };
        }
        return v;
      }));

      addLog(
        'error',
        `Request Blocked: Unsafe State Prevented`,
        `Banker's Algorithm detected that granting this request leaves the system in an UNSAFE state. Tentative allocation rolled back! Available pool restored.`,
        { vehicleId, request: req }
      );
    } else if (evalResult.status === 'DEFERRED_INSUFFICIENT') {
      setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId) {
          return {
            ...v,
            status: 'waiting',
            rejectionReason: 'Placed in waiting queue: insufficient resources available.'
          };
        }
        return v;
      }));

      addLog(
        'warning',
        `Request Deferred (Shortage)`,
        `Insufficient resources right now. EV placed in waiting queue. Available: [${available[0]} ports, ${unitsToKw(available[1])} kW].`,
        { vehicleId, request: req }
      );
    } else {
      addLog(
        'error',
        `Invalid Request`,
        evalResult.message,
        { vehicleId, request: req }
      );
    }

    return evalResult;
  }, [available, vehicles, stationConfig, addLog]);

  // Manually or automatically complete a charging vehicle
  const completeVehicleCharging = useCallback((vehicleId: string) => {
    const target = vehicles.find(v => v.id === vehicleId);
    if (!target) return;

    const releasedPorts = target.allocation[0];
    const releasedPower = target.allocation[1];

    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          status: 'completed',
          currentSocPercent: v.targetSocPercent,
          allocation: [0, 0] as ResourceVector,
          assignedBay: null,
        };
      }
      return v;
    }));

    addLog(
      'success',
      `Charging Completed: ${target.name}`,
      `${target.name} completed charging and released ${releasedPorts} port(s) and ${unitsToKw(releasedPower, stationConfig.powerUnitKw)} kW back to the station.`,
      { vehicleId }
    );
  }, [vehicles, stationConfig, addLog]);

  // Load a predefined scenario
  const loadScenario = useCallback((scenarioId: string) => {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    setSimRunning(false);
    setCurrentScenarioId(scenarioId);
    setStationConfig({ ...scenario.stationConfig });
    setVehicles(JSON.parse(JSON.stringify(scenario.initialVehicles)));
    setLastEvaluation(null);

    addLog(
      'info',
      `Scenario Loaded: ${scenario.title}`,
      scenario.description
    );
  }, [addLog]);

  // Reset current scenario or to default
  const resetSimulation = useCallback(() => {
    setSimRunning(false);
    if (currentScenarioId) {
      loadScenario(currentScenarioId);
    } else {
      setStationConfig({ ...DEFAULT_STATION_CONFIG });
      setVehicles(JSON.parse(JSON.stringify(INITIAL_SAMPLE_VEHICLES)));
    }
    setLastEvaluation(null);
    addLog('info', 'Simulation Reset', 'Station returned to initial baseline state.');
  }, [currentScenarioId, loadScenario, addLog]);

  // Add new vehicle
  const addVehicle = useCallback((newEv: Omit<ElectricVehicle, 'id' | 'status' | 'allocation' | 'energyDeliveredKwh' | 'assignedBay'>) => {
    const newId = `EV-0${vehicles.length + 1}`;
    const vehicle: ElectricVehicle = {
      ...newEv,
      id: newId,
      assignedBay: null,
      allocation: [0, 0],
      energyDeliveredKwh: 0,
      status: 'waiting',
      requestTimestamp: Date.now()
    };

    setVehicles(prev => [...prev, vehicle]);
    addLog(
      'info',
      `New EV Registered: ${vehicle.name}`,
      `Vehicle ${vehicle.name} registered with max claim of [${vehicle.maxClaim[0]} port, ${unitsToKw(vehicle.maxClaim[1])} kW].`
    );
  }, [vehicles.length, addLog]);

  // Remove vehicle (only if not actively charging or completed)
  const removeVehicle = useCallback((vehicleId: string) => {
    const target = vehicles.find(v => v.id === vehicleId);
    if (!target) return;
    if (target.allocation[0] > 0 || target.allocation[1] > 0) {
      addLog('warning', 'Action Blocked', `Cannot remove active vehicle ${target.name} while holding resources. Complete or deallocate it first.`);
      return;
    }

    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    addLog('info', `EV Departed: ${target.name}`, `Vehicle ${target.name} was removed from the station queue.`);
  }, [vehicles, addLog]);

  // Simulation physics tick step
  const stepSimulationTick = useCallback((deltaSec: number = 2) => {
    simTimeSecRef.current += deltaSec;
    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    let completedVehicleId: string | null = null;

    setVehicles(prev => {
      return prev.map(v => {
        if (v.status === 'charging' && v.allocation[1] > 0) {
          const chargingPowerKw = unitsToKw(v.allocation[1], stationConfig.powerUnitKw);
          const energyAdded = calculateEnergyDeliveredStep(chargingPowerKw, deltaSec * simSpeed);
          const newEnergy = v.energyDeliveredKwh + energyAdded;
          const socDelta = (energyAdded / v.batteryCapacityKwh) * 100;
          const newSoc = Math.min(v.targetSocPercent, Number((v.currentSocPercent + socDelta).toFixed(2)));

          if (newSoc >= v.targetSocPercent) {
            completedVehicleId = v.id;
            return {
              ...v,
              currentSocPercent: v.targetSocPercent,
              energyDeliveredKwh: Number(newEnergy.toFixed(2)),
              status: 'completed',
              allocation: [0, 0] as ResourceVector,
              assignedBay: null,
            };
          }

          return {
            ...v,
            currentSocPercent: newSoc,
            energyDeliveredKwh: Number(newEnergy.toFixed(2)),
          };
        }
        return v;
      });
    });

    if (completedVehicleId) {
      addLog(
        'success',
        `Vehicle Finished Charging`,
        `Vehicle reached target SOC. Released resources automatically.`
      );
    }

    // Record chart data point
    const currentAvail = calculateAvailableResources(stationConfig, vehicles);
    const totalPowerUnits = Math.round(stationConfig.totalPowerKw / stationConfig.powerUnitKw);
    const allocatedPowerUnits = totalPowerUnits - currentAvail[1];
    const allocatedPorts = stationConfig.totalPorts - currentAvail[0];

    const point: ChartDataPoint = {
      time: timeLabel,
      timeSec: simTimeSecRef.current,
      powerAllocatedKw: unitsToKw(allocatedPowerUnits, stationConfig.powerUnitKw),
      powerAvailableKw: unitsToKw(currentAvail[1], stationConfig.powerUnitKw),
      totalPowerKw: stationConfig.totalPowerKw,
      portsOccupied: allocatedPorts,
      portsAvailable: currentAvail[0],
      totalPorts: stationConfig.totalPorts,
      activeEvs: vehicles.filter(v => v.status === 'charging').length,
      waitingEvs: vehicles.filter(v => v.status === 'waiting').length,
      completedEvs: vehicles.filter(v => v.status === 'completed').length,
    };

    setChartData(prev => [...prev.slice(-MAX_CHART_POINTS), point]);
  }, [simSpeed, stationConfig, vehicles, addLog]);

  // Main simulation timer
  useEffect(() => {
    if (!simRunning) return;

    const interval = setInterval(() => {
      stepSimulationTick(1);
    }, 1000 / Math.min(simSpeed, 10));

    return () => clearInterval(interval);
  }, [simRunning, simSpeed, stepSimulationTick]);

  // One-click helper to evaluate and admit a waiting vehicle into an empty bay
  const admitWaitingVehicle = useCallback((vehicleId: string) => {
    const target = vehicles.find(v => v.id === vehicleId);
    if (!target) return;
    const need = calculateNeed(target.maxClaim, target.allocation);
    const powerToRequest = Math.min(2, need[1] > 0 ? need[1] : 2);
    return submitRequest(vehicleId, 1, powerToRequest);
  }, [vehicles, submitRequest]);

  return {
    stationConfig,
    setStationConfig,
    vehicles,
    setVehicles,
    available,
    safetyState,
    invariantCheck,
    showInKw,
    setShowInKw,
    simRunning,
    setSimRunning,
    simSpeed,
    setSimSpeed,
    currentScenarioId,
    selectedVehicleId,
    setSelectedVehicleId,
    lastEvaluation,
    logs,
    chartData,
    submitRequest,
    admitWaitingVehicle,
    completeVehicleCharging,
    loadScenario,
    resetSimulation,
    addVehicle,
    removeVehicle,
    stepSimulationTick,
    togglePlay: () => setSimRunning(prev => !prev),
  };
}
