/**
 * Lumora × Starfield Autonomous Exam-Management Platform
 * Module: Canonical Domain Topology, Multi-Scenario Datasets & Faculty Pool
 * Engineering Standard: FAANG Production Baseline
 */

/**
 * Standard University Examination Halls
 * Includes ground floor accessible halls, upper floor halls, and standby reserve capacity.
 */
export const DEFAULT_ROOMS = [
  {
    roomId: 'R101',
    label: 'Room 101 (Ground Floor - ADA Accessible)',
    floor: 0,
    rows: 5,
    cols: 6,
    benchSize: 2,
    blockedCoords: [[2, 2]], // Structural concrete pillar
    isClosed: false,
    isStandby: false
  },
  {
    roomId: 'R102',
    label: 'Room 102 (First Floor West)',
    floor: 1,
    rows: 5,
    cols: 6,
    benchSize: 2,
    blockedCoords: [[3, 4]], // Broken power outlet bench
    isClosed: false,
    isStandby: false
  },
  {
    roomId: 'R103',
    label: 'Room 103 (First Floor East)',
    floor: 1,
    rows: 5,
    cols: 6,
    benchSize: 2,
    blockedCoords: [[1, 3]], // Damaged desk
    isClosed: false,
    isStandby: false
  },
  {
    roomId: 'R204',
    label: 'Room 204 (Second Floor - Standby Reserve)',
    floor: 2,
    rows: 6,
    cols: 6,
    benchSize: 3,
    blockedCoords: [],
    isClosed: false,
    isStandby: true // Dark standby capacity
  }
];

/**
 * Standard university examination candidate manifest (55 candidates, 4 subjects, 3 PWD, 2 Backlog)
 * @returns {Array<object>} Candidate records conforming to StudentRecord schema
 */
export function generateDefaultCandidates() {
  const subjects = ['CS101', 'EC202', 'ME303', 'MA404'];
  const candidates = [];
  let rollCounter = 1001;

  candidates.push({ roll: 'CS' + rollCounter++, name: 'Aarav Sharma', subject: 'CS101', batch: '2026-REG', isPWD: true, isBacklog: false, enrolledPapers: ['CS101'] });
  candidates.push({ roll: 'EC' + rollCounter++, name: 'Diya Patel', subject: 'EC202', batch: '2026-REG', isPWD: true, isBacklog: false, enrolledPapers: ['EC202'] });
  candidates.push({ roll: 'ME' + rollCounter++, name: 'Rohan Verma', subject: 'ME303', batch: '2026-REG', isPWD: true, isBacklog: false, enrolledPapers: ['ME303'] });

  candidates.push({ roll: 'CS' + rollCounter++, name: 'Kavya Nair', subject: 'CS101', batch: '2024-REP', isPWD: false, isBacklog: true, enrolledPapers: ['CS101'] });
  candidates.push({ roll: 'EC' + rollCounter++, name: 'Aditya Rao', subject: 'EC202', batch: '2025-REP', isPWD: false, isBacklog: true, enrolledPapers: ['EC202'] });

  const studentNames = [
    'Ananya Gupta', 'Vihaan Reddy', 'Ishaan Joshi', 'Myra Kapoor', 'Kabir Malhotra',
    'Tara Iyer', 'Aryan Sen', 'Sara Mehra', 'Reyansh Saxena', 'Navya Chawla',
    'Devansh Bhatia', 'Tanvi Singhania', 'Atharv Kulkarni', 'Saanvi Deshmukh', 'Yash Trivedi',
    'Pari Bansal', 'Samarth Aggarwal', 'Avani Pillai', 'Dhruv Nambiar', 'Khushi Roy',
    'Aayush Bose', 'Meera Menon', 'Hrithik Hegde', 'Rhea Soni', 'Krishnan Shenoy',
    'Anika Varma', 'Manav Kaushik', 'Prisha Jain', 'Karan Thakur', 'Nisha Grover',
    'Siddharth Pandey', 'Isha Sundaram', 'Gaurav Dutta', 'Shreya Mukherjee', 'Rishi Anand',
    'Ahana Ghosh', 'Nikhil Barman', 'Anoushka Pillai', 'Raghav Mani', 'Lavanya Shenoy',
    'Harsh Vardhan', 'Pooja Bhatt', 'Tushar Sethi', 'Simran Kaur', 'Abhinav Tyagi',
    'Akanksha Das', 'Varun Mittal', 'Bhavna Chauhan', 'Chirag Parekh', 'Divya Suri'
  ];

  for (let i = 0; i < studentNames.length; i++) {
    const subj = subjects[i % subjects.length];
    candidates.push({
      roll: subj.slice(0, 2) + rollCounter++,
      name: studentNames[i],
      subject: subj,
      batch: '2026-REG',
      isPWD: false,
      isBacklog: false,
      enrolledPapers: [subj]
    });
  }
  return candidates;
}

