export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const EDUCATIONAL_TOPICS = [
  {
    id: 'deadlock-overview',
    title: '1. What is a Deadlock in Operating Systems?',
    category: 'Foundations',
    summary: 'A state where a set of processes are permanently blocked because each process holds resources and waits for others held by other processes.',
    content: `
### Understanding Deadlocks

In computing, a **deadlock** occurs when two or more concurrent processes cannot proceed because each is waiting for a resource that is currently held by another process in the set.

#### Real-World EV Charging Analogy:
Imagine an EV charging station with a shared transformer and multiple charging bays:
- **Vehicle A** is plugged into a port (holds Port 1) and requires 50 kW to charge, but only 20 kW is currently available. It sits holding the port waiting for more electrical power.
- **Vehicle B** holds 60 kW of power in an adjacent bay and is waiting for an auxiliary DC-converter port that Vehicle A is occupying.
- Neither vehicle can finish. Neither releases what it holds. Both remain stalled indefinitely.

In an electric grid, this stalls physical traffic, causes severe queue backup, and in electrical systems, can trip transformer circuit breakers, triggering brownouts or grid blackouts.
    `
  },
  {
    id: 'coffman-conditions',
    title: '2. The Four Necessary Coffman Conditions',
    category: 'Theory',
    summary: 'Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait. Deadlock can arise if and only if all four conditions hold simultaneously.',
    content: `
### The 4 Coffman Conditions (1971)

For a deadlock to occur, **all four** of the following conditions must hold simultaneously:

1. **Mutual Exclusion (Mutex):**
   - At least one resource must be non-shareable. Only one process can use the resource at a time.
   - *EV Analogy:* A physical charging plug/cable can only be plugged into one vehicle's charging inlet at any given instant.

2. **Hold and Wait:**
   - A process must be holding at least one resource and requesting additional resources held by other processes.
   - *EV Analogy:* An EV is currently occupying a charging port ($R_1$) and waiting for the electrical grid to allocate higher power ($R_2$) without releasing the port.

3. **No Preemption:**
   - Resources cannot be forcibly taken away from a process; they can only be released voluntarily after the process finishes its task.
   - *EV Analogy:* Unplugging a high-voltage charging cable mid-session or cutting off an EV's battery management system abruptly causes electrical arcing, warranty invalidation, and battery damage.

4. **Circular Wait:**
   - A closed chain of processes exists: $P_0$ waits for $P_1$, $P_1$ waits for $P_2$, ..., and $P_k$ waits for $P_0$.
   - *EV Analogy:* EV-1 holds a port and waits for power held by EV-2; EV-2 holds power and waits for transformer capacity held by EV-3; EV-3 holds power and waits for the bay held by EV-1.
    `
  },
  {
    id: 'avoidance-vs-prevention',
    title: '3. Deadlock Prevention vs. Avoidance vs. Detection',
    category: 'Strategies',
    summary: 'Prevention constrains resource requests to break one Coffman condition; Avoidance dynamically evaluates states using Banker\'s Algorithm.',
    content: `
### Deadlock Handling Strategies

Modern Operating Systems have four primary philosophies for handling deadlocks:

| Strategy | Mechanism | EV Station Tradeoff |
|---|---|---|
| **Ostrich Algorithm (Ignore)** | Pretend deadlocks never occur. Reboot when stuck. | Dangerous for power grids; risks electrical overloads and trapped vehicles. |
| **Deadlock Prevention** | Structurally negate at least one Coffman condition (e.g. demand all resources upfront, or enforce linear ordering). | Highly inefficient. EVs would have to reserve full 100 kW even if they only need 20 kW initially, drastically reducing station throughput. |
| **Deadlock Avoidance (Banker's)** | Dynamically monitor resource claims. Only grant a request if the resulting state is guaranteed to have a **Safe Sequence**. | Optimal balance: allows dynamic, incremental allocation while mathematically guaranteeing that deadlocks are never reached. |
| **Deadlock Detection & Recovery** | Allow deadlocks, detect cycles, and terminate/abort processes to recover. | Unacceptable in high-voltage charging: interrupting an active charge without BMS handshake can damage vehicle electronics. |
    `
  },
  {
    id: 'safe-vs-unsafe',
    title: '4. Safe State vs. Unsafe State vs. Deadlock',
    category: 'Core Concepts',
    summary: 'An unsafe state is NOT a deadlock! An unsafe state means the system cannot guarantee that deadlock will not occur under worst-case maximum claims.',
    content: `
### Critical Distinction: Unsafe State $\\neq$ Deadlock

One of the most common misunderstandings in Operating Systems is confusing an **Unsafe State** with an active **Deadlock**.

\`\`\`
+---------------------------------------------------+
|               ALL POSSIBLE STATES                 |
|  +---------------------------------------------+  |
|  |                SAFE STATES                  |  |
|  |  (Guaranteed safe sequence exists)          |  |
|  +---------------------------------------------+  |
|  +---------------------------------------------+  |
|  |               UNSAFE STATES                 |  |
|  |  (No guaranteed safe sequence under max)    |  |
|  |      +-------------------------------+      |  |
|  |      |            DEADLOCK           |      |  |
|  |      +-------------------------------+      |  |
|  +---------------------------------------------+  |
+---------------------------------------------------+
\`\`\`

- **Safe State:** There exists at least one order (**Safe Sequence**) in which every active process can receive its maximum declared resources, finish its execution, and release all allocated resources.
- **Unsafe State:** There is **NO** guarantee that all processes can finish if every process suddenly requests its declared maximum claim simultaneously.
- **Deadlock:** The actual realization where processes are permanently stuck in circular wait.

> **Key Rule of Banker's Algorithm:**
> Banker's Algorithm never allows the system to enter an **Unsafe State**. By keeping the system strictly within the **Safe State space**, deadlocks are 100% avoided!
    `
  },
  {
    id: 'bankers-mechanics',
    title: '5. How Banker\'s Algorithm Actually Executes',
    category: 'Algorithm',
    summary: 'Safety Algorithm + Resource Request Algorithm. Vectors: Available, Max, Allocation, Need = Max - Allocation.',
    content: `
### The Mathematical Engine

Invented by Edsger Dijkstra in 1965, the algorithm is named after a bank that never allocates cash unless it can satisfy the credit line of at least one customer who will then repay in full.

#### Core Data Structures (for $n$ vehicles, $m$ resources):
1. **Available $[m]$:** Vector of unallocated resources currently in the station pool.
2. **Max $[n \\times m]$:** Matrix declaring the maximum resources vehicle $i$ might demand.
3. **Allocation $[n \\times m]$:** Matrix of resources currently assigned to vehicle $i$.
4. **Need $[n \\times m]$:** Matrix of remaining resources vehicle $i$ may request:
   $$\\text{Need}[i][j] = \\text{Max}[i][j] - \\text{Allocation}[i][j]$$

#### Safety Algorithm Steps:
1. Let $\\text{Work} = \\text{Available}$, and $\\text{Finish}[i] = \\text{false}$ for all active vehicles.
2. Search for an index $i$ such that:
   $$\\text{Finish}[i] == \\text{false} \\quad \\text{and} \\quad \\text{Need}[i] \\le \\text{Work}$$
3. If such an $i$ exists:
   $$\\text{Work} = \\text{Work} + \\text{Allocation}[i]$$
   $$\\text{Finish}[i] = \\text{true}$$
   Record $i$ into the **Safe Sequence**. Return to Step 2.
4. If all $\\text{Finish}[i] == \\text{true}$, the state is **SAFE**! Otherwise, it is **UNSAFE**.

#### Resource-Request Algorithm:
When vehicle $i$ requests vector $\\text{Req}$:
1. If $\\text{Req} > \\text{Need}[i]$: Reject (Process exceeded maximum claim).
2. If $\\text{Req} > \\text{Available}$: Wait (Resources currently unavailable).
3. Tentatively allocate:
   $$\\text{Available}' = \\text{Available} - \\text{Req}$$
   $$\\text{Allocation}[i]' = \\text{Allocation}[i] + \\text{Req}$$
   $$\\text{Need}[i]' = \\text{Need}[i] - \\text{Req}$$
4. Run the Safety Algorithm on the tentative state:
   - If **SAFE**: Grant the request permanently.
   - If **UNSAFE**: Roll back the tentative state; restore original $\\text{Available}$ and $\\text{Allocation}$; vehicle waits.
    `
  },
  {
    id: 'ev-charging-relevance',
    title: '6. Why Banker\'s Algorithm Fits Smart EV Charging',
    category: 'Real-World Relevance',
    summary: 'EV charging involves discrete physical bays, shared transformer power limits, and upfront vehicle-to-grid communication handshakes (ISO 15118).',
    content: `
### Real-World Cyber-Physical System Relevance

In traditional OS courses, Banker's Algorithm is taught using abstract threads and memory pages. However, modern Smart EV Charging Infrastructure is a perfect physical implementation:

1. **Protocol Handshake (ISO 15118 / CCS):**
   When an electric vehicle plugs into a DC fast charger, the vehicle's onboard computer communicates its **Battery Capacity**, **Current SOC**, and **Maximum Inverter Power Acceptance** to the station controller. This directly populates the **Max Claim Matrix** upfront!

2. **Multiple Distinct Resource Types:**
   - **Resource 1 (Ports):** Physical parking spaces and cables (spatial mutual exclusion).
   - **Resource 2 (Power Capacity in kW):** Electrical energy capacity constrained by the local distribution transformer and feeder lines.

3. **Incremental Power Demands:**
   Modern EV batteries do not charge at constant wattage. During the constant-current (CC) phase they ramp up power; as the battery fills (CV phase), power demand tapers. Incremental resource requests mirror real vehicle charging curves.

4. **Grid Safety & Brownout Prevention:**
   If station controllers greedily allocate power without verifying that all vehicles can safely complete, peak concurrent demand could exceed transformer ratings, tripping main circuit breakers and deadlocking the entire station.
    `
  }
];

