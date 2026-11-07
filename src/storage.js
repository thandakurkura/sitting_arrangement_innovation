/**
 * Lumora × Starfield Autonomous Exam-Management Platform
 * Phase 7: Offline-First Storage & Serialization Engine (FR-STORAGE)
 * Engineering Standard: FAANG Production Baseline
 */

import { fnv1a } from './prng.js';
import { countTotalConflicts, verifyPWDPlacement } from './solver.js';

export const STORAGE_KEYS = {
  ACTIVE_PLAN: 'LUMORA_ACTIVE_PLAN_V1',
  ACTIVE_ROSTER: 'LUMORA_ACTIVE_ROSTER_V1',
  AUDIT_SEED: 'LUMORA_ACTIVE_SEED_V1',
  OFFLINE_SNAPSHOT_TIMESTAMP: 'LUMORA_SNAPSHOT_TS_V1'
};

/**
 * Computes an integrity checksum hash for a serialized string
 * @param {string} payloadStr - Serialized JSON payload
 * @returns {string} Hexadecimal checksum hash
 */
export function computePayloadChecksum(payloadStr) {
  const hash = fnv1a(payloadStr);
  return '0x' + (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Serializes an active examination plan into an offline-safe JSON payload
 * Converts Map instances (studentLookupMap) into serializable tuples
 * @param {object} plan - Active solved seating plan
 * @param {string} [auditSeed='LUMORA-2026'] - Deterministic PRNG audit seed
 * @returns {string} Serialized JSON string with integrity envelope
 */
export function serializeExamPlan(plan, auditSeed = 'LUMORA-2026') {
  if (!plan || !plan.rooms) {
    throw new Error('Serialization Error: Invalid examination plan provided.');
  }

  // Convert Map to array of key-value pairs for lossless JSON serialization
  const serializedLookup = plan.studentLookupMap instanceof Map
    ? Array.from(plan.studentLookupMap.entries())
    : Object.entries(plan.studentLookupMap || {});

  const serializablePayload = {
    version: '1.0.0',
    auditSeed,
    totalAssigned: plan.totalAssigned,
    totalCapacity: plan.totalCapacity,
    utilizationRate: plan.utilizationRate,
    timestamp: new Date().toISOString(),
    rooms: plan.rooms,
    studentLookupEntries: serializedLookup
  };

  const payloadString = JSON.stringify(serializablePayload);
  const checksum = computePayloadChecksum(payloadString);

  return JSON.stringify({
    schema: 'LUMORA_OFFLINE_SEATING_ARCHIVE',
    checksum,
    payload: serializablePayload
  });
}

/**
 * Deserializes an offline seating archive and validates schema, checksum, and 8-neighbor invariants
 * @param {string} rawArchiveJson - Serialized envelope string
 * @returns {object} Reconstituted plan object with reconstructed studentLookupMap
 */
export function deserializeExamPlan(rawArchiveJson) {
  let envelope;
  try {
    envelope = JSON.parse(rawArchiveJson);
  } catch (err) {
    throw new Error(`Deserialization Error: Malformed JSON (${err.message}).`);
  }

  if (!envelope || envelope.schema !== 'LUMORA_OFFLINE_SEATING_ARCHIVE') {
    throw new Error('Deserialization Error: Unrecognized or incompatible archive schema.');
  }

  // Prototype Pollution Defense: Block dangerous prototype poisoning keys across the entire JSON tree
  if (/"(?:__proto__|constructor|prototype)"\s*:/i.test(rawArchiveJson)) {
    throw new Error('Security Violation: Potential Prototype Pollution detected in offline archive!');
  }

  const payloadString = JSON.stringify(envelope.payload);
  const computedHash = computePayloadChecksum(payloadString);

  if (computedHash !== envelope.checksum) {
    throw new Error(`Data Integrity Error: Checksum mismatch (expected ${envelope.checksum}, computed ${computedHash}).`);
  }

  const payload = envelope.payload;
  const studentLookupMap = new Map();

  if (Array.isArray(payload.studentLookupEntries)) {
    for (const [key, value] of payload.studentLookupEntries) {
      studentLookupMap.set(key, value);
    }
  }

  const plan = {
    rooms: payload.rooms,
    totalAssigned: payload.totalAssigned,
    totalCapacity: payload.totalCapacity,
    utilizationRate: payload.utilizationRate,
    studentLookupMap
  };

  // Re-verify mathematical invariants on reconstituted data
  const conflicts = countTotalConflicts(plan.rooms);
  if (conflicts.totalConflicts !== 0) {
    throw new Error(`Integrity Violation: Reconstituted plan contains ${conflicts.totalConflicts} 8-neighbor conflicts!`);
  }

  const pwdAudit = verifyPWDPlacement(plan.rooms, 3);
  if (!pwdAudit.success) {
    throw new Error('Integrity Violation: Reconstituted plan violates Ground-Floor Row 0 PWD constraints!');
  }

  return {
    plan,
    auditSeed: payload.auditSeed,
    timestamp: payload.timestamp,
    checksum: envelope.checksum,
    conflicts: conflicts.totalConflicts,
    pwdCompliancePct: pwdAudit.compliancePct
  };
}

/**
 * Persists current session into browser storage (localStorage or in-memory mock)
 * @param {object} plan - Active solved seating plan
 * @param {object} invigilatorPlan - Active invigilator allocation
 * @param {string} auditSeed - Deterministic seed
 * @param {Storage} [storage=globalThis.localStorage] - Storage interface
 * @returns {boolean} True if successfully stored
 */
export function saveActiveSession(plan, invigilatorPlan, auditSeed = 'LUMORA-2026', storage = globalThis.localStorage) {
  if (!storage) return false;
  try {
    const serializedPlan = serializeExamPlan(plan, auditSeed);
    storage.setItem(STORAGE_KEYS.ACTIVE_PLAN, serializedPlan);
    storage.setItem(STORAGE_KEYS.AUDIT_SEED, auditSeed);
    storage.setItem(STORAGE_KEYS.OFFLINE_SNAPSHOT_TIMESTAMP, new Date().toISOString());

    if (invigilatorPlan) {
      storage.setItem(STORAGE_KEYS.ACTIVE_ROSTER, JSON.stringify(invigilatorPlan));
    }
    return true;
  } catch (err) {
    console.warn('Unable to persist session to storage:', err);
    return false;
  }
}

/**
 * Loads and restores active session from storage
 * @param {Storage} [storage=globalThis.localStorage] - Storage interface
 * @returns {object|null} Restored session or null if empty
 */
export function loadActiveSession(storage = globalThis.localStorage) {
  if (!storage) return null;
  try {
    const rawArchive = storage.getItem(STORAGE_KEYS.ACTIVE_PLAN);
    if (!rawArchive) return null;

    const deserialized = deserializeExamPlan(rawArchive);
    let invigilatorPlan = null;
    const rawRoster = storage.getItem(STORAGE_KEYS.ACTIVE_ROSTER);
    if (rawRoster) {
      invigilatorPlan = JSON.parse(rawRoster);
    }

    return {
      plan: deserialized.plan,
      auditSeed: deserialized.auditSeed,
      timestamp: deserialized.timestamp,
      checksum: deserialized.checksum,
      invigilatorPlan
    };
  } catch (err) {
    console.warn('Failed to load active session from storage:', err);
    return null;
  }
}

/**
 * Clears saved session from storage
 * @param {Storage} [storage=globalThis.localStorage] - Storage interface
 */
export function clearActiveSession(storage = globalThis.localStorage) {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEYS.ACTIVE_PLAN);
    storage.removeItem(STORAGE_KEYS.ACTIVE_ROSTER);
    storage.removeItem(STORAGE_KEYS.AUDIT_SEED);
    storage.removeItem(STORAGE_KEYS.OFFLINE_SNAPSHOT_TIMESTAMP);
  } catch (err) {
    console.warn('Failed to clear storage:', err);
  }
}