/**
 * High-Density 6-Paper Challenge Dataset (85 candidates, 6 subjects, 4 PWD, 6 Backlog)
 * Tests multi-paper concurrent room mixing (CS101, EC202, ME303, MA404, CE505, IT606)
 * @returns {Array<object>} Candidate records
 */
export function generate6PaperHighDensityCandidates() {
  const subjects = ['CS101', 'EC202', 'ME303', 'MA404', 'CE505', 'IT606'];
  const candidates = [];
  let rollCounter = 2001;

  for (let i = 0; i < 4; i++) {
    const subj = subjects[i];
    candidates.push({
      roll: subj.slice(0, 2) + rollCounter++,
      name: `PWD Candidate ${i + 1}`,
      subject: subj,
      batch: '2026-REG',
      isPWD: true,
      isBacklog: false,
      enrolledPapers: [subj]
    });
  }

  for (let i = 0; i < 6; i++) {
    const subj = subjects[i % subjects.length];
    candidates.push({
      roll: subj.slice(0, 2) + rollCounter++,
      name: `Backlog Candidate ${i + 1}`,
      subject: subj,
      batch: `202${3 + (i % 3)}-REP`,
      isPWD: false,
      isBacklog: true,
      enrolledPapers: [subj]
    });
  }

  const names = [
    'Aarav', 'Diya', 'Rohan', 'Kavya', 'Aditya', 'Ananya', 'Vihaan', 'Ishaan', 'Myra', 'Kabir',
    'Tara', 'Aryan', 'Sara', 'Reyansh', 'Navya', 'Devansh', 'Tanvi', 'Atharv', 'Saanvi', 'Yash',
    'Pari', 'Samarth', 'Avani', 'Dhruv', 'Khushi', 'Aayush', 'Meera', 'Hrithik', 'Rhea', 'Krishnan',
    'Anika', 'Manav', 'Prisha', 'Karan', 'Nisha', 'Siddharth', 'Isha', 'Gaurav', 'Shreya', 'Rishi',
    'Ahana', 'Nikhil', 'Anoushka', 'Raghav', 'Lavanya', 'Harsh', 'Pooja', 'Tushar', 'Simran', 'Abhinav',
    'Akanksha', 'Varun', 'Bhavna', 'Chirag', 'Divya', 'Deepak', 'Sanya', 'Vikram', 'Neha', 'Alok',
    'Kriti', 'Sameer', 'Monika', 'Arjun', 'Payal', 'Sunil', 'Swati', 'Kunal', 'Rashmi', 'Vivek',
    'Poonam', 'Hemant', 'Geeta', 'Sanjay', 'Vandana'
  ];

  for (let i = 0; i < names.length; i++) {
    const subj = subjects[i % subjects.length];
    candidates.push({
      roll: subj.slice(0, 2) + rollCounter++,
      name: `${names[i]} ${String.fromCharCode(65 + (i % 26))}.`,
      subject: subj,
      batch: '2026-REG',
      isPWD: false,
      isBacklog: false,
      enrolledPapers: [subj]
    });
  }
  return candidates;
}

/**
 * Heavy Backlog Multi-Batch Dataset (60 candidates, heavy single-subject repeaters)
 * Tests constraint solving when many repeaters take the same exam paper across batches.
 * @returns {Array<object>} Candidate records
 */
