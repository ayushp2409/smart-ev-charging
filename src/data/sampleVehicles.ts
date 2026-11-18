import { ElectricVehicle, StationConfig } from '../types/simulation';

export const DEFAULT_STATION_CONFIG: StationConfig = {
  totalPorts: 4,
  totalPowerKw: 120, // 120 kW transformer capacity
  powerUnitKw: 10,   // 10 kW per unit -> 12 units
  transformerName: 'Grid-Substation Alpha-120',
  gridVoltageVolts: 480,
  maxChargingBays: 4,
};

export const INITIAL_SAMPLE_VEHICLES: ElectricVehicle[] = [
  {
    id: 'EV-01',
    name: 'Voltix Cypher GT',
    model: 'Sport Sedan',
    color: '#06b6d4', // Cyan
    assignedBay: 1,
    batteryCapacityKwh: 75,
    currentSocPercent: 42,
    targetSocPercent: 85,
    energyDeliveredKwh: 8.5,
    maxClaim: [1, 4],   // Max 1 port, 4 units (40 kW)
    allocation: [1, 2], // Allocated 1 port, 2 units (20 kW)
    status: 'charging',
    priority: 'normal',
    chargingStartedTimestamp: Date.now() - 1000 * 60 * 15,
  },
  {
    id: 'EV-02',
    name: 'AeroPulse HyperTourer',
    model: 'Executive Wagon',
    color: '#3b82f6', // Blue
    assignedBay: 2,
    batteryCapacityKwh: 90,
    currentSocPercent: 55,
    targetSocPercent: 90,
    energyDeliveredKwh: 14.2,
    maxClaim: [1, 5],   // Max 1 port, 5 units (50 kW)
    allocation: [1, 3], // Allocated 1 port, 3 units (30 kW)
    status: 'charging',
    priority: 'high',
    chargingStartedTimestamp: Date.now() - 1000 * 60 * 25,
  },
  {
    id: 'EV-03',
    name: 'Electra Zephyr S',
    model: 'Compact Hatchback',
    color: '#10b981', // Emerald
    assignedBay: 3,
    batteryCapacityKwh: 50,
    currentSocPercent: 78,
    targetSocPercent: 95,
    energyDeliveredKwh: 5.4,
    maxClaim: [1, 3],   // Max 1 port, 3 units (30 kW)
    allocation: [1, 1], // Allocated 1 port, 1 unit (10 kW)
    status: 'charging',
    priority: 'normal',
    chargingStartedTimestamp: Date.now() - 1000 * 60 * 8,
  },
  {
    id: 'EV-04',
    name: 'TerraWatt Apex 4WD',
    model: 'Heavy Duty SUV',
    color: '#f59e0b', // Amber
    assignedBay: null,
    batteryCapacityKwh: 105,
    currentSocPercent: 20,
    targetSocPercent: 80,
    energyDeliveredKwh: 0,
    maxClaim: [1, 4],   // Max 1 port, 4 units (40 kW)
    allocation: [0, 0], // Not yet allocated
    status: 'waiting',
    priority: 'normal',
    requestTimestamp: Date.now() - 1000 * 60 * 5,
  },
  {
    id: 'EV-05',
    name: 'NeoMotion Pulse City',
    model: 'Urban Compact',
    color: '#a855f7', // Purple
    assignedBay: null,
    batteryCapacityKwh: 40,
    currentSocPercent: 35,
    targetSocPercent: 90,
    energyDeliveredKwh: 0,
    maxClaim: [1, 2],   // Max 1 port, 2 units (20 kW)
    allocation: [0, 0],
    status: 'waiting',
    priority: 'low',
    requestTimestamp: Date.now() - 1000 * 60 * 3,
  },
  {
    id: 'EV-06',
    name: 'Quantum Flux HyperEV',
    model: 'Supercar EV',
    color: '#ec4899', // Pink
    assignedBay: null,
    batteryCapacityKwh: 85,
    currentSocPercent: 18,
    targetSocPercent: 80,
    energyDeliveredKwh: 0,
    maxClaim: [1, 3],   // Max 1 port, 3 units (30 kW)
    allocation: [0, 0],
    status: 'waiting',
    priority: 'emergency',
    requestTimestamp: Date.now() - 1000 * 60 * 2,
  },
];
