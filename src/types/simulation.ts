/**
 * Core type definitions for Smart EV Charging Station Banker's Algorithm Simulation
 */

export type ResourceVector = [number, number]; // [Ports (R1), Power Units (R2)]
// Note: 1 Power Unit = 10 kW

export type VehicleStatus = 
  | 'idle'        // Registered but not requesting or queued
  | 'waiting'     // In queue waiting for resources to become available
  | 'evaluating'  // Banker's Algorithm currently testing request
  | 'charging'    // Actively charging in a bay with allocated resources
  | 'completed'   // Reached target SOC (State of Charge), resources released
  | 'rejected';   // Request was rejected due to unsafe state or invalid claim

export interface ElectricVehicle {
  id: string;
  name: string;
  model: string;
  color: string;
  assignedBay: number | null; // 1 to 4, or null if waiting in queue
  
  // Battery specifications
  batteryCapacityKwh: number; // e.g., 60 kWh
  currentSocPercent: number;  // current state of charge %
  targetSocPercent: number;   // target state of charge % (e.g. 80% or 100%)
  energyDeliveredKwh: number; // accumulated energy delivered
  
  // Banker's Algorithm resource matrices (Resource 1: Ports, Resource 2: Power Units of 10kW)
  maxClaim: ResourceVector;     // Maximum resources needed [maxPorts, maxPowerUnits]
  allocation: ResourceVector;   // Currently allocated [allocPorts, allocPowerUnits]
  // Need is derived: [maxClaim[0] - allocation[0], maxClaim[1] - allocation[1]]
  
  // Metadata
  status: VehicleStatus;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  requestTimestamp?: number;
  chargingStartedTimestamp?: number;
  lastRequest?: ResourceVector;
  rejectionReason?: string;
}

export interface StationConfig {
  totalPorts: number;          // R1 total (default 4)
  totalPowerKw: number;        // Total transformer power in kW (default 120 kW)
  powerUnitKw: number;         // kW per unit (default 10 kW -> 12 units)
  transformerName: string;
  gridVoltageVolts: number;
  maxChargingBays: number;
}

export interface SafetyStep {
  stepNumber: number;
  workBefore: ResourceVector;
  vehicleId: string;
  vehicleName: string;
  need: ResourceVector;
  allocation: ResourceVector;
  canFinish: boolean;
  explanation: string;
  workAfter: ResourceVector;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  safeSequence: string[];         // Vehicle IDs in safe order
  steps: SafetyStep[];            // Iteration details for step-through visualizer
  failedAtVehicleId?: string;     // Vehicle where check got stuck (if unsafe)
  unfinishableVehicles: string[]; // Vehicles that could not finish
  timestamp: number;
}

export interface RequestEvaluationResult {
  granted: boolean;
  isSafe: boolean;
  rolledBack: boolean;
  status: 'GRANTED_SAFE' | 'REJECTED_UNSAFE' | 'DEFERRED_INSUFFICIENT' | 'REJECTED_INVALID_NEED';
  message: string;
  vehicleId: string;
  requested: ResourceVector;
  safetyResult?: SafetyCheckResult;
  previousAvailable: ResourceVector;
  tentativeAvailable?: ResourceVector;
  finalAvailable: ResourceVector;
  timestamp: number;
}

export interface SimulationLog {
  id: string;
  timestamp: string;
  timeSec: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'banker';
  title: string;
  message: string;
  details?: {
    vehicleId?: string;
    request?: ResourceVector;
    safeSequence?: string[];
    available?: ResourceVector;
  };
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  badge: string;
  description: string;
  objective: string;
  expectedOutcome: 'SAFE' | 'UNSAFE_PREVENTED' | 'WAITING_SHORTAGE' | 'DYNAMIC_RECOVERY';
  stationConfig: StationConfig;
  initialVehicles: ElectricVehicle[];
  highlightSteps: string[];
  suggestedAction?: {
    label: string;
    vehicleId: string;
    request: ResourceVector;
    description: string;
  };
}

export interface ChartDataPoint {
  time: string;
  timeSec: number;
  powerAllocatedKw: number;
  powerAvailableKw: number;
  totalPowerKw: number;
  portsOccupied: number;
  portsAvailable: number;
  totalPorts: number;
  activeEvs: number;
  waitingEvs: number;
  completedEvs: number;
}
