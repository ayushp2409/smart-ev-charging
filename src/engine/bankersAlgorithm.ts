import { 
  ElectricVehicle, 
  ResourceVector, 
  SafetyCheckResult, 
  SafetyStep, 
  RequestEvaluationResult,
  StationConfig 
} from '../types/simulation';
import { unitsToKw } from '../utils/calculations';

/**
 * Calculates Need vector dynamically for a vehicle:
 * Need = MaxClaim - Allocation
 * Ensures Need[j] >= 0
 */
export function calculateNeed(maxClaim: ResourceVector, allocation: ResourceVector): ResourceVector {
  return [
    Math.max(0, maxClaim[0] - allocation[0]),
    Math.max(0, maxClaim[1] - allocation[1]),
  ];
}

/**
 * Vector comparison: Returns true if v1 <= v2 element-wise
 */
export function isVectorLessOrEqual(v1: number[], v2: number[]): boolean {
  if (v1.length !== v2.length) return false;
  for (let i = 0; i < v1.length; i++) {
    if (v1[i] > v2[i]) return false;
  }
  return true;
}

/**
 * Element-wise vector addition
 */
export function addVectors<T extends number[]>(v1: T, v2: T): T {
  return v1.map((val, idx) => val + v2[idx]) as T;
}

/**
 * Element-wise vector subtraction
 */
export function subtractVectors<T extends number[]>(v1: T, v2: T): T {
  return v1.map((val, idx) => val - v2[idx]) as T;
}

/**
 * Calculates currently Available resources from total station capacity and vehicle allocations:
 * Available = Total - sum(Allocations of active vehicles)
 */
export function calculateAvailableResources(
  stationConfig: StationConfig,
  vehicles: ElectricVehicle[]
): ResourceVector {
  const totalPowerUnits = Math.round(stationConfig.totalPowerKw / stationConfig.powerUnitKw);
  let allocatedPorts = 0;
  let allocatedPower = 0;

  for (const v of vehicles) {
    if (v.status !== 'completed') {
      allocatedPorts += v.allocation[0];
      allocatedPower += v.allocation[1];
    }
  }

  return [
    Math.max(0, stationConfig.totalPorts - allocatedPorts),
    Math.max(0, totalPowerUnits - allocatedPower),
  ];
}

/**
 * Runs the classical Banker's Safety Algorithm on the given EV set.
 * Produces complete iteration-by-iteration traces for educational visualization.
 */
export function runSafetyAlgorithm(
  available: ResourceVector,
  vehicles: ElectricVehicle[]
): SafetyCheckResult {
  // Only consider active/pending vehicles that are not completed
  const activeVehicles = vehicles.filter(v => v.status !== 'completed');

  if (activeVehicles.length === 0) {
    return {
      isSafe: true,
      safeSequence: [],
      steps: [],
      unfinishableVehicles: [],
      timestamp: Date.now()
    };
  }

  // Step 1: Work = Available
  let work: ResourceVector = [...available];

  // Step 2: Finish[i] = false for all active vehicles
  const finish: Record<string, boolean> = {};
  activeVehicles.forEach(v => {
    finish[v.id] = false;
  });

  const safeSequence: string[] = [];
  const steps: SafetyStep[] = [];
  let stepNumber = 1;

  // Step 3 & 4: Find an index i such that Finish[i] == false and Need[i] <= Work
  let progressMade = true;

  while (progressMade) {
    progressMade = false;

    for (const v of activeVehicles) {
      if (!finish[v.id]) {
        const need = calculateNeed(v.maxClaim, v.allocation);
        const workBefore: ResourceVector = [...work];

        if (isVectorLessOrEqual(need, work)) {
          // Vehicle can complete its work!
          // Work = Work + Allocation[i]
          const workAfter: ResourceVector = [
            work[0] + v.allocation[0],
            work[1] + v.allocation[1]
          ];
          work = [...workAfter];
          finish[v.id] = true;
          safeSequence.push(v.id);
          progressMade = true;

          steps.push({
            stepNumber: stepNumber++,
            workBefore,
            vehicleId: v.id,
            vehicleName: v.name,
            need,
            allocation: [...v.allocation],
            canFinish: true,
            explanation: `Need [${need[0]}p, ${unitsToKw(need[1])} kW] <= Work [${workBefore[0]}p, ${unitsToKw(workBefore[1])} kW]. ${v.name} can complete and release [${v.allocation[0]}p, ${unitsToKw(v.allocation[1])} kW]. New Work: [${workAfter[0]}p, ${unitsToKw(workAfter[1])} kW].`,
            workAfter
          });

          // Restart search to find any newly eligible vehicles with updated Work
          break;
        }
      }
    }
  }

  // Step 5: Check if all active vehicles finished
  const unfinishable = activeVehicles.filter(v => !finish[v.id]);
  const isSafe = unfinishable.length === 0;

  // If unsafe, record a terminal failure step explaining which vehicles could not finish
  if (!isSafe) {
    const unfinishableNames = unfinishable.map(v => v.name).join(', ');
    const firstStuck = unfinishable[0];
    const stuckNeed = calculateNeed(firstStuck.maxClaim, firstStuck.allocation);

    steps.push({
      stepNumber: stepNumber++,
      workBefore: [...work],
      vehicleId: firstStuck.id,
      vehicleName: firstStuck.name,
      need: stuckNeed,
      allocation: [...firstStuck.allocation],
      canFinish: false,
      explanation: `Deadlock avoidance condition failed! Work [${work[0]}p, ${unitsToKw(work[1])} kW] cannot satisfy remaining Need [${stuckNeed[0]}p, ${unitsToKw(stuckNeed[1])} kW] of ${firstStuck.name} (or any other unfinished EV: ${unfinishableNames}). No safe sequence exists!`,
      workAfter: [...work]
    });
  }

  return {
    isSafe,
    safeSequence,
    steps,
    failedAtVehicleId: !isSafe && unfinishable.length > 0 ? unfinishable[0].id : undefined,
    unfinishableVehicles: unfinishable.map(v => v.id),
    timestamp: Date.now()
  };
}

