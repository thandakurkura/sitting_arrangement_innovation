/**
 * Lumora × Starfield Autonomous Exam-Management Platform
 * Module: Production Output Generators & O(1) Student Lookup Portal (FR-OUT)
 * Engineering Standard: FAANG Production Baseline
 */

import { generateQRCodeSVG } from './qr.js';

/**
 * Escapes HTML control characters to prevent Cross-Site Scripting (XSS)
 * @param {string|number|boolean} str - Untrusted input string
 * @returns {string} Sanitized HTML-safe string
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Executes sub-millisecond O(1) student roll number lookup
 * Handles case-insensitivity and whitespace normalization.
 * @param {string} rawRoll - Raw student roll number input (e.g. " cs1001 ", "EC2002")
 * @param {Map<string, object>} lookupMap - In-memory Map<RollNumber, AllocationRecord>
 * @returns {object|null} Matched student allocation record or null
 */
export function lookupStudent(rawRoll, lookupMap) {
  if (!rawRoll || typeof rawRoll !== 'string' || !lookupMap) return null;
  const normalizedRoll = rawRoll.trim().toUpperCase();
  return lookupMap.get(normalizedRoll) || null;
}

/**
 * Constructs the canonical QR Code payload string for student hall ticket optical gates
 * @param {object} record - Student allocation record
 * @returns {string} Deterministic payload
 */
export function buildQRPayload(record) {
  const seedHex = '0x' + (record.seedHash >>> 0).toString(16).toUpperCase();
  return `LUMORA-EXAM|v1|${record.roll}|${record.subject}|${record.roomId}|${record.seatLabel}|${record.sessionTime || 'Morning'}|${seedHex}`;
}

/**
 * Generates formatted print-ready Room Door Sheet (FR-OUT-01)
 * Displayed outside examination halls for candidates to locate seats.
 * @param {object} room - Room allocation object
 * @param {object} plan - Overall seating plan
 * @returns {string} Formatted HTML document string
 */
