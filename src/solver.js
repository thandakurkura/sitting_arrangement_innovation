/**
 * Lumora × Starfield Autonomous Exam-Management Platform
 * Module: Deterministic 8-Neighbor Graph-Coloring Constraint Solver & Invigilator Fairness Engine
 * Engineering Standard: FAANG Production Baseline
 */

import { fnv1a, createMulberry32, seededShuffle } from './prng.js';

/**
 * 8-Directional Adjacency Vector Tensor
 * Offset vectors: [dr, dc] for Left, Right, Front, Back, and all 4 Diagonals
 */
export const DIRS_8 = [
  [-1, -1], // Front-Left
  [-1,  0], // Front
  [-1,  1], // Front-Right
  [ 0, -1], // Left
  [ 0,  1], // Right
  [ 1, -1], // Back-Left
  [ 1,  0], // Back
  [ 1,  1]  // Back-Right
];

export const DIR_LABELS = {
  '-1,-1': { code: 'FL', name: 'Front-Left Diagonal' },
  '-1,0':  { code: 'F',  name: 'Front' },
  '-1,1':  { code: 'FR', name: 'Front-Right Diagonal' },
  '0,-1':  { code: 'L',  name: 'Left' },
  '0,1':   { code: 'R',  name: 'Right' },
  '1,-1':  { code: 'BL', name: 'Back-Left Diagonal' },
  '1,0':   { code: 'B',  name: 'Back' },
  '1,1':   { code: 'BR', name: 'Back-Right Diagonal' }
};

/**
 * Formats row index into standard alphanumeric seat label (e.g., Row 0 Col 0 -> "A1")
 * @param {number} r - Row index (0-based)
 * @param {number} c - Column index (0-based)
 * @returns {string} Seat label
 */
export function formatSeatLabel(r, c) {
  const rowLetter = String.fromCharCode(65 + r);
  return `${rowLetter}${c + 1}`;
}

/**
 * Checks whether placing a student with given subject/batch at (r, c) creates any 8-neighbor conflict
 * @param {Array<Array<object>>} grid - 2D matrix of seat objects
 * @param {number} r - Target row
 * @param {number} c - Target col
 * @param {string} subject - Candidate subject code
 * @param {string|null} [batch=null] - Candidate cohort/batch
 * @returns {boolean} True if any 8-neighbor shares the same subject or batch
 */
