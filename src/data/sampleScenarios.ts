import { ScenarioDefinition, StationConfig } from '../types/simulation';
import { DEFAULT_STATION_CONFIG, INITIAL_SAMPLE_VEHICLES } from './sampleVehicles';

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'scenario-a',
    title: 'Scenario A: Normal Safe Allocation',
    badge: 'Safe State',
    description: 'Multiple EVs have active allocations. EV-04 requests 1 port and 30 kW (3 units). Available resources are sufficient, and the resulting state remains SAFE.',
    objective: 'Demonstrate normal Banker\'s Algorithm verification where a valid request is evaluated, verified safe, and approved with a valid safe sequence.',
    expectedOutcome: 'SAFE',
    stationConfig: { ...DEFAULT_STATION_CONFIG },
    initialVehicles: JSON.parse(JSON.stringify(INITIAL_SAMPLE_VEHICLES)),
    highlightSteps: [
      'Station has 1 port and 60 kW (6 units) available.',
      'EV-04 requests [1 port, 30 kW (3 units)].',
      'Banker\'s tests tentative state: Available becomes [0, 3].',
      'EV-01, EV-02, EV-03 are evaluated. EV-01 Need [0, 2] <= Work [0, 3] -> Finishes and frees [1, 2]!',
      'Safe sequence discovered: EV-01 -> EV-02 -> EV-03 -> EV-04 -> EV-05 -> EV-06.',
      'Request permanently granted! EV-04 enters Bay 4.'
    ],
    suggestedAction: {
      label: 'Submit Safe Request (EV-04: 1 port, 30 kW)',
      vehicleId: 'EV-04',
      request: [1, 3],
      description: 'Submit request for 1 port and 30 kW for EV-04 to observe safe state approval.'
    }
  },
  {
    id: 'scenario-b',
    title: 'Scenario B: Unsafe State Prevention (Deadlock Avoidance)',
    badge: 'Unsafe Prevented',
    description: 'CRITICAL DEMONSTRATION: The available resources seem sufficient for EV-04 (Request <= Available), but granting it leaves the station with zero safety cushion. No vehicle could be guaranteed to finish under worst-case maximum claims.',
    objective: 'Demonstrate why naive greedy allocation fails and how Banker\'s Algorithm avoids deadlock by proactively rejecting unsafe requests and rolling back tentative allocations.',
    expectedOutcome: 'UNSAFE_PREVENTED',
    stationConfig: {
      totalPorts: 4,
      totalPowerKw: 110, // 11 units
      powerUnitKw: 10,
      transformerName: 'Grid-Substation Alpha-110',
      gridVoltageVolts: 480,
      maxChargingBays: 4
    },
    // Tailored so Available is [1, 2] (1 port, 20 kW).
    // EV-01 alloc: [1, 3], max: [1, 5] -> need [0, 2]
    // EV-02 alloc: [1, 3], max: [1, 5] -> need [0, 2]
    // EV-03 alloc: [1, 3], max: [1, 5] -> need [0, 2]
    // Total alloc: [3, 9]. Available: [4-3=1, 11-9=2].
    // EV-04 max: [1, 3], alloc: [0, 0] -> need [1, 3].
    // If EV-04 requests [1, 2]: Request <= Available! Naive scheduler would grant it!
    // But tentative Available becomes [0, 0].
    // Everyone still needs 2 units or 1 unit. NO ONE CAN FINISH!
    initialVehicles: [
      {
        id: 'EV-01',
        name: 'Voltix Cypher GT',
        model: 'Sport Sedan',
        color: '#06b6d4',
        assignedBay: 1,
        batteryCapacityKwh: 75,
        currentSocPercent: 45,
        targetSocPercent: 85,
        energyDeliveredKwh: 10,
        maxClaim: [1, 5],
        allocation: [1, 3],
        status: 'charging',
        priority: 'normal'
      },
      {
        id: 'EV-02',
        name: 'AeroPulse HyperTourer',
        model: 'Executive Wagon',
        color: '#3b82f6',
        assignedBay: 2,
        batteryCapacityKwh: 90,
        currentSocPercent: 60,
        targetSocPercent: 90,
        energyDeliveredKwh: 12,
        maxClaim: [1, 5],
        allocation: [1, 3],
        status: 'charging',
        priority: 'high'
      },
      {
        id: 'EV-03',
        name: 'Electra Zephyr S',
        model: 'Compact Hatchback',
        color: '#10b981',
        assignedBay: 3,
        batteryCapacityKwh: 50,
        currentSocPercent: 75,
        targetSocPercent: 95,
        energyDeliveredKwh: 6,
        maxClaim: [1, 5],
        allocation: [1, 3],
        status: 'charging',
        priority: 'normal'
      },
      {
        id: 'EV-04',
        name: 'TerraWatt Apex 4WD',
        model: 'Heavy Duty SUV',
        color: '#f59e0b',
        assignedBay: null,
        batteryCapacityKwh: 105,
        currentSocPercent: 20,
        targetSocPercent: 80,
        energyDeliveredKwh: 0,
        maxClaim: [1, 3],
        allocation: [0, 0],
        status: 'waiting',
        priority: 'normal'
      },
      {
        id: 'EV-05',
        name: 'NeoMotion Pulse City',
        model: 'Urban Compact',
        color: '#a855f7',
        assignedBay: null,
        batteryCapacityKwh: 40,
        currentSocPercent: 30,
        targetSocPercent: 90,
        energyDeliveredKwh: 0,
        maxClaim: [1, 2],
        allocation: [0, 0],
        status: 'waiting',
        priority: 'low'
      }
    ],
    highlightSteps: [
      'Available resources right now: 1 port and 20 kW (2 units).',
      'EV-04 requests [1 port, 20 kW]. Notice: Request <= Available!',
      'Naive scheduler without Banker\'s would grant this request immediately.',
      'Banker\'s Algorithm performs tentative deduction: Available\' = [0 ports, 0 kW].',
      'Safety check runs: Work = [0, 0].',
      'EV-01 needs [0, 2] > [0, 0]. EV-02 needs [0, 2] > [0, 0]. EV-03 needs [0, 2] > [0, 0]. EV-04 needs [0, 1] > [0, 0].',
      'No vehicle can satisfy Need <= Work! System enters UNSAFE state.',
      'Banker\'s Algorithm REJECTS the request and rolls back tentative allocation to protect the station!'
    ],
    suggestedAction: {
      label: 'Submit Trapping Request (EV-04: 1 port, 20 kW)',
      vehicleId: 'EV-04',
      request: [1, 2],
      description: 'Submit request for 1 port and 20 kW. Watch Banker\'s Algorithm catch the unsafe trap and rollback!'
    }
  },
  {
    id: 'scenario-c',
    title: 'Scenario C: Severe Resource Shortage (Waiting Queue)',
    badge: 'Shortage / Deferred',
    description: 'All 4 charging ports are fully occupied and 110 kW out of 120 kW is allocated. EV-05 requests 1 port and 20 kW, exceeding available capacity.',
    objective: 'Demonstrate that requests exceeding Available resources are placed on hold in the waiting queue without wasting computation on safety testing.',
    expectedOutcome: 'WAITING_SHORTAGE',
    stationConfig: { ...DEFAULT_STATION_CONFIG },
    initialVehicles: [
      {
        id: 'EV-01',
        name: 'Voltix Cypher GT',
        model: 'Sport Sedan',
        color: '#06b6d4',
        assignedBay: 1,
        batteryCapacityKwh: 75,
        currentSocPercent: 82,
        targetSocPercent: 90,
        energyDeliveredKwh: 22,
        maxClaim: [1, 4],
        allocation: [1, 3],
        status: 'charging',
        priority: 'normal'
      },
      {
        id: 'EV-02',
        name: 'AeroPulse HyperTourer',
        model: 'Executive Wagon',
        color: '#3b82f6',
        assignedBay: 2,
        batteryCapacityKwh: 90,
        currentSocPercent: 70,
        targetSocPercent: 85,
        energyDeliveredKwh: 18,
        maxClaim: [1, 4],
        allocation: [1, 3],
        status: 'charging',
        priority: 'high'
      },
      {
        id: 'EV-03',
        name: 'Electra Zephyr S',
        model: 'Compact Hatchback',
        color: '#10b981',
        assignedBay: 3,
        batteryCapacityKwh: 50,
        currentSocPercent: 65,
        targetSocPercent: 90,
        energyDeliveredKwh: 12,
        maxClaim: [1, 3],
        allocation: [1, 2],
        status: 'charging',
        priority: 'normal'
      },
      {
        id: 'EV-04',
        name: 'TerraWatt Apex 4WD',
        model: 'Heavy Duty SUV',
        color: '#f59e0b',
        assignedBay: 4,
        batteryCapacityKwh: 105,
        currentSocPercent: 40,
        targetSocPercent: 80,
        energyDeliveredKwh: 15,
        maxClaim: [1, 4],
        allocation: [1, 3],
        status: 'charging',
        priority: 'normal'
      },
      {
        id: 'EV-05',
        name: 'NeoMotion Pulse City',
        model: 'Urban Compact',
        color: '#a855f7',
        assignedBay: null,
        batteryCapacityKwh: 40,
        currentSocPercent: 15,
        targetSocPercent: 90,
        energyDeliveredKwh: 0,
        maxClaim: [1, 2],
        allocation: [0, 0],
        status: 'waiting',
        priority: 'normal'
      }
    ],
    highlightSteps: [
      'Total Ports = 4, Allocated = 4 -> Available Ports = 0.',
      'Total Power = 120 kW (12 units), Allocated = 110 kW (11 units) -> Available = 10 kW (1 unit).',
      'EV-05 requests [1 port, 20 kW].',
      'Request [1, 2] > Available [0, 1].',
      'System defers EV-05 into the waiting queue. EV-05 remains in waiting state until a port is freed.'
    ],
    suggestedAction: {
      label: 'Submit Deficient Request (EV-05: 1 port, 20 kW)',
      vehicleId: 'EV-05',
      request: [1, 2],
      description: 'Request resources when ports are exhausted to test queue deferral.'
    }
  },
  {
    id: 'scenario-d',
    title: 'Scenario D: Dynamic Completion & Waiting Queue Recovery',
    badge: 'Dynamic Recovery',
    description: 'EV-01 reaches 100% target charge, completes its session, releases 1 port and 30 kW back into Available. The system automatically reconciles and grants resources to waiting EV-05.',
    objective: 'Demonstrate resource deallocation upon process completion, recalculation of safety, and accommodation of waiting processes in the system.',
    expectedOutcome: 'DYNAMIC_RECOVERY',
    stationConfig: { ...DEFAULT_STATION_CONFIG },
    initialVehicles: [
      {
        id: 'EV-01',
        name: 'Voltix Cypher GT (Near 100%)',
        model: 'Sport Sedan',
        color: '#06b6d4',
        assignedBay: 1,
        batteryCapacityKwh: 50,
        currentSocPercent: 99.5, // About to finish immediately!
        targetSocPercent: 100,
        energyDeliveredKwh: 24.8,
        maxClaim: [1, 4],
        allocation: [1, 3],
        status: 'charging',
        priority: 'normal'
      },
      {
        id: 'EV-02',
        name: 'AeroPulse HyperTourer',
        model: 'Executive Wagon',
        color: '#3b82f6',
        assignedBay: 2,
        batteryCapacityKwh: 90,
        currentSocPercent: 50,
        targetSocPercent: 85,
        energyDeliveredKwh: 12,
        maxClaim: [1, 5],
        allocation: [1, 3],
        status: 'charging',
        priority: 'normal'
      },
      {
        id: 'EV-03',
        name: 'Electra Zephyr S',
        model: 'Compact Hatchback',
        color: '#10b981',
        assignedBay: 3,
        batteryCapacityKwh: 50,
        currentSocPercent: 60,
        targetSocPercent: 90,
        energyDeliveredKwh: 10,
        maxClaim: [1, 3],
        allocation: [1, 2],
        status: 'charging',
        priority: 'normal'
      },
      {
        id: 'EV-04',
        name: 'TerraWatt Apex 4WD',
        model: 'Heavy Duty SUV',
        color: '#f59e0b',
        assignedBay: 4,
        batteryCapacityKwh: 105,
        currentSocPercent: 45,
        targetSocPercent: 80,
        energyDeliveredKwh: 15,
        maxClaim: [1, 4],
        allocation: [1, 3],
        status: 'charging',
        priority: 'normal'
      },
      {
        id: 'EV-05',
        name: 'NeoMotion Pulse City (Waiting)',
        model: 'Urban Compact',
        color: '#a855f7',
        assignedBay: null,
        batteryCapacityKwh: 40,
        currentSocPercent: 20,
        targetSocPercent: 90,
        energyDeliveredKwh: 0,
        maxClaim: [1, 2],
        allocation: [0, 0],
        status: 'waiting',
        priority: 'high'
      }
    ],
    highlightSteps: [
      'EV-01 reaches 100% target battery.',
      'Station triggers deallocation: EV-01 releases 1 port and 30 kW (3 units).',
      'Available increases to [1 port, 40 kW (4 units)].',
      'System automatically re-evaluates waiting queue: EV-05 requests [1 port, 20 kW].',
      'Banker\'s Algorithm runs safety check on EV-05 -> Verified SAFE!',
      'EV-05 is admitted to Bay 1 and begins charging!'
    ],
    suggestedAction: {
      label: 'Trigger EV-01 Completion & Recovery',
      vehicleId: 'EV-01',
      request: [0, 0], // Completes vehicle
      description: 'Manually complete EV-01 charging to trigger resource release and queue wake-up.'
    }
  }
];