/**
 * Backtracking function to enumerate all distinct safe sequences (up to maxCount)
 */
export function findAllSafeSequences(
  available: ResourceVector,
  vehicles: ElectricVehicle[],
  maxCount: number = 10
): string[][] {
  const activeVehicles = vehicles.filter(v => v.status !== 'completed');
  if (activeVehicles.length === 0) return [];

  const results: string[][] = [];

  function backtrack(currentWork: ResourceVector, finishMap: Record<string, boolean>, currentSeq: string[]) {
    if (results.length >= maxCount) return;

    if (currentSeq.length === activeVehicles.length) {
      results.push([...currentSeq]);
      return;
    }

    for (const v of activeVehicles) {
      if (!finishMap[v.id]) {
        const need = calculateNeed(v.maxClaim, v.allocation);
        if (isVectorLessOrEqual(need, currentWork)) {
          finishMap[v.id] = true;
          currentSeq.push(v.id);
          const nextWork: ResourceVector = [
            currentWork[0] + v.allocation[0],
            currentWork[1] + v.allocation[1]
          ];

          backtrack(nextWork, finishMap, currentSeq);

          // Undo choice
          currentSeq.pop();
          finishMap[v.id] = false;
        }
      }
    }
  }

  const initialFinish: Record<string, boolean> = {};
  activeVehicles.forEach(v => { initialFinish[v.id] = false; });
  backtrack([...available], initialFinish, []);

  return results;
}

/**
 * Resource Request Algorithm:
 * Evaluates whether an EV's resource request can be safely granted.
 * 
 * Step 1: Check if Request <= Need_i (Invalid claim prevention)
 * Step 2: Check if Request <= Available (Resource availability)
 * Step 3: Tentative allocation (Available' = Available - Req, Allocation' = Allocation + Req)
 * Step 4: Run safety algorithm
 * Step 5: If safe -> grant and commit!
 * Step 6: If unsafe -> rollback immediately!
 */