export function generateDoorSheetHTML(room, plan) {
  const invigilatorsText = room.assignedInvigilators && room.assignedInvigilators.length > 0
    ? room.assignedInvigilators.map(i => `${escapeHTML(i.name)} (${escapeHTML(i.deptSubject)})`).join(', ')
    : 'Faculty Team Alpha';

  const rowsHtml = [];
  for (let r = 0; r < room.rows; r++) {
    const seatCells = [];
    for (let c = 0; c < room.cols; c++) {
      const s = room.grid[r][c];
      if (s.blocked) {
        seatCells.push(`
          <td style="border: 1px solid #ccc; padding: 8px; text-align: center; background: #f3f4f6; color: #9ca3af;">
            <b>${escapeHTML(s.seatLabel)}</b><br><span style="font-size: 10px;">BLOCKED</span>
          </td>
        `);
      } else if (s.student) {
        seatCells.push(`
          <td style="border: 1px solid #111; padding: 8px; text-align: center;">
            <b style="font-size: 13px;">${escapeHTML(s.seatLabel)}</b><br>
            <span style="font-size: 12px; font-weight: 700;">${escapeHTML(s.student.roll)}</span><br>
            <span style="font-size: 11px; color: #4b5563;">${escapeHTML(s.student.subject)}</span>
            ${s.student.isPWD ? '<br><span style="font-size: 9px; background: #e0f2fe; color: #0284c7; padding: 1px 4px; border-radius: 2px;">PWD</span>' : ''}
          </td>
        `);
      } else {
        seatCells.push(`
          <td style="border: 1px solid #ccc; padding: 8px; text-align: center; color: #9ca3af;">
            <b>${escapeHTML(s.seatLabel)}</b><br><span style="font-size: 10px;">EMPTY</span>
          </td>
        `);
      }
    }
    rowsHtml.push(`<tr><td style="border: 1px solid #111; padding: 6px; font-weight: bold; background: #f9fafb; text-align: center;">Row ${String.fromCharCode(65 + r)}</td>${seatCells.join('')}</tr>`);
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #111; border: 2px solid #111;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h1 style="font-size: 20px; font-weight: bold; margin: 0 0 4px;">EXAMINATION HALL DOOR SHEET</h1>
          <h2 style="font-size: 16px; color: #4b5563; margin: 0;">${escapeHTML(room.label)} (Floor ${escapeHTML(room.floor)})</h2>
        </div>
        <div style="text-align: right; font-size: 12px;">
          <div><b>Session:</b> ${escapeHTML(plan.sessionSlot || '09:30 AM - 12:30 PM')}</div>
          <div><b>Audit PRNG Seed:</b> ${escapeHTML(plan.auditSeed)}</div>
          <div><b>Hash:</b> 0x${plan.seedHash.toString(16).toUpperCase()}</div>
        </div>
      </div>

      <div style="margin-bottom: 16px; font-size: 13px; background: #f9fafb; padding: 8px 12px; border: 1px solid #e5e7eb;">
        <b>Assigned Invigilators:</b> ${invigilatorsText} &bull; <b>Total Seated:</b> ${escapeHTML(room.assignedCount)} Candidates
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #111; color: #fff; font-size: 11px;">
            <th style="padding: 6px; border: 1px solid #111;">ROW</th>
            <th colspan="${room.cols}" style="padding: 6px; border: 1px solid #111;">SEATS (BENCHES)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml.join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; margin-top: 32px; font-size: 12px; border-top: 1px solid #ccc; padding-top: 12px;">
        <span>Controller of Examinations &bull; Lumora Verification Engine</span>
        <span>Notice: Unauthorized seat swapping constitutes academic misconduct.</span>
      </div>
    </div>
  `.trim();
}

/**
 * Generates seat-sorted invigilator attendance sheets (FR-OUT-02)
 * Sorted strictly by Seat Number (A1, A2.. E6) with student signature & booklet blank columns.
 * @param {object} room - Room allocation object
 * @param {object} plan - Seating plan
 * @returns {string} Formatted HTML document string
 */
export function generateAttendanceSheetHTML(room, plan) {
  const seatsList = [];
  for (let r = 0; r < room.rows; r++) {
    for (let c = 0; c < room.cols; c++) {
      const s = room.grid[r][c];
      if (s.student) {
        seatsList.push({
          seatLabel: s.seatLabel,
          bench: s.benchIndex,
          student: s.student
        });
      }
    }
  }

  // Sort strictly by seat coordinate
  seatsList.sort((a, b) => a.seatLabel.localeCompare(b.seatLabel, undefined, { numeric: true }));

  const tableRows = seatsList.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 8px; text-align: center; font-weight: bold;">${idx + 1}</td>
      <td style="padding: 8px; text-align: center; font-weight: bold; background: #f9fafb;">${escapeHTML(item.seatLabel)}</td>
      <td style="padding: 8px; font-weight: bold;">${escapeHTML(item.student.roll)}</td>
      <td style="padding: 8px;">${escapeHTML(item.student.name)}</td>
      <td style="padding: 8px; text-align: center;"><code>${escapeHTML(item.student.subject)}</code></td>
      <td style="padding: 8px; text-align: center; color: #6b7280;">${escapeHTML(item.student.batch)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #9ca3af; min-width: 110px;"></td>
      <td style="padding: 8px; border-bottom: 1px solid #9ca3af; min-width: 140px;"></td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; color: #111; border: 2px solid #111;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h1 style="font-size: 20px; font-weight: bold; margin: 0 0 4px;">EXAMINATION ATTENDANCE &amp; SIGNATURE REGISTER</h1>
          <h2 style="font-size: 15px; color: #4b5563; margin: 0;">Hall: ${escapeHTML(room.label)} &bull; Floor: ${escapeHTML(room.floor)}</h2>
        </div>
        <div style="text-align: right; font-size: 12px;">
          <div><b>Session:</b> ${escapeHTML(plan.sessionSlot || '09:30 AM - 12:30 PM')}</div>
          <div><b>Audit Seed:</b> ${escapeHTML(plan.auditSeed)}</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px;">
        <thead>
          <tr style="background: #111; color: #fff;">
            <th style="padding: 8px; width: 40px;">S.NO</th>
            <th style="padding: 8px; width: 70px;">SEAT</th>
            <th style="padding: 8px; width: 100px;">ROLL NO</th>
            <th style="padding: 8px;">STUDENT NAME</th>
            <th style="padding: 8px; width: 80px;">SUBJECT</th>
            <th style="padding: 8px; width: 90px;">BATCH</th>
            <th style="padding: 8px; width: 120px;">ANSWER BOOKLET #</th>
            <th style="padding: 8px; width: 150px;">STUDENT SIGNATURE</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 40px; border-top: 1px solid #111; padding-top: 16px;">
        <div><b>Invigilator 1 Signature:</b> _______________________</div>
        <div><b>Invigilator 2 Signature:</b> _______________________</div>
        <div><b>Total Present:</b> ______ / ${seatsList.length}</div>
      </div>
    </div>
  `.trim();
}

/**
 * Renders individual student hall ticket with deterministic SVG QR Code (FR-OUT-03)
 * @param {object} record - Student allocation record
 * @returns {string} Formatted HTML document string
 */
export function generateHallTicketHTML(record) {
  const qrPayload = buildQRPayload(record);
  const qrSVG = generateQRCodeSVG(qrPayload, 170);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 2px solid #0a0a0a; border-radius: 12px; padding: 24px; color: #111; background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0a0a0a; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <span style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #b15f2c; font-weight: bold;">LUMORA AUTONOMOUS EXAM MANAGEMENT</span>
          <h1 style="font-size: 20px; font-weight: bold; margin: 2px 0 0;">STUDENT HALL TICKET &bull; ADMIT CARD</h1>
        </div>
        <div style="text-align: right; font-size: 11px; color: #6b7280;">
          <div><b>Session:</b> 2026-NOV</div>
          <div><b>Slot:</b> Morning</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 180px; gap: 20px; align-items: center;">
        <div style="font-size: 13px; line-height: 1.8;">
          <div><span style="color: #6b7280;">Roll Number:</span> <b style="font-size: 16px; color: #0a0a0a;">${escapeHTML(record.roll)}</b></div>
          <div><span style="color: #6b7280;">Candidate Name:</span> <b>${escapeHTML(record.name)}</b></div>
          <div><span style="color: #6b7280;">Subject Code:</span> <code style="background: #f1f0ee; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${escapeHTML(record.subject)}</code></div>
          <div><span style="color: #6b7280;">Graduating Batch:</span> <b>${escapeHTML(record.batch)}</b></div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e5e7eb;">
            <div><span style="color: #6b7280;">Examination Hall:</span> <b style="color: #0369a1; font-size: 14px;">${escapeHTML(record.roomId)} (${escapeHTML(record.roomLabel || 'Room ' + record.roomId)})</b></div>
            <div><span style="color: #6b7280;">Assigned Seat:</span> <b style="font-size: 18px; color: #b15f2c;">${escapeHTML(record.seatLabel)}</b> (Bench ${escapeHTML(record.benchIndex)})</div>
            <div><span style="color: #6b7280;">Floor Level:</span> <b>Floor ${escapeHTML(record.floor)} ${record.floor === 0 ? '(ADA Ground Floor)' : ''}</b></div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f9fafb; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
          ${qrSVG}
          <span style="font-size: 10px; color: #6b7280; margin-top: 6px; letter-spacing: 0.04em;">SCAN AT GATE ENTRY</span>
        </div>
      </div>

      <div style="margin-top: 16px; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; display: flex; justify-content: space-between;">
        <span>Audit PRNG Seed: <b>${escapeHTML(record.auditSeed)}</b></span>
        <span>Security Hash: <b>0x${(record.seedHash >>> 0).toString(16).toUpperCase()}</b></span>
      </div>
    </div>
  `.trim();
}