export function generateHeavyBacklogCandidates() {
  const candidates = [];
  let rollCounter = 3001;

  candidates.push({ roll: 'CS' + rollCounter++, name: 'Aarav PWD', subject: 'CS101', batch: '2026-REG', isPWD: true, isBacklog: false, enrolledPapers: ['CS101'] });
  candidates.push({ roll: 'EC' + rollCounter++, name: 'Diya PWD', subject: 'EC202', batch: '2026-REG', isPWD: true, isBacklog: false, enrolledPapers: ['EC202'] });
  candidates.push({ roll: 'MA' + rollCounter++, name: 'Rohan PWD', subject: 'MA404', batch: '2026-REG', isPWD: true, isBacklog: false, enrolledPapers: ['MA404'] });

  const batches = ['2022-REP', '2023-REP', '2024-REP', '2025-REP'];
  for (let i = 0; i < 16; i++) {
    candidates.push({
      roll: 'CS' + rollCounter++,
      name: `CS Repeat Student ${i + 1}`,
      subject: 'CS101',
      batch: batches[i % batches.length],
      isPWD: false,
      isBacklog: true,
      enrolledPapers: ['CS101']
    });
  }

  const altSubjects = ['EC202', 'ME303', 'MA404'];
  for (let i = 0; i < 41; i++) {
    const subj = altSubjects[i % altSubjects.length];
    candidates.push({
      roll: subj.slice(0, 2) + rollCounter++,
      name: `Regular Candidate ${i + 1}`,
      subject: subj,
      batch: '2026-REG',
      isPWD: false,
      isBacklog: false,
      enrolledPapers: [subj]
    });
  }
  return candidates;
}

/**
 * Canonical Faculty Pool for Invigilator Duty Scheduling (FR-INV)
 * Balanced baseline duty counts ensuring equal workload distribution across departments.
 * @returns {Array<object>} Faculty records conforming to FacultyMember schema
 */
export function generateDefaultFacultyPool() {
  return [
    { facultyId: 'FAC01', name: 'Prof. Rajesh Sharma', deptSubject: 'CS101', cumulativeDuties: 3, heavyDaysStreak: 0, status: 'Active' },
    { facultyId: 'FAC02', name: 'Dr. Sneha Iyer', deptSubject: 'ME303', cumulativeDuties: 3, heavyDaysStreak: 0, status: 'Active' },
    { facultyId: 'FAC03', name: 'Prof. Vikram Nair', deptSubject: 'EC202', cumulativeDuties: 3, heavyDaysStreak: 0, status: 'Active' },
    { facultyId: 'FAC04', name: 'Dr. Anjali Deshmukh', deptSubject: 'MA404', cumulativeDuties: 3, heavyDaysStreak: 0, status: 'Active' },
    { facultyId: 'FAC05', name: 'Prof. Amitav Ghosh', deptSubject: 'CE505', cumulativeDuties: 2, heavyDaysStreak: 0, status: 'Active' },
    { facultyId: 'FAC06', name: 'Dr. Preeti Menon', deptSubject: 'IT606', cumulativeDuties: 2, heavyDaysStreak: 0, status: 'Active' },
    { facultyId: 'FAC07', name: 'Prof. Sunita Rao', deptSubject: 'PH101', cumulativeDuties: 2, heavyDaysStreak: 0, status: 'Active' },
    { facultyId: 'FAC08', name: 'Dr. Manoj Kulkarni', deptSubject: 'CH102', cumulativeDuties: 3, heavyDaysStreak: 0, status: 'Active' },
    { facultyId: 'FAC09', name: 'Prof. Arvind Trivedi', deptSubject: 'HU101', cumulativeDuties: 2, heavyDaysStreak: 0, status: 'Active' },
    { facultyId: 'FAC10', name: 'Dr. Meenakshi Sundaram', deptSubject: 'CS101', cumulativeDuties: 3, heavyDaysStreak: 0, status: 'Active' },
    { facultyId: 'FAC11', name: 'Prof. Kiran Bhatia', deptSubject: 'EC202', cumulativeDuties: 2, heavyDaysStreak: 0, status: 'On Leave' },
    { facultyId: 'FAC12', name: 'Dr. Suresh Verma', deptSubject: 'ME303', cumulativeDuties: 2, heavyDaysStreak: 0, status: 'Active' }
  ];
}

