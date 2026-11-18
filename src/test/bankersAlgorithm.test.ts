import { describe, it, expect } from 'vitest';
import { 
  calculateNeed, 
  isVectorLessOrEqual, 
  calculateAvailableResources, 
  runSafetyAlgorithm, 
  evaluateResourceRequest, 
  solveClassicBankers,
  findAllSafeSequences
} from '../engine/bankersAlgorithm';
import { checkSystemInvariants } from '../utils/validators';
import { ElectricVehicle, StationConfig, ResourceVector } from '../types/simulation';

describe("Banker's Algorithm Core Engine & Invariant Verification", () => {
  const stationConfig: StationConfig = {
    totalPorts: 4,
    totalPowerKw: 120, // 12 units of 10 kW
    powerUnitKw: 10,
    transformerName: 'Test-Transformer',
    gridVoltageVolts: 480,
    maxChargingBays: 4,
  };

  const sampleVehicles: ElectricVehicle[] = [
    {
      id: 'EV-01',
      name: 'Voltix GT',
      model: 'Sedan',
      color: '#06b6d4',
      assignedBay: 1,
      batteryCapacityKwh: 75,
      currentSocPercent: 40,
      targetSocPercent: 80,
      energyDeliveredKwh: 5,
      maxClaim: [1, 4],
      allocation: [1, 2],
      status: 'charging',
      priority: 'normal',
    },
    {
      id: 'EV-02',
      name: 'AeroPulse',
      model: 'Wagon',
      color: '#3b82f6',
      assignedBay: 2,
      batteryCapacityKwh: 90,
      currentSocPercent: 50,
      targetSocPercent: 85,
      energyDeliveredKwh: 8,
      maxClaim: [1, 5],
      allocation: [1, 3],
      status: 'charging',
      priority: 'normal',
    },
    {
      id: 'EV-03',
      name: 'Zephyr',
      model: 'Hatch',
      color: '#10b981',
      assignedBay: 3,
      batteryCapacityKwh: 50,
      currentSocPercent: 70,
      targetSocPercent: 90,
      energyDeliveredKwh: 4,
      maxClaim: [1, 3],
      allocation: [1, 1],
      status: 'charging',
      priority: 'normal',
    },
    {
      id: 'EV-04',
      name: 'Apex 4WD',
      model: 'SUV',
      color: '#f59e0b',
      assignedBay: null,
      batteryCapacityKwh: 100,
      currentSocPercent: 20,
      targetSocPercent: 80,
      energyDeliveredKwh: 0,
      maxClaim: [1, 4],
      allocation: [0, 0],
      status: 'waiting',
      priority: 'normal',
    },
  ];

  // Test 1: Classic Silberschatz OS Textbook Problem
  it('1. Classic Silberschatz OS Textbook Reference Test ([3, 3, 2] with P0-P4)', () => {
    const available = [3, 3, 2];
    const allocation = [
      [0, 1, 0], // P0
      [2, 0, 0], // P1
      [3, 0, 2], // P2
      [2, 1, 1], // P3
      [0, 0, 2], // P4
    ];
    const max = [
      [7, 5, 3], // P0
      [3, 2, 2], // P1
      [9, 0, 2], // P2
      [2, 2, 2], // P3
      [4, 3, 3], // P4
    ];

    const result = solveClassicBankers(available, max, allocation);
    expect(result.isSafe).toBe(true);
    expect(result.safeSequence.length).toBe(5);
    // Multiple valid safe sequences exist (e.g. [1, 3, 0, 2, 4] or [1, 3, 4, 0, 2])
    expect(new Set(result.safeSequence).size).toBe(5);
    expect(result.safeSequence[0]).toBe(1); // P1 must be first
    expect(result.safeSequence[1]).toBe(3); // P3 is second
  });

  // Test 2: Correct calculation of Need matrix (Need = Max - Allocation)
  it('2. Correct calculation of Need matrix (Need = Max - Allocation)', () => {
    const need1 = calculateNeed([1, 4], [1, 2]);
    expect(need1).toEqual([0, 2]);

    const need2 = calculateNeed([1, 5], [1, 3]);
    expect(need2).toEqual([0, 2]);

    const need3 = calculateNeed([1, 4], [0, 0]);
    expect(need3).toEqual([1, 4]);

    // Ensure non-negative clamping if allocation equals max
    const need4 = calculateNeed([1, 3], [1, 3]);
    expect(need4).toEqual([0, 0]);
  });

  // Test 3: Correct calculation of Available vector (Available = Total - sum(Allocations))
  it('3. Correct calculation of Available vector from station capacity', () => {
    // Total: [4, 12]
    // Allocations: EV-01 [1, 2] + EV-02 [1, 3] + EV-03 [1, 1] + EV-04 [0, 0] = [3, 6]
    // Available: [4 - 3, 12 - 6] = [1, 6]
    const available = calculateAvailableResources(stationConfig, sampleVehicles);
    expect(available).toEqual([1, 6]);

    // Check invariant
    const invariant = checkSystemInvariants(stationConfig, available, sampleVehicles);
    expect(invariant.isValid).toBe(true);
    expect(invariant.errors).toHaveLength(0);
  });

  // Test 4: Initial state safety check
  it('4. Correctly verifies that initial EV state is SAFE with safe sequence', () => {
    const available = calculateAvailableResources(stationConfig, sampleVehicles);
    const safety = runSafetyAlgorithm(available, sampleVehicles);
    expect(safety.isSafe).toBe(true);
    expect(safety.safeSequence.length).toBe(4);
    expect(safety.safeSequence).toContain('EV-01');
    expect(safety.safeSequence).toContain('EV-02');
    expect(safety.safeSequence).toContain('EV-03');
    expect(safety.safeSequence).toContain('EV-04');
  });

  // Test 5: Safe resource request evaluation and permanent granting
  it('5. Safe resource request is approved and updates Available and Allocation', () => {
    const available = calculateAvailableResources(stationConfig, sampleVehicles);
    const request: ResourceVector = [1, 3]; // EV-04 requests 1 port, 30 kW (3 units)

    const evalResult = evaluateResourceRequest(
      stationConfig,
      available,
      sampleVehicles,
      'EV-04',
      request
    );

    expect(evalResult.granted).toBe(true);
    expect(evalResult.isSafe).toBe(true);
    expect(evalResult.rolledBack).toBe(false);
    expect(evalResult.status).toBe('GRANTED_SAFE');
    expect(evalResult.finalAvailable).toEqual([0, 3]); // [1-1, 6-3]
  });

  // Test 6: Unsafe resource request detection and automatic rollback
  it('6. Unsafe resource request is rejected and tentative allocation is rolled back', () => {
    // Custom tight scenario where Available is [1, 2]
    // EV-01 alloc [1, 3], max [1, 5] -> need [0, 2]
    // EV-02 alloc [1, 3], max [1, 5] -> need [0, 2]
    // EV-03 alloc [1, 3], max [1, 5] -> need [0, 2]
    // Total power = 11 units. Alloc = 9 units -> Available = [1, 2].
    // EV-04 max [1, 3], alloc [0, 0] -> requests [1, 2]!
    const tightConfig: StationConfig = {
      ...stationConfig,
      totalPowerKw: 110, // 11 units
    };
    const tightVehicles: ElectricVehicle[] = [
      {
        ...sampleVehicles[0],
        id: 'EV-01',
        maxClaim: [1, 5],
        allocation: [1, 3],
      },
      {
        ...sampleVehicles[1],
        id: 'EV-02',
        maxClaim: [1, 5],
        allocation: [1, 3],
      },
      {
        ...sampleVehicles[2],
        id: 'EV-03',
        maxClaim: [1, 5],
        allocation: [1, 3],
      },
      {
        ...sampleVehicles[3],
        id: 'EV-04',
        maxClaim: [1, 3],
        allocation: [0, 0],
      },
    ];

    const currentAvail = calculateAvailableResources(tightConfig, tightVehicles);
    expect(currentAvail).toEqual([1, 2]);

    // Request is [1, 2], which is <= Available [1, 2]!
    // A naive algorithm would grant it, leaving Available at [0, 0].
    // But then EV-01, EV-02, EV-03 each need 2 units, and EV-04 needs 1 unit -> NO ONE CAN FINISH!
    const req: ResourceVector = [1, 2];
    const result = evaluateResourceRequest(
      tightConfig,
      currentAvail,
      tightVehicles,
      'EV-04',
      req
    );

    expect(result.granted).toBe(false);
    expect(result.isSafe).toBe(false);
    expect(result.rolledBack).toBe(true);
    expect(result.status).toBe('REJECTED_UNSAFE');
    // Available was restored/rolled back!
    expect(result.finalAvailable).toEqual([1, 2]);
  });

  // Test 7: Request exceeding declared maximum claim (Need) is rejected
  it('7. Request exceeding declared maximum claim (Need) is rejected as invalid', () => {
    const available = calculateAvailableResources(stationConfig, sampleVehicles);
    // EV-01 has maxClaim [1, 4] and allocation [1, 2] -> Need is [0, 2]
    // If it asks for 1 port or 3 power units, it exceeds its remaining Need
    const invalidReq: ResourceVector = [1, 2]; // Needs 0 ports, but asks for 1 port!

    const result = evaluateResourceRequest(
      stationConfig,
      available,
      sampleVehicles,
      'EV-01',
      invalidReq
    );

    expect(result.granted).toBe(false);
    expect(result.status).toBe('REJECTED_INVALID_NEED');
    expect(result.message).toContain('exceeds declared maximum remaining Need');
  });

  // Test 8: Request exceeding available resources is deferred
  it('8. Request exceeding available resources is deferred without safety check', () => {
    const available = calculateAvailableResources(stationConfig, sampleVehicles); // [1, 6]
    // EV-04 requests [2, 3] -> exceeds available ports (1)
    const excessReq: ResourceVector = [1, 8]; // Exceeds available power (6)

    // Make sure max claim allows this
    const customVehicles: ElectricVehicle[] = [
      ...sampleVehicles.slice(0, 3),
      {
        ...sampleVehicles[3],
        maxClaim: [1, 10],
      }
    ];

    const result = evaluateResourceRequest(
      stationConfig,
      available,
      customVehicles,
      'EV-04',
      excessReq
    );

    expect(result.granted).toBe(false);
    expect(result.status).toBe('DEFERRED_INSUFFICIENT');
    expect(result.message).toContain('exceeds currently Available');
  });

  // Test 9: Resource release upon vehicle completion
  it('9. Resource release upon vehicle completion restores available capacity', () => {
    const initialAvail = calculateAvailableResources(stationConfig, sampleVehicles); // [1, 6]

    // Simulate EV-01 completing and releasing its [1, 2] resources
    const updatedVehicles: ElectricVehicle[] = sampleVehicles.map(v => {
      if (v.id === 'EV-01') {
        return {
          ...v,
          status: 'completed',
          allocation: [0, 0] as ResourceVector,
        };
      }
      return v;
    });

    const newAvail = calculateAvailableResources(stationConfig, updatedVehicles);
    // Available was [1, 6], released [1, 2] -> becomes [2, 8]
    expect(newAvail).toEqual([2, 8]);

    // Invariant holds
    const invariant = checkSystemInvariants(stationConfig, newAvail, updatedVehicles);
    expect(invariant.isValid).toBe(true);
  });

  // Test 10: Invariant maintenance (Total = Available + Sum(Allocations))
  it('10. Total Resources = Available + Sum(Allocations) invariant holds across transitions', () => {
    const totalPowerUnits = Math.round(stationConfig.totalPowerKw / stationConfig.powerUnitKw);
    const totalConfig: ResourceVector = [stationConfig.totalPorts, totalPowerUnits];

    let currentAvail = calculateAvailableResources(stationConfig, sampleVehicles);
    let inv = checkSystemInvariants(stationConfig, currentAvail, sampleVehicles);
    expect(inv.isValid).toBe(true);

    // After tentative grant to EV-04 of [1, 3]
    const updatedVehicles: ElectricVehicle[] = sampleVehicles.map(v => {
      if (v.id === 'EV-04') {
        return { ...v, allocation: [1, 3] as ResourceVector };
      }
      return v;
    });
    currentAvail = calculateAvailableResources(stationConfig, updatedVehicles);
    inv = checkSystemInvariants(stationConfig, currentAvail, updatedVehicles);
    expect(inv.isValid).toBe(true);
    expect(inv.totalConfigured).toEqual(totalConfig);
    expect(inv.calculatedAvailable).toEqual(currentAvail);
  });

  // Test 11: Multiple safe sequence enumeration
  it('11. Finds multiple valid safe sequences when alternative orders exist', () => {
    const available = calculateAvailableResources(stationConfig, sampleVehicles);
    const allSequences = findAllSafeSequences(available, sampleVehicles, 5);

    expect(allSequences.length).toBeGreaterThan(1);
    // Each safe sequence must contain all active vehicles
    allSequences.forEach(seq => {
      expect(seq.length).toBe(4);
      expect(new Set(seq).size).toBe(4);
    });
  });
});