export const BANKER_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What is the fundamental difference between an Unsafe State and a Deadlock?',
    options: [
      'They are identical terms in Operating Systems.',
      'An unsafe state is not necessarily deadlocked; it simply means the system cannot guarantee avoidance of deadlock under worst-case maximum claims.',
      'A deadlock can always recover automatically, whereas an unsafe state is permanent.',
      'An unsafe state only happens when Available resources are zero.'
    ],
    correctIndex: 1,
    explanation: 'An unsafe state means there is no guaranteed safe sequence if every process claims its maximum declared resources. However, processes might release resources before requesting their maximum, so deadlock is not guaranteed—only possible.'
  },
  {
    id: 'q2',
    question: 'How is the Need matrix calculated in Banker\'s Algorithm?',
    options: [
      'Need = Allocation - Available',
      'Need = Maximum - Available',
      'Need = Maximum - Allocation',
      'Need = Allocation + Available'
    ],
    correctIndex: 2,
    explanation: 'Need represents the remaining resources a process might demand in the future: Need[i][j] = Maximum[i][j] - Allocation[i][j].'
  },
  {
    id: 'q3',
    question: 'What does a "Safe Sequence" represent?',
    options: [
      'The exact real-time chronological order in which vehicles must charge.',
      'A hypothetical feasible completion order demonstrating that all processes could finish without deadlock.',
      'The list of rejected vehicles in order of priority.',
      'The chronological order of vehicle arrivals.'
    ],
    correctIndex: 1,
    explanation: 'A safe sequence is a hypothetical proof of feasibility: if processes are scheduled in this sequence under their maximum claims, no deadlock can occur.'
  },
  {
    id: 'q4',
    question: 'What happens when a resource request tentatively leads to an UNSAFE state?',
    options: [
      'The request is granted anyway and the OS crashes.',
      'The OS reboots all processes in the system.',
      'The tentative allocation is immediately rolled back and the process is deferred or rejected.',
      'The process is terminated and removed permanently.'
    ],
    correctIndex: 2,
    explanation: 'Under Banker\'s Algorithm, if the tentative state lacks a safe sequence, the tentative allocation is immediately rolled back to the original Available and Allocation matrices, and the request is rejected/deferred.'
  },
  {
    id: 'q5',
    question: 'Why must vehicles declare their Maximum Claim upfront in Banker\'s Algorithm?',
    options: [
      'Because the algorithm needs a theoretical upper bound to test whether worst-case requests can be satisfied.',
      'Because vehicles cannot change charging speed once plugged in.',
      'To prevent the vehicle from using electricity.',
      'Because memory is too limited to re-calculate values.'
    ],
    correctIndex: 0,
    explanation: 'Banker\'s Algorithm is a conservative deadlock avoidance algorithm; it requires a priori knowledge of the maximum claim of each process to verify that worst-case resource demands can be accommodated.'
  }
];