/**
 * Schema-Free Messy CSV/TSV Parser (FR-AI-01 / FR-EDGE)
 * Normalizes raw spreadsheet data with inconsistent headers (e.g. "Reg_No", "Univ_ID", "Sub_Code", "Handicapped")
 * @param {string} csvText - Raw CSV content
 * @returns {Array<object>} Normalized candidate records
 */
/**
 * Sanitizes input field values to prevent CSV Formula Injection
 * @param {string} val - Raw cell value
 * @returns {string} Neutralized cell value
 */
export function sanitizeCSVField(val) {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return "'" + trimmed;
  }
  return trimmed;
}

export function parseMessyCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];
  const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const delimiter = headerLine.includes('\t') ? '\t' : (headerLine.includes(';') ? ';' : ',');
  const rawHeaders = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

  function resolveField(index) {
    const h = rawHeaders[index];
    if (['name', 'studentname', 'fullname', 'candidatename', 'student', 'candidate'].some(tok => h.includes(tok))) return 'name';
    if (['roll', 'regno', 'registration', 'enrol', 'enrolment', 'matric'].some(tok => h.includes(tok)) || h === 'id' || h.endsWith('id') || h === 'uid') return 'roll';
    if (['subj', 'paper', 'course', 'subcode', 'subjectcode', 'module'].some(tok => h.includes(tok))) return 'subject';
    if (['batch', 'cohort', 'year', 'gradyear'].some(tok => h.includes(tok))) return 'batch';
    if (['pwd', 'disab', 'differ', 'handicap', 'accessible', 'ground', 'special', 'ada', 'differentlyabled'].some(tok => h.includes(tok))) return 'isPWD';
    if (['backlog', 'repeat', 'arrear', 'supp', 'reappear', 'arrearstatus'].some(tok => h.includes(tok))) return 'isBacklog';
    return null;
  }

  const fieldMap = {};
  for (let i = 0; i < rawHeaders.length; i++) {
    const field = resolveField(i);
    if (field && fieldMap[field] === undefined) {
      fieldMap[field] = i;
    }
  }

  const candidates = [];
  let generatedCounter = 4001;

  for (let r = 1; r < lines.length; r++) {
    const cols = lines[r].split(delimiter).map(c => sanitizeCSVField(c.trim().replace(/^["']|["']$/g, '')));
    if (cols.length < 2) continue;

    const roll = (fieldMap.roll !== undefined && cols[fieldMap.roll])
      ? cols[fieldMap.roll].toUpperCase()
      : `GEN${generatedCounter++}`;

    const name = (fieldMap.name !== undefined && cols[fieldMap.name])
      ? cols[fieldMap.name]
      : `Candidate ${roll}`;

    const subject = (fieldMap.subject !== undefined && cols[fieldMap.subject])
      ? cols[fieldMap.subject].toUpperCase()
      : 'CS101';

    const batch = (fieldMap.batch !== undefined && cols[fieldMap.batch])
      ? cols[fieldMap.batch].toUpperCase()
      : '2026-REG';

    let isPWD = false;
    if (fieldMap.isPWD !== undefined && cols[fieldMap.isPWD]) {
      const val = cols[fieldMap.isPWD].toLowerCase();
      isPWD = ['true', 'yes', 'y', '1', 'pwd', 'special', 'disabled'].includes(val);
    }

    let isBacklog = false;
    if (fieldMap.isBacklog !== undefined && cols[fieldMap.isBacklog]) {
      const val = cols[fieldMap.isBacklog].toLowerCase();
      isBacklog = ['true', 'yes', 'y', '1', 'repeat', 'backlog'].includes(val);
    }

    candidates.push({
      roll,
      name,
      subject,
      batch,
      isPWD,
      isBacklog,
      enrolledPapers: [subject]
    });
  }

  return candidates;
}