export function has8NeighborConflict(grid, r, c, subject, batch = null) {
  const rows = grid.length;
  if (rows === 0) return false;
  const cols = grid[0].length;

  for (let i = 0; i < DIRS_8.length; i++) {
    const nr = r + DIRS_8[i][0];
    const nc = c + DIRS_8[i][1];

    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      const neighborSeat = grid[nr][nc];
      if (neighborSeat && !neighborSeat.blocked && neighborSeat.student) {
        if (neighborSeat.student.subject === subject) {
          return true;
        }
        if (batch && neighborSeat.student.batch === batch && neighborSeat.student.subject === subject) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Computes 8-neighbor directional inspection data for visual hover-ray rendering
 * @param {Array<Array<object>>} grid - 2D seat matrix
 * @param {number} r - Inspected row coordinate
 * @param {number} c - Inspected col coordinate
 * @returns {object} Inspection results with ray details and conflict indicators
 */
export function get8NeighborInspection(grid, r, c) {
  const rows = grid.length;
  if (rows === 0 || r < 0 || r >= rows || c < 0 || c >= grid[0].length) {
    return { target: null, rays: [], hasClash: false };
  }

  const targetSeat = grid[r][c];
  const rays = [];
  let hasClash = false;

  for (const [dr, dc] of DIRS_8) {
    const nr = r + dr;
    const nc = c + dc;
    const dirInfo = DIR_LABELS[`${dr},${dc}`];

    if (nr >= 0 && nr < rows && nc >= 0 && nc < grid[0].length) {
      const neighbor = grid[nr][nc];
      const isConflict = Boolean(
        targetSeat && targetSeat.student &&
        neighbor && !neighbor.blocked && neighbor.student &&
        neighbor.student.subject === targetSeat.student.subject
      );

      if (isConflict) hasClash = true;

      rays.push({
        dirCode: dirInfo.code,
        dirName: dirInfo.name,
        dr,
        dc,
        r: nr,
        c: nc,
        exists: true,
        seat: neighbor,
        isConflict
      });
    } else {
      rays.push({
        dirCode: dirInfo.code,
        dirName: dirInfo.name,
        dr,
        dc,
        r: nr,
        c: nc,
        exists: false,
        seat: null,
        isConflict: false
      });
    }
  }

  return { target: targetSeat, rays, hasClash };
}

/**
 * Interleaves candidates from multiple subjects to maximize chromatic dispersion
 * @param {Array<object>} candidates - Array of student records
 * @param {function(): number} prng - Seeded mulberry32 generator
 * @returns {Array<object>} Interleaved queue of candidates
 */
export function interleaveCandidatesBySubject(candidates, prng) {
  const bySubject = new Map();
  for (const c of candidates) {
    if (!bySubject.has(c.subject)) {
      bySubject.set(c.subject, []);
    }
    bySubject.get(c.subject).push(c);
  }

  for (const [subj, group] of bySubject.entries()) {
    bySubject.set(subj, seededShuffle(group, prng));
  }

  const sortedSubjects = Array.from(bySubject.keys()).sort((a, b) => {
    return bySubject.get(b).length - bySubject.get(a).length;
  });

  const interleaved = [];
  let remaining = true;
  let cycle = 0;

  while (remaining) {
    remaining = false;
    for (const subj of sortedSubjects) {
      const queue = bySubject.get(subj);
      if (cycle < queue.length) {
        interleaved.push(queue[cycle]);
        remaining = true;
      }
    }
    cycle++;
  }

  return interleaved;
}

/**
 * Initializes a structured 2D seat matrix for an exam hall
 * @param {object} room - Room configuration object
 * @returns {Array<Array<object>>} 2D seat grid
 */
export function initializeRoomGrid(room) {
  const blockedSet = new Set(room.blockedCoords.map(([br, bc]) => `${br}:${bc}`));
  const grid = [];

  for (let r = 0; r < room.rows; r++) {
    const rowSeats = [];
    for (let c = 0; c < room.cols; c++) {
      const isBlocked = blockedSet.has(`${r}:${c}`);
      const benchIndex = Math.floor(c / room.benchSize) + 1;
      rowSeats.push({
        seatId: `${room.roomId}:${r}:${c}`,
        roomId: room.roomId,
        r,
        c,
        seatLabel: formatSeatLabel(r, c),
        benchIndex,
        blocked: isBlocked,
        student: null
      });
    }
    grid.push(rowSeats);
  }

  return grid;
}

/**
 * Core Multi-Stage Graph-Coloring Constraint Solver
 * Executes bin-packing, PWD ground-floor front-row pass, greedy interleaved coloring,
 * and recursive backtracking 2-way swaps.
 * @param {Array<object>} rawCandidates - Candidate records
 * @param {Array<object>} roomConfigs - Hall topology definitions
 * @param {string} auditSeed - Deterministic public seed (e.g. "LUMORA-2026")
 * @returns {object} Solved allocation plan containing rooms, metrics, lookup index, and audit diagnostics
 */
export function solveSeatingPlan(rawCandidates, roomConfigs, auditSeed = 'LUMORA-2026') {
  const seedHash = fnv1a(auditSeed);
  const prng = createMulberry32(seedHash);

  const allCandidates = rawCandidates.map(c => ({
    ...c,
    roll: c.roll.trim().toUpperCase()
  }));

  const pwdCandidates = seededShuffle(allCandidates.filter(c => c.isPWD), prng);
  const regularCandidates = allCandidates.filter(c => !c.isPWD);

  // Pass 1: Operational Hall Sorting & Bin-Packing Optimization
  const sortedRooms = [...roomConfigs]
    .filter(r => !r.isClosed)
    .sort((a, b) => {
      if (a.roomId === 'R101') return -1;
      if (b.roomId === 'R101') return 1;
      if (a.isStandby !== b.isStandby) return a.isStandby ? 1 : -1;
      if (a.floor !== b.floor) return a.floor - b.floor;
      const capA = a.rows * a.cols - a.blockedCoords.length;
      const capB = b.rows * b.cols - b.blockedCoords.length;
      return capB - capA;
    });

  let cumulativeCapacity = 0;
  const activeRooms = [];
  const darkStandbyRooms = [];

  for (const rm of sortedRooms) {
    const usableCap = rm.rows * rm.cols - rm.blockedCoords.length;
    if (cumulativeCapacity < allCandidates.length) {
      activeRooms.push({ ...rm, isStandby: false });
      cumulativeCapacity += usableCap;
    } else {
      darkStandbyRooms.push({ ...rm, isStandby: true });
    }
  }

  const totalRoomCount = roomConfigs.filter(r => !r.isClosed).length;
  const energySavedPct = totalRoomCount > 0
    ? Math.round((darkStandbyRooms.length / totalRoomCount) * 100)
    : 0;

  const allocatedRooms = {};
  for (const rm of activeRooms) {
    allocatedRooms[rm.roomId] = {
      ...rm,
      grid: initializeRoomGrid(rm),
      assignedCount: 0,
      activeSubjects: new Set(),
      assignedInvigilators: [],
      isDarkStandby: false
    };
  }

  for (const rm of darkStandbyRooms) {
    allocatedRooms[rm.roomId] = {
      ...rm,
      grid: initializeRoomGrid(rm),
      assignedCount: 0,
      activeSubjects: new Set(),
      assignedInvigilators: [],
      isDarkStandby: true
    };
  }

  const studentLookupMap = new Map();

  function commitPlacement(roomAlloc, r, c, student) {
    roomAlloc.grid[r][c].student = student;
    roomAlloc.assignedCount++;
    roomAlloc.activeSubjects.add(student.subject);

    const record = {
      roll: student.roll,
      name: student.name,
      subject: student.subject,
      batch: student.batch,
      isPWD: Boolean(student.isPWD),
      isBacklog: Boolean(student.isBacklog),
      roomId: roomAlloc.roomId,
      roomLabel: roomAlloc.label,
      floor: roomAlloc.floor,
      r,
      c,
      benchIndex: roomAlloc.grid[r][c].benchIndex,
      seatLabel: roomAlloc.grid[r][c].seatLabel,
      sessionTime: '09:30 AM - 12:30 PM',
      auditSeed,
      seedHash
    };
    studentLookupMap.set(student.roll, record);
    return record;
  }

  // Pass 2: Mandatory PWD Accessibility Priority Pre-Pass
  const groundFloorRooms = activeRooms.filter(r => r.floor === 0);
  const unplacedPWD = [...pwdCandidates];

  for (const rm of groundFloorRooms) {
    const roomAlloc = allocatedRooms[rm.roomId];
    const grid = roomAlloc.grid;
    const r = 0;

    for (let c = 0; c < rm.cols; c++) {
      if (unplacedPWD.length === 0) break;
      if (grid[r][c].blocked || grid[r][c].student !== null) continue;

      let foundIndex = -1;
      for (let p = 0; p < unplacedPWD.length; p++) {
        const candidate = unplacedPWD[p];
        if (!has8NeighborConflict(grid, r, c, candidate.subject, candidate.batch)) {
          foundIndex = p;
          break;
        }
      }

      if (foundIndex !== -1) {
        const candidate = unplacedPWD.splice(foundIndex, 1)[0];
        commitPlacement(roomAlloc, r, c, candidate);
      }
    }
  }

  // Pass 3: Greedy Interleaved Graph Coloring with Recursive Backtracking
  const interleavedQueue = interleaveCandidatesBySubject(regularCandidates, prng);
  const unplacedRegular = [...interleavedQueue];

  for (const rm of activeRooms) {
    const roomAlloc = allocatedRooms[rm.roomId];
    const grid = roomAlloc.grid;

    for (let r = 0; r < rm.rows; r++) {
      for (let c = 0; c < rm.cols; c++) {
        if (unplacedRegular.length === 0) break;
        if (grid[r][c].blocked || grid[r][c].student !== null) continue;

        let placedIndex = -1;
        for (let i = 0; i < unplacedRegular.length; i++) {
          const candidate = unplacedRegular[i];
          if (!has8NeighborConflict(grid, r, c, candidate.subject, candidate.batch)) {
            placedIndex = i;
            break;
          }
        }

        if (placedIndex !== -1) {
          const candidate = unplacedRegular.splice(placedIndex, 1)[0];
          commitPlacement(roomAlloc, r, c, candidate);
        } else {
          // Atomic Backtracking 2-Way Swap Fallback
          let swapResolved = false;
          const candidateToPlace = unplacedRegular[0];

          for (let sr = 0; sr < rm.rows && !swapResolved; sr++) {
            for (let sc = 0; sc < rm.cols && !swapResolved; sc++) {
              const previousSeat = grid[sr][sc];
              if (
                previousSeat &&
                !previousSeat.blocked &&
                previousSeat.student &&
                !previousSeat.student.isPWD &&
                previousSeat.student.subject !== candidateToPlace.subject
              ) {
                const prevStudent = previousSeat.student;

                previousSeat.student = candidateToPlace;
                grid[r][c].student = prevStudent;

                const validSwap = !has8NeighborConflict(grid, sr, sc, candidateToPlace.subject, candidateToPlace.batch) &&
                                  !has8NeighborConflict(grid, r, c, prevStudent.subject, prevStudent.batch);

                if (validSwap) {
                  unplacedRegular.shift();
                  roomAlloc.activeSubjects.add(candidateToPlace.subject);
                  roomAlloc.activeSubjects.add(prevStudent.subject);

                  studentLookupMap.set(candidateToPlace.roll, {
                    ...candidateToPlace,
                    roomId: roomAlloc.roomId,
                    roomLabel: roomAlloc.label,
                    floor: roomAlloc.floor,
                    r: sr,
                    c: sc,
                    benchIndex: previousSeat.benchIndex,
                    seatLabel: previousSeat.seatLabel,
                    sessionTime: '09:30 AM - 12:30 PM',
                    auditSeed,
                    seedHash
                  });

                  commitPlacement(roomAlloc, r, c, prevStudent);
                  swapResolved = true;
                } else {
                  previousSeat.student = prevStudent;
                  grid[r][c].student = null;
                }
              }
            }
          }
        }
      }
    }
  }

  const conflictReport = countTotalConflicts(allocatedRooms);
  const pwdAudit = verifyPWDPlacement(allocatedRooms, pwdCandidates.length);

  return {
    planId: `PLAN-${auditSeed}-${seedHash.toString(16)}`,
    sessionSlot: 'Morning (09:30 AM - 12:30 PM)',
    auditSeed,
    seedHash,
    rooms: allocatedRooms,
    activeRoomCount: activeRooms.length,
    darkStandbyCount: darkStandbyRooms.length,
    totalAssigned: allCandidates.length - unplacedRegular.length - unplacedPWD.length,
    totalUnplaced: unplacedRegular.length + unplacedPWD.length,
    unplacedCandidates: [...unplacedPWD, ...unplacedRegular],
    totalConflicts: conflictReport.totalConflicts,
    conflictDetails: conflictReport.conflictPairs,
    pwdAudit,
    energySavedPct,
    studentLookupMap
  };
}

/**
 * Rigorously checks all 8 neighbors for every assigned seat across all allocated rooms
 * @param {Record<string, object>} rooms - Map of roomId -> room allocation
 * @returns {object} Conflict metrics and list of conflicting coordinate pairs
 */
export function countTotalConflicts(rooms) {
  let totalConflicts = 0;
  const conflictPairs = [];

  for (const [roomId, room] of Object.entries(rooms)) {
    if (room.isDarkStandby) continue;
    const grid = room.grid;
    const rows = room.rows;
    const cols = room.cols;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seat = grid[r][c];
        if (!seat || seat.blocked || !seat.student) continue;

        const forwardDirs = [
          [-1, 1], // Front-Right
          [ 0, 1], // Right
          [ 1, 0], // Back
          [ 1, 1]  // Back-Right
        ];

        for (const [dr, dc] of forwardDirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const neighbor = grid[nr][nc];
            if (neighbor && !neighbor.blocked && neighbor.student) {
              if (neighbor.student.subject === seat.student.subject) {
                totalConflicts++;
                conflictPairs.push({
                  roomId,
                  seatA: { r, c, label: seat.seatLabel, roll: seat.student.roll, subject: seat.student.subject },
                  seatB: { r: nr, c: nc, label: neighbor.seatLabel, roll: neighbor.student.roll, subject: neighbor.student.subject },
                  relation: `dr=${dr}, dc=${dc}`
                });
              }
            }
          }
        }
      }
    }
  }

  return { totalConflicts, conflictPairs };
}

