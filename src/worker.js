/**
 * Lumora × Starfield Autonomous Exam-Management Platform
 * Phase 8: Web Worker Asynchronous Computation Engine (FR-WORKER)
 * Engineering Standard: FAANG Production Baseline (Zero-Build ES Module Worker)
 */

import {
  solveSeatingPlan,
  assignInvigilators,
  countTotalConflicts,
  verifyPWDPlacement
} from './solver.js';

import {
  DEFAULT_ROOMS,
  generateDefaultCandidates,
  generateDefaultFacultyPool
} from './data.js';

import {
  scheduleClashFreeDatesheet,
  DEFAULT_EXAM_SLOTS
} from './scale.js';

import { runInMemorySelfTest } from './tests.js';

/**
 * Core worker message processor.
 * Designed to run inside browser WebWorker or synchronously in headless environments.
 * @param {object} messageData - Payload containing action, params, and messageId
 * @returns {object} Response object with timing, status, and payload
 */
export function processWorkerTask(messageData) {
  const { action, params = {}, messageId } = messageData || {};
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    switch (action) {
      case 'PING': {
        const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
        return {
          action,
          messageId,
          success: true,
          executionTimeMs: Math.round(elapsed * 100) / 100,
          data: { status: 'PONG', timestamp: new Date().toISOString() }
        };
      }

      case 'SOLVE_PLAN': {
        const { candidates, rooms, auditSeed = 'LUMORA-2026' } = params;
        if (!candidates || !rooms) {
          throw new Error('Worker SOLVE_PLAN Error: candidates and rooms parameters are required.');
        }

        const plan = solveSeatingPlan(candidates, rooms, auditSeed);
        const conflicts = countTotalConflicts(plan.rooms);
        const pwdAudit = verifyPWDPlacement(plan.rooms, candidates.filter(c => c.isPWD).length);

        // Convert Map to array of entries for structured clone safety
        const lookupEntries = Array.from(plan.studentLookupMap.entries());

        const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

        return {
          action,
          messageId,
          success: true,
          executionTimeMs: Math.round(elapsed * 100) / 100,
          data: {
            ...plan,
            studentLookupMap: null, // nullified for structured clone transfer
            studentLookupEntries: lookupEntries,
            conflicts: conflicts.totalConflicts,
            pwdCompliancePct: pwdAudit.compliancePct,
            pwdAudit,
            auditSeed,
            seedHash: plan.seedHash
          }
        };
      }

      case 'ASSIGN_INVIGILATORS': {
        const { rooms, facultyPool, auditSeed = 'LUMORA-2026' } = params;
        if (!rooms || !facultyPool) {
          throw new Error('Worker ASSIGN_INVIGILATORS Error: rooms and facultyPool are required.');
        }

        const invPlan = assignInvigilators(rooms, facultyPool, auditSeed);
        const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

        return {
          action,
          messageId,
          success: true,
          executionTimeMs: Math.round(elapsed * 100) / 100,
          data: invPlan
        };
      }

      case 'SCHEDULE_DATESHEET': {
        const { candidates, slots = DEFAULT_EXAM_SLOTS, auditSeed = 'LUMORA-2026' } = params;
        if (!candidates) {
          throw new Error('Worker SCHEDULE_DATESHEET Error: candidates parameter is required.');
        }

        const datesheet = scheduleClashFreeDatesheet(candidates, slots, auditSeed);
        const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

        return {
          action,
          messageId,
          success: true,
          executionTimeMs: Math.round(elapsed * 100) / 100,
          data: {
            success: datesheet.success,
            slots: datesheet.slots,
            clashGraphMetrics: datesheet.clashGraphMetrics,
            verification: datesheet.verification,
            auditSeed
          }
        };
      }

      case 'RUN_FULL_QA_SUITE': {
        const result = runInMemorySelfTest();
        const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

        return {
          action,
          messageId,
          success: true,
          executionTimeMs: Math.round(elapsed * 100) / 100,
          data: result
        };
      }

      default:
        throw new Error(`Worker Error: Unknown or unsupported task action '${action}'.`);
    }
  } catch (err) {
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    return {
      action,
      messageId,
      success: false,
      executionTimeMs: Math.round(elapsed * 100) / 100,
      error: err.message
    };
  }
}

// Hook into Worker global scope if running inside a WebWorker
if (typeof self !== 'undefined' && typeof self.postMessage === 'function' && typeof window === 'undefined') {
  self.onmessage = (event) => {
    const response = processWorkerTask(event.data);
    self.postMessage(response);
  };
}
