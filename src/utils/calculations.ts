import { ResourceVector } from '../types/simulation';

export const POWER_UNIT_KW = 10; // 1 unit = 10 kW

/**
 * Convert discrete power units to kilowatts (kW)
 */
export function unitsToKw(units: number, unitSizeKw: number = POWER_UNIT_KW): number {
  return units * unitSizeKw;
}

/**
 * Convert kilowatts to power units (rounds to nearest unit)
 */
export function kwToUnits(kw: number, unitSizeKw: number = POWER_UNIT_KW): number {
  return Math.max(0, Math.round(kw / unitSizeKw));
}

/**
 * Formats a resource vector for user display
 * @param vector [ports, powerUnits]
 * @param showInKw whether to display power in kW instead of units
 */
export function formatResourceVector(
  vector: ResourceVector, 
  showInKw: boolean = true, 
  unitSizeKw: number = POWER_UNIT_KW
): string {
  const [ports, powerUnits] = vector;
  const powerStr = showInKw ? `${unitsToKw(powerUnits, unitSizeKw)} kW` : `${powerUnits} units`;
  return `[${ports} port${ports === 1 ? '' : 's'}, ${powerStr}]`;
}

/**
 * Estimate charging time remaining in minutes
 */
export function calculateEstimatedMinutesRemaining(
  currentSocPercent: number,
  targetSocPercent: number,
  batteryCapacityKwh: number,
  chargingPowerKw: number
): number {
  if (chargingPowerKw <= 0 || currentSocPercent >= targetSocPercent) {
    return 0;
  }
  const neededPercent = Math.max(0, targetSocPercent - currentSocPercent);
  const neededKwh = (neededPercent / 100) * batteryCapacityKwh;
  const hours = neededKwh / chargingPowerKw;
  return Math.round(hours * 60);
}

/**
 * Calculate energy delivered in kWh given power in kW and time step in seconds
 */
export function calculateEnergyDeliveredStep(
  powerKw: number,
  deltaSeconds: number
): number {
  if (powerKw <= 0 || deltaSeconds <= 0) return 0;
  // kWh = kW * (seconds / 3600)
  return powerKw * (deltaSeconds / 3600);
}