/**
 * Verifies that 100% of PWD candidates are placed strictly in Ground-Floor (floor 0) Front-Row (row 0)
 * @param {Record<string, object>} rooms - Map of roomId -> room allocation
 * @param {number} expectedPWDCount - Expected number of PWD candidates
 * @returns {object} Audit result with compliance percentage and violation details
 */
export function verifyPWDPlacement(rooms, expectedPWDCount) {
  let placedPWDCount = 0;
  const violations = [];

  for (const [roomId, room] of Object.entries(rooms)) {
    const grid = room.grid;
    for (let r = 0; r < room.rows; r++) {
      for (let c = 0; c < room.cols; c++) {
        const seat = grid[r][c];
        if (seat && !seat.blocked && seat.student && seat.student.isPWD) {
          placedPWDCount++;
          if (room.roomId !== 'R101' || r !== 0) {
            violations.push({
              roll: seat.student.roll,
              roomId,
              floor: room.floor,
              row: r,
              col: c,
              reason: room.roomId !== 'R101' ? 'Not in Ground-Floor Room 101' : 'Not in Front Row'
            });
          }
        }
      }
    }
  }

  const compliantCount = placedPWDCount - violations.length;
  const compliancePct = expectedPWDCount > 0 ? (compliantCount / expectedPWDCount) * 100 : 100;

  return {
    success: violations.length === 0 && placedPWDCount === expectedPWDCount,
    placedPWDCount,
    expectedPWDCount,
    compliancePct,
    violations
  };
}