export function evaluateResourceRequest(
  stationConfig: StationConfig,
  currentAvailable: ResourceVector,
  vehicles: ElectricVehicle[],
  targetVehicleId: string,
  request: ResourceVector
): RequestEvaluationResult {
  const timestamp = Date.now();
  const targetVehicle = vehicles.find(v => v.id === targetVehicleId);

  if (!targetVehicle) {
    return {
      granted: false,
      isSafe: false,
      rolledBack: false,
      status: 'REJECTED_INVALID_NEED',
      message: `Vehicle ${targetVehicleId} not found in charging station.`,
      vehicleId: targetVehicleId,
      requested: request,
      previousAvailable: [...currentAvailable],
      finalAvailable: [...currentAvailable],
      timestamp
    };
  }

  const currentNeed = calculateNeed(targetVehicle.maxClaim, targetVehicle.allocation);

  // Check 1: Request <= Need
  if (!isVectorLessOrEqual(request, currentNeed)) {
    return {
      granted: false,
      isSafe: false,
      rolledBack: false,
      status: 'REJECTED_INVALID_NEED',
      message: `Error: Request [${request[0]} port(s), ${unitsToKw(request[1])} kW] exceeds declared maximum remaining Need [${currentNeed[0]} port(s), ${unitsToKw(currentNeed[1])} kW] for ${targetVehicle.name}. Request rejected as invalid.`,
      vehicleId: targetVehicleId,
      requested: request,
      previousAvailable: [...currentAvailable],
      finalAvailable: [...currentAvailable],
      timestamp
    };
  }

  // Check 2: Request <= Available
  if (!isVectorLessOrEqual(request, currentAvailable)) {
    return {
      granted: false,
      isSafe: false,
      rolledBack: false,
      status: 'DEFERRED_INSUFFICIENT',
      message: `Resource shortage: Requested [${request[0]} port(s), ${unitsToKw(request[1])} kW] exceeds currently Available [${currentAvailable[0]} port(s), ${unitsToKw(currentAvailable[1])} kW]. ${targetVehicle.name} placed in waiting queue. No safety check executed on impossible allocation.`,
      vehicleId: targetVehicleId,
      requested: request,
      previousAvailable: [...currentAvailable],
      finalAvailable: [...currentAvailable],
      timestamp
    };
  }

  // Check 3: Tentative Allocation
  const tentativeAvailable: ResourceVector = [
    currentAvailable[0] - request[0],
    currentAvailable[1] - request[1]
  ];

  // Clone vehicles with tentative allocation for target EV
  const tentativeVehicles: ElectricVehicle[] = vehicles.map(v => {
    if (v.id === targetVehicleId) {
      return {
        ...v,
        allocation: [
          v.allocation[0] + request[0],
          v.allocation[1] + request[1]
        ] as ResourceVector
      };
    }
    return { ...v, allocation: [...v.allocation] as ResourceVector };
  });

  // Check 4: Run Safety Algorithm on tentative state
  const safetyResult = runSafetyAlgorithm(tentativeAvailable, tentativeVehicles);

  if (safetyResult.isSafe) {
    // SAFE: Grant the request permanently
    return {
      granted: true,
      isSafe: true,
      rolledBack: false,
      status: 'GRANTED_SAFE',
      message: `Request APPROVED: System remains in a SAFE state with safe sequence: [${safetyResult.safeSequence.join(' -> ')}]. Resources permanently allocated to ${targetVehicle.name}.`,
      vehicleId: targetVehicleId,
      requested: request,
      safetyResult,
      previousAvailable: [...currentAvailable],
      tentativeAvailable,
      finalAvailable: tentativeAvailable,
      timestamp
    };
  } else {
    // UNSAFE: Rollback tentative allocation!
    return {
      granted: false,
      isSafe: false,
      rolledBack: true,
      status: 'REJECTED_UNSAFE',
      message: `Request REJECTED (Deadlock Avoidance): Granting [${request[0]} port(s), ${unitsToKw(request[1])} kW] would leave the charging station in an UNSAFE state. Tentative allocation has been rolled back. Available pool restored.`,
      vehicleId: targetVehicleId,
      requested: request,
      safetyResult,
      previousAvailable: [...currentAvailable],
      tentativeAvailable,
      finalAvailable: [...currentAvailable], // Rolled back!
      timestamp
    };
  }
}

/**
 * Universal Banker's safety check for m-dimensional resource vectors.
 * Used for classic textbook verification (e.g. 3-resource problem [3, 3, 2] with P0-P4).
 */
export function solveClassicBankers(
  available: number[],
  maxMatrix: number[][],
  allocationMatrix: number[][]
): { isSafe: boolean; safeSequence: number[]; steps: string[] } {
  const n = allocationMatrix.length;
  const m = available.length;
  const work = [...available];
  const finish = new Array(n).fill(false);
  const safeSeq: number[] = [];
  const steps: string[] = [];

  // Calculate Need matrix
  const needMatrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    needMatrix[i] = [];
    for (let j = 0; j < m; j++) {
      needMatrix[i][j] = maxMatrix[i][j] - allocationMatrix[i][j];
    }
  }

  let progress = true;
  while (progress) {
    progress = false;
    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        let canFinish = true;
        for (let j = 0; j < m; j++) {
          if (needMatrix[i][j] > work[j]) {
            canFinish = false;
            break;
          }
        }

        if (canFinish) {
          const workBefore = [...work];
          for (let j = 0; j < m; j++) {
            work[j] += allocationMatrix[i][j];
          }
          finish[i] = true;
          safeSeq.push(i);
          progress = true;
          steps.push(`P${i}: Need [${needMatrix[i]}] <= Work [${workBefore}]. Allocated [${allocationMatrix[i]}] released -> New Work [${work}]`);
          break;
        }
      }
    }
  }

  const isSafe = finish.every(f => f === true);
  return { isSafe, safeSequence: safeSeq, steps };
}
