/**
 * Lumora × Starfield Autonomous Exam-Management Platform
 * Module: Deterministic PRNG Pipeline (FNV-1a 32-bit Hash + mulberry32 PRNG)
 * Engineering Standard: FAANG Production Baseline
 */

/**
 * 32-bit FNV-1a String Hashing Algorithm
 * Converts an arbitrary public audit seed (e.g. "LUMORA-2026") into an unsigned 32-bit integer.
 * @param {string} str - Audit seed string
 * @returns {number} 32-bit unsigned integer
 */
export function fnv1a(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * mulberry32 Seeded Pseudo-Random Number Generator
 * Returns a high-entropy pseudo-random number in [0, 1) bit-for-bit reproducible from a 32-bit seed.
 * @param {number} seed - 32-bit integer state
 * @returns {function(): number} PRNG closure returning numbers in [0, 1)
 */
export function createMulberry32(seed) {
  let a = seed >>> 0;
  return function mulberry32Next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic Fisher-Yates Array Shuffle
 * Shuffles an array in O(N) using draws from the supplied seeded PRNG.
 * @template T
 * @param {T[]} array - Source array
 * @param {function(): number} prng - Seeded PRNG function
 * @returns {T[]} New shuffled array (non-mutating)
 */
export function seededShuffle(array, prng) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}