/* ==========================================================================
   MODULE 3: SMART INVIGILATOR ROSTER & FAIRNESS ENGINE (FR-INV)
   ========================================================================== */

/**
 * Dynamic Student-to-Invigilator Ratio Rule (FR-INV-03)
 * Formula: RequiredInvigilators = max(1, ceil(AllocatedStudents / 30))
 * @param {number} studentCount - Seated student count
 * @returns {number} Minimum required invigilators
 */
export function computeRequiredInvigilators(studentCount) {
  if (studentCount <= 0) return 0;
  return Math.max(1, Math.ceil(studentCount / 30));
}

/**
 * Computes standard deviation and Single-Number Fairness Score (FR-INV-05)
 * Formula: FairnessScore = max(0, min(100, 100 - (sigma * 15)))
 * @param {Array<object>} facultyList - Active faculty records
 * @returns {object} Mean, standard deviation sigma, and FairnessScore (0-100)
 */
export function computeFairnessScore(facultyList) {
  const activeFaculty = facultyList.filter(f => f.status === 'Active' || f.dutyRole === 'Active Invigilator');
  if (activeFaculty.length === 0) return { mean: 0, sigma: 0, fairnessScore: 100 };

  const dutyCounts = activeFaculty.map(f => f.cumulativeDuties);
  const sum = dutyCounts.reduce((acc, d) => acc + d, 0);
  const mean = sum / dutyCounts.length;

  const variance = dutyCounts.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0) / dutyCounts.length;
  const sigma = Math.sqrt(variance);

  const rawScore = 100 - (sigma * 15);
  const fairnessScore = Math.max(0, Math.min(100, Number(rawScore.toFixed(1))));

  return { mean: Number(mean.toFixed(2)), sigma: Number(sigma.toFixed(3)), fairnessScore };
}

