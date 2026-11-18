import { ElectricVehicle, ResourceVector, StationConfig } from '../types/simulation';

export interface InvariantCheckResult {
  isValid: boolean;
  totalConfigured: ResourceVector;
  totalAllocated: ResourceVector;
  calculatedAvailable: ResourceVector;
  actualAvailable: ResourceVector;
  errors: string[];
}

/**
 * Validates the core Banker's Algorithm invariant:
 * Total Resources = Available + Sum(Allocations)
 * And ensures:
 * - Available >= 0
 * - Allocation <= MaxClaim for every vehicle
 * - Need >= 0 for every vehicle
 */
export function checkSystemInvariants(
  stationConfig: StationConfig,
  available: ResourceVector,
  vehicles: ElectricVehicle[]
): InvariantCheckResult {
  const errors: string[] = [];
  const totalPowerUnits = Math.round(stationConfig.totalPowerKw / stationConfig.powerUnitKw);
  const totalConfigured: ResourceVector = [stationConfig.totalPorts, totalPowerUnits];

  let sumAllocatedPorts = 0;
  let sumAllocatedPowerUnits = 0;

  for (const v of vehicles) {
    // Only count active/charging vehicles (completed vehicles have released resources)
    if (v.status !== 'completed') {
      sumAllocatedPorts += v.allocation[0];
      sumAllocatedPowerUnits += v.allocation[1];

      // Check allocation <= maxClaim
      if (v.allocation[0] > v.maxClaim[0]) {
        errors.push(`${v.name}: Port allocation (${v.allocation[0]}) exceeds maximum claim (${v.maxClaim[0]})`);
      }
      if (v.allocation[1] > v.maxClaim[1]) {
        errors.push(`${v.name}: Power allocation (${v.allocation[1]}) exceeds maximum claim (${v.maxClaim[1]})`);
      }

      // Check allocation >= 0
      if (v.allocation[0] < 0 || v.allocation[1] < 0) {
        errors.push(`${v.name}: Negative allocation detected: [${v.allocation[0]}, ${v.allocation[1]}]`);
      }
    }
  }

  const totalAllocated: ResourceVector = [sumAllocatedPorts, sumAllocatedPowerUnits];
  const calculatedAvailable: ResourceVector = [
    totalConfigured[0] - totalAllocated[0],
    totalConfigured[1] - totalAllocated[1]
  ];

  // Invariant 1: Total = Available + sum(Allocations)
  if (calculatedAvailable[0] !== available[0]) {
    errors.push(`Port Invariant violated! Total (${totalConfigured[0]}) != Available (${available[0]}) + Allocated (${totalAllocated[0]})`);
  }
  if (calculatedAvailable[1] !== available[1]) {
    errors.push(`Power Invariant violated! Total (${totalConfigured[1]}) != Available (${available[1]}) + Allocated (${totalAllocated[1]})`);
  }

  // Invariant 2: Available >= 0
  if (available[0] < 0) {
    errors.push(`Negative Available ports: ${available[0]}`);
  }
  if (available[1] < 0) {
    errors.push(`Negative Available power units: ${available[1]}`);
  }

  return {
    isValid: errors.length === 0,
    totalConfigured,
    totalAllocated,
    calculatedAvailable,
    actualAvailable: [...available],
    errors
  };
}