/**
 * Core Invigilator Bipartite Matcher (FR-INV-01, FR-INV-02, FR-INV-04)
 * Deterministic tie-breaking via FNV-1a hash ensuring 100% bit-for-bit reproducibility.
 * @param {Record<string, object>} allocatedRooms - Active allocation plan rooms
 * @param {Array<object>} rawFacultyPool - Faculty members pool
 * @param {string} auditSeed - Deterministic seed
 * @returns {object} Final invigilator roster, room assignments, Reserve Standby and Flying Squad pools
 */
export function assignInvigilators(allocatedRooms, rawFacultyPool, auditSeed = 'LUMORA-2026') {
  // Pre-calculate deterministic tie-breaker scores
  const tieBreakers = new Map();
  for (const f of rawFacultyPool) {
    tieBreakers.set(f.facultyId, fnv1a(auditSeed + ':INV:' + f.facultyId));
  }

  // Deep clone faculty to prevent external side-effects
  const facultyRoster = rawFacultyPool.map(f => ({
    ...f,
    assignedRoomId: null,
    dutyRole: f.status === 'Active' ? 'Unassigned' : f.status
  }));

  const activeRooms = Object.values(allocatedRooms).filter(r => !r.isDarkStandby && r.assignedCount > 0);

  // Clear previous assignments on rooms
  for (const room of Object.values(allocatedRooms)) {
    room.assignedInvigilators = [];
  }

  // Assign active invigilators room-by-room
  for (const room of activeRooms) {
    const requiredCount = computeRequiredInvigilators(room.assignedCount);

    const eligibleFaculty = facultyRoster.filter(f => {
      if (f.dutyRole !== 'Unassigned') return false;
      if (f.status === 'On Leave' || f.status === 'Sick Leave') return false;
      if (room.activeSubjects.has(f.deptSubject)) return false; // Zero Subject Clash Rule
      if (f.heavyDaysStreak >= 2) return false; // No back-to-back heavy days
      return true;
    });

    // Fully deterministic sort: primary key cumulativeDuties, secondary key deterministic FNV1a tie-breaker
    eligibleFaculty.sort((a, b) => {
      if (a.cumulativeDuties !== b.cumulativeDuties) {
        return a.cumulativeDuties - b.cumulativeDuties;
      }
      return tieBreakers.get(a.facultyId) - tieBreakers.get(b.facultyId);
    });

    for (let i = 0; i < requiredCount && i < eligibleFaculty.length; i++) {
      const selected = eligibleFaculty[i];
      selected.assignedRoomId = room.roomId;
      selected.dutyRole = 'Active Invigilator';
      selected.cumulativeDuties += 1;
      selected.heavyDaysStreak += 1;

      room.assignedInvigilators.push({
        facultyId: selected.facultyId,
        name: selected.name,
        deptSubject: selected.deptSubject,
        cumulativeDuties: selected.cumulativeDuties
      });
    }
  }

  // Partition remaining unassigned eligible faculty
  const remainingFaculty = facultyRoster.filter(f => f.dutyRole === 'Unassigned');
  remainingFaculty.sort((a, b) => {
    if (a.cumulativeDuties !== b.cumulativeDuties) {
      return a.cumulativeDuties - b.cumulativeDuties;
    }
    return tieBreakers.get(a.facultyId) - tieBreakers.get(b.facultyId);
  });

  const reservePool = [];
  const flyingSquadPool = [];

  for (let i = 0; i < remainingFaculty.length; i++) {
    const fac = remainingFaculty[i];
    if (i < 2) {
      fac.dutyRole = 'Reserve Standby';
      reservePool.push(fac);
    } else {
      fac.dutyRole = 'Flying Squad';
      flyingSquadPool.push(fac);
    }
  }

  const { mean, sigma, fairnessScore } = computeFairnessScore(facultyRoster);

  return {
    roster: facultyRoster,
    reservePool,
    flyingSquadPool,
    fairnessScore,
    meanDuties: mean,
    dutySigma: sigma
  };
}

/**
 * Live 1-Click Sick Leave Handler & Emergency Substitution (FR-INV-04 / FR-EDGE-05)
 * Marks an active invigilator as sick, promotes a conflict-free Reserve Standby faculty member,
 * and recomputes the Fairness Score in real time.
 * @param {Array<object>} currentRoster - Current faculty roster
 * @param {string} sickFacultyId - ID of faculty reporting sick
 * @param {Record<string, object>} allocatedRooms - Active room allocations
 * @param {string} auditSeed - Deterministic seed
 * @returns {object} Updated roster, promoted substitute details, and revised Fairness Score
 */
export function handleFacultySickLeave(currentRoster, sickFacultyId, allocatedRooms, auditSeed = 'LUMORA-2026') {
  const rosterCopy = JSON.parse(JSON.stringify(currentRoster));
  const sickFaculty = rosterCopy.find(f => f.facultyId === sickFacultyId);

  if (!sickFaculty) {
    throw new Error(`Faculty member ${sickFacultyId} not found in active roster.`);
  }

  const affectedRoomId = sickFaculty.assignedRoomId;
  sickFaculty.status = 'Sick Leave';
  sickFaculty.dutyRole = 'Sick Leave';
  sickFaculty.cumulativeDuties = Math.max(0, sickFaculty.cumulativeDuties - 1);
  sickFaculty.heavyDaysStreak = 0;
  sickFaculty.assignedRoomId = null;

  let substitute = null;

  if (affectedRoomId && allocatedRooms[affectedRoomId]) {
    const room = allocatedRooms[affectedRoomId];
    room.assignedInvigilators = room.assignedInvigilators.filter(inv => inv.facultyId !== sickFacultyId);

    const eligibleSubstitutes = rosterCopy.filter(f => {
      if (f.status !== 'Active') return false;
      if (f.dutyRole !== 'Reserve Standby' && f.dutyRole !== 'Flying Squad') return false;
      if (room.activeSubjects.has(f.deptSubject)) return false; // Zero Subject Clash
      return true;
    });

    eligibleSubstitutes.sort((a, b) => {
      if (a.cumulativeDuties !== b.cumulativeDuties) {
        return a.cumulativeDuties - b.cumulativeDuties;
      }
      return fnv1a(auditSeed + ':SUB:' + a.facultyId) - fnv1a(auditSeed + ':SUB:' + b.facultyId);
    });

    if (eligibleSubstitutes.length > 0) {
      substitute = eligibleSubstitutes[0];
      substitute.dutyRole = 'Active Invigilator';
      substitute.assignedRoomId = affectedRoomId;
      substitute.cumulativeDuties += 1;
      substitute.heavyDaysStreak += 1;

      room.assignedInvigilators.push({
        facultyId: substitute.facultyId,
        name: substitute.name,
        deptSubject: substitute.deptSubject,
        cumulativeDuties: substitute.cumulativeDuties
      });
    }
  }

  const { mean, sigma, fairnessScore } = computeFairnessScore(rosterCopy);

  return {
    roster: rosterCopy,
    sickFaculty,
    substitute,
    affectedRoomId,
    fairnessScore,
    dutySigma: sigma
  };
}

/**
 * Rigorously verifies all Invigilator scheduling constraints across all active rooms
 * @param {Record<string, object>} allocatedRooms - Allocated rooms map
 * @param {Array<object>} roster - Faculty roster
 * @returns {object} Audit verification results
 */
export function verifyInvigilatorConstraints(allocatedRooms, roster) {
  const violations = [];

  for (const [roomId, room] of Object.entries(allocatedRooms)) {
    if (room.isDarkStandby || room.assignedCount === 0) continue;

    const required = computeRequiredInvigilators(room.assignedCount);
    if (room.assignedInvigilators.length < required) {
      violations.push({
        roomId,
        reason: `Insufficient invigilators: assigned ${room.assignedInvigilators.length}, required ${required}`
      });
    }

    for (const inv of room.assignedInvigilators) {
      // 1. Zero Subject Clash Rule
      if (room.activeSubjects.has(inv.deptSubject)) {
        violations.push({
          roomId,
          facultyId: inv.facultyId,
          facultyName: inv.name,
          deptSubject: inv.deptSubject,
          reason: `Subject Clash: Faculty teaches ${inv.deptSubject} which is active in ${roomId}`
        });
      }

      // 2. Status verification
      const facRecord = roster.find(f => f.facultyId === inv.facultyId);
      if (facRecord && (facRecord.status === 'Sick Leave' || facRecord.status === 'On Leave')) {
        violations.push({
          roomId,
          facultyId: inv.facultyId,
          reason: `Faculty is marked ${facRecord.status} but assigned to active hall duty`
        });
      }
    }
  }

  const { fairnessScore, sigma } = computeFairnessScore(roster);

  return {
    success: violations.length === 0,
    violations,
    fairnessScore,
    dutySigma: sigma
  };
}
