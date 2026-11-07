Product Requirements Document (PRD): Lumora × Starfield Autonomous Exam-Management System
1. Document Control & Executive Summary
Metadata Field
Specification
Product Name
Lumora × Starfield Autonomous Exam-Management & Seating Platform
Document Status
Approved Production Baseline (FAANG Architecture Bar)
Release Date
November 7, 2026
Target Architecture
Zero-Build ES Module Single-File Web Application (HTML5 + CSS3 Adaptive Rem Grid + Lenis Smooth Scroll + Three.js r0.143.0 WebGL1 + Deterministic Constraint Solver)
Core Objective
Expand a basic seating generator into an end-to-end, AI-assisted university examination management platform with zero-conflict 8-neighbor graph coloring, automated invigilator fairness scheduling, real-time partial delta reallocation, and production-grade student/faculty outputs.

1.1 Problem Statement
University examination cells routinely manage thousands of candidates across multiple departments, subjects, backlog batches, and irregular room layouts using brittle spreadsheets. Manual or naive seating allocations suffer from four systemic failures:

Academic Integrity Leaks: Students writing the same subject or belonging to the same batch sit adjacent or diagonally across from one another, enabling lateral and diagonal copying.
Operational & Resource Waste: Rooms and invigilators are over-allocated without bin-packing optimization, wasting campus electricity, HVAC power, and faculty hours.
Fragile Last-Minute Disruptions: When an exam hall goes under maintenance or an invigilator calls in sick 30 minutes before a session, regenerating the entire seating plan invalidates printed door sheets and creates chaos across unaffected rooms.
Faculty Burnout & Audit Disputes: Invigilators face unequal duty loads, accidental assignment to rooms running their own subject paper, or back-to-back heavy days, while students and auditors lack cryptographic or deterministic proof that seat assignments were unbiased.
1.2 Product Vision & Viva Justification
The Lumora × Starfield Autonomous Exam-Management System solves these challenges from the algorithm up:

Zero-Conflict 8-Neighbor Graph Coloring: Treats every seat as a vertex in an 8-connected planar graph (Left, Right, Front, Back, and all 4 Diagonals) and solves seat assignment via a three-stage pipeline (Greedy Degree Ordering → Seeded Randomization → Recursive Backtracking Fallback).
Resource & Cost Minimization: Packs candidates into the minimum number of active rooms and invigilators required while keeping 0 conflicts—directly saving electricity, staff time, and institutional budget.
Deterministic Auditability: Drives all randomization through a seeded pseudo-random number generator (mulberry32) so plans are unpredictable beforehand yet 100% reproducible during post-exam viva or audit disputes.
Flagship Creative Studio Experience: Wraps the entire algorithmic engine inside the Lumora — Independent Design & Engineering Studio interface (Onest typography, adaptive rem grid, 000 → 100 intro loader, LiquidReveal dual-image hero canvas) and powers the dark command workspace with the Three.js Starfield Close (r0.143.0) 4,200-star WebGL post-processing tunnel.
2. Target User Personas & Core Workflows
Persona
Primary Responsibilities
Key System Touchpoints
Success Metric
Controller of Examinations (Admin)
Oversees multi-day datesheets, room utilization, high-density risk thresholds (>95% capacity), and audit compliance.
AI Risk Summarizer, Audit PRNG Seed Controller, Multi-Campus Analytics Dashboard.
0 seating conflicts; 15–25% reduction in active rooms/HVAC power used.
Departmental Exam Coordinator
Uploads raw candidate manifests from different departments, configures room topologies, and handles last-minute room closures.
Messy Excel/CSV Parser, Visual Room Grid Editor, AI Plain-Language Reallocation Console.
< 2 seconds to reallocate a closed room with 0 changes to unaffected rooms.
Faculty Invigilator
Supervises assigned exam halls, verifies student attendance, and requests leave/swaps when unwell.
Smart Invigilator Roster, Email Duty Letters, Seat-Sorted Attendance Sheets.
Fairness Score ≥ 95%; 0 assignments to own-subject exam halls.
Exam Candidate (Student)
Locates assigned exam hall, bench, and seat number; presents verifiable Hall Ticket at entry.
O(1) Roll-Number Lookup Portal, AI Student Q&A Bot, QR-Coded Hall Ticket PDF.
< 100ms roll lookup; 100% Ground-Floor Row-1 placement for PWD students.

3. Core Functional Requirements (Backend & Algorithmic Engine)
3.1 Module 1: The Core Seating Algorithm (FR-ALG)
Requirement ID
Feature Name
Detailed Functional & Algorithmic Specification
Priority
FR-ALG-01
Graph-Coloring Constraint Model
Represent each physical seat (row r, col c) within a room as a node V(r, c) in an undirected conflict graph G = (V, E). Two nodes share an edge e ∈ E if they are physically adjacent. A valid coloring assigns each node a candidate S_i such that for every connected pair (u, v) ∈ E, Subject(u) ≠ Subject(v) and Batch(u) ≠ Batch(v) (when distinct subjects/batches are available).
 P0 (Blocker)
FR-ALG-02
8-Directional Adjacency Rules
Enforce strict 8-neighbor checking around every seat (r, c): Left (r, c-1), Right (r, c+1), Front (r-1, c), Back (r+1, c), Front-Left Diagonal (r-1, c-1), Front-Right Diagonal (r-1, c+1), Back-Left Diagonal (r+1, c-1), and Back-Right Diagonal (r+1, c+1). Cheating is not limited to the same bench; diagonal sightlines must be blocked.
 P0 (Blocker)
FR-ALG-03
3-Stage Solver (Greedy → Randomized → Backtracking)
1. Stage 1 (Greedy + Randomization): Shuffle candidate queues using the seeded PRNG and interleave subjects by descending remaining headcount.2. Stage 2 (Forward Checking): Place the first candidate from the active queue whose subject/batch produces 0 conflicts across all 8 neighbors.3. Stage 3 (Backtracking Fallback): If a seat (r, c) cannot be filled by any remaining candidate without a conflict, recursively inspect previously placed non-PWD seats (sr, sc) where Subject(sr, sc) ≠ Subject(candidate), perform a valid 2-way swap that preserves 0 conflicts at both coordinates, and continue allocation.
 P0 (Blocker)
FR-ALG-04
Room & Invigilator Minimization (Bin-Packing)
Sort available examination halls by operational efficiency and pack candidates into the minimum number of active rooms required to maintain 0 conflicts. Keep excess rooms (e.g., Standby Room 204) completely unallocated ("dark mode") to save electricity, lighting, HVAC, and invigilator headcount.
 P0 (Blocker)
FR-ALG-05
Deterministic Seeded PRNG (Fairness & Viva Audit)
Implement a deterministic 32-bit PRNG (mulberry32 seeded via FNV-1a string hashing of a public Audit Seed such as "LUMORA-2026"). The seating plan must be unpredictable before the seed is announced, but entering the exact seed into the system at any point in the future must reproduce the exact seat-by-seat allocation bit-for-bit.
 P0 (Blocker)

3.2 Module 2: Messy Real-World Edge Cases (FR-EDGE)
Requirement ID
Feature Name
Detailed Functional Specification
Priority
FR-EDGE-01
PWD & Accessibility Priority Pass
Execute a mandatory pre-allocation pass before general graph coloring: filter all candidates with isPWD === true and allocate them strictly to Ground-Floor rooms (floor === 0) and Front-Row seats (row === 0), while still maintaining 8-neighbor subject separation among PWD and adjacent seats.
 P0 (Blocker)
FR-EDGE-02
Backlog & Repeat Student Interleaving
Support candidates carrying backlog or repeat papers (isBacklog === true) sitting across different graduating batches (e.g., a 2023-Repeat student taking a first-year CS101 paper alongside 2026-Reg students). Constraint checks must key off the active examination paper (subjectCode) so backlog students never sit adjacent to regular students writing the same paper.
 P0 (Blocker)
FR-EDGE-03
Multi-Paper Concurrent Room Mixing
Allow 2 to 6 distinct subject papers (e.g., CS101, EC202, ME303, MA404) to run concurrently inside the same examination hall to maximize chromatic diversity and guarantee zero same-subject neighbors even at 100% seat density.
 P0 (Blocker)
FR-EDGE-04
Irregular Room Topologies & Broken Seats
Support customizable room matrices with benches of 2 or 3 seats, aisle gaps, and arbitrary coordinates marked blocked: true (representing missing rows, structural pillars, or broken desks). The solver must skip blocked coordinates while still computing 8-neighbor geometry accurately across physical grid coordinates.
 P0 (Blocker)
FR-EDGE-05
Partial Delta Reallocation (Live Disruption Handling)
When a last-minute disruption occurs (e.g., a room is closed for maintenance or an invigilator falls sick), trigger a Partial Delta Reallocation: isolate only the displaced students or faculty and reallocate them into designated Standby Reserve capacity (Room 204) without mutating a single seat in unaffected active rooms (Room 101, Room 103).
 P0 (Blocker)

3.3 Module 3: Smart Invigilator Roster & Fairness Engine (FR-INV)
Requirement ID
Feature Name
Detailed Functional Specification
Priority
FR-INV-01
Equalized Duty Distribution
Sort and assign faculty members across the examination period by ascending cumulative duty count (duties), ensuring equal workload distribution across all departments.
 P0 (Blocker)
FR-INV-02
Multi-Constraint Conflict Rules
Enforce three hard scheduling constraints:1. Zero Subject Clash: A faculty member must never be assigned to invigilate a room where their own subject paper (faculty.dept === student.subject) is being conducted.2. No Back-to-Back Heavy Days: Prevent consecutive multi-session heavy duty days for the same invigilator.3. Leave & Teaching Schedule Respect: Automatically exclude faculty marked On Leave / Sick Leave or those with active teaching clashes.
 P0 (Blocker)
FR-INV-03
Dynamic Student-to-Invigilator Ratio Rule
Calculate required invigilators per active room using the configurable ratio formula RequiredInvigilators = ⌈AllocatedStudents ÷ 30⌉ (default: 1 invigilator per 30 students, minimum 1 per active room).
 P1 (High)
FR-INV-04
Reserve Pool & Flying Squad Automation
Automatically designate a configurable percentage of eligible, unassigned faculty to Reserve Standby (for instant 1-click substitution when an active invigilator calls in sick) and Flying Squad (roving anti-cheating inspection teams).
 P1 (High)
FR-INV-05
Single-Number Fairness Score
Compute and display a real-time Fairness Score (0–100%) derived from the standard deviation σ of duty counts across all active faculty: FairnessScore = max(0, min(100, 100 - (σ × 15))). A score above 95% indicates near-uniform duty distribution.
 P0 (Blocker)

3.4 Module 4: Production Outputs & Student Lookup (FR-OUT)
Requirement ID
Feature Name
Detailed Functional Specification
Priority
FR-OUT-01
Room Seating Charts & Door Sheets (PDF/Print)
Generate formatted, print-ready Room Door Sheets displaying the Room ID, Floor, Session Time, Audit Seed, Assigned Invigilator, and a visual matrix/manifest of Seat Coordinate → Roll Number & Paper Code for posting outside examination halls.
 P0 (Blocker)
FR-OUT-02
Seat-Sorted Attendance Sheets
Generate invigilator table sheets sorted strictly by Seat Number (A1, A2, ... D6) containing Student Roll Number, Name/Batch, Subject Paper Code, Booklet Serial Number blank column, and Student Signature blank column.
 P0 (Blocker)
FR-OUT-03
QR-Coded Student Hall Tickets
Render individual Student Hall Tickets containing Roll Number, Subject Code, Room ID, Row/Bench/Seat Coordinate, Session Timing, and a deterministic SVG QR Code encoding RollNo|RoomID|SeatLabel|AuditSeed for rapid gate scanning.
 P0 (Blocker)
FR-OUT-04
Automated Faculty Duty Letters
Generate individualized Faculty Duty Letters (with email dispatch payload) listing assigned dates, session timings, room numbers, reserve/flying squad status, and reporting instructions.
 P1 (High)
FR-OUT-05
O(1) Student Roll-Number Lookup Portal
Maintain an in-memory hash index (Map<RollNumber, AllocationRecord>) enabling students to enter their Roll Number (case-insensitive, whitespace-trimmed) and immediately view their Room, Seat, Bench, Time, QR Hall Ticket, and highlighted position on the interactive room grid.
 P0 (Blocker)

3.5 Module 5: AI Layer & Natural-Language Operations (FR-AI)
Requirement ID
Feature Name
Detailed Functional Specification
Priority
FR-AI-01
Schema-Free Messy Excel/CSV Ingestion
Automatically detect and normalize inconsistent column headers from different departmental spreadsheets (e.g., mapping "Reg_No", "Roll#", "Univ_ID" → roll; "Sub_Code", "Paper" → subject; "Handicapped", "Differently_Abled" → isPWD) without requiring strict template formatting.
 P0 (Blocker)
FR-AI-02
Plain-Language Live Reallocation Commands
Parse natural-language operational commands from exam administrators (e.g., "Room 102 is closed, move those students", "Prof. Nair is sick, swap invigilator", "Parse 4 messy backlog repeaters") and execute the corresponding partial delta solver action immediately.
 P0 (Blocker)
FR-AI-03
Conversational Student Q&A Assistant
Answer natural-language student queries such as "Where is my exam tomorrow for CS2604?" or "Which seat is EC2602 in?" by extracting the roll/subject entity, querying the O(1) lookup map, and highlighting the seat in the UI.
 P1 (High)
FR-AI-04
Controller of Exams Risk Summarizer
Continuously audit the active allocation and generate an executive plain-English risk summary flagging rooms above 95% capacity, verifying 100% PWD front-row compliance, reporting power/room savings, and warning if standby capacity drops below threshold.
 P0 (Blocker)

3.6 Module 6: Enterprise Scale-Up (FR-SCALE)
Requirement ID
Feature Name
Detailed Functional Specification
Priority
FR-SCALE-01
Clash-Free Multi-Day Datesheet Scheduler
Construct a multi-day examination timetable graph where two papers share an edge if any student (including backlog/repeat candidates) is enrolled in both, ensuring zero student exam clashes across time slots.
 P1 (High)
FR-SCALE-02
Multi-Block & Multi-Campus Hierarchy
Support hierarchical venue definitions (Campus → Academic Block → Floor → Room → Bench → Seat) so PWD constraints and flying-squad routes respect physical building boundaries.
 P1 (High)
FR-SCALE-03
Cross-Semester Longitudinal Analytics
Track and visualize historical KPIs across semesters: Room Utilization %, Energy/Rooms Saved, Zero-Conflict Verification Rate, and Faculty Duty Fairness trends.
 P2 (Medium)

4. Frontend Design & 3D WebGL Architecture Specifications
4.1 Lumora — Independent Design & Engineering Studio UI Shell (UI-LUMORA)
The application frontend must adhere strictly to the Lumora Studio design system:

Design System Component
Exact Technical Specification
Adaptive rem Grid System
Root FONT_BASE = 16px. Viewport media queries: ≤1920px → 0.833333vw, ≤1440px → 1.111111vw, ≤1024px → 1.5625vw, ≤640px → 4.444444vw. Above 1920px, runtime JS applyAdaptiveGrid() scales html.style.fontSize with damping coefficient coef = 0.6666.
Color Tokens & Typography
Font: Google Onest (400, 500, 600, 700). Palette: --background: #ffffff, --foreground: #111111, --ink: #0a0a0a, --muted: #8d8d8d, --subtle: #b6b6b6, --line: #e6e5e2, --surface: #f1f0ee, --surface-2: #e3e2df, --accent: #b15f2c, --accent-from: #cf8047, --accent-to: #97501f, --hero-to: #c9c9c9.
Intro PageLoader (000 → 100)
Fixed #0a0a0a full-screen panel (z-index: 120, bottom border-radius 2rem). Locks Lenis scroll (stopScroll()), animates progress 0 → 100 over FILL_MS = 1300ms using easeInOutCubic with a 3-digit zero-padded tabular counter (000 to 100), slides up translateY(-100%), sets introReady = true, and unlocks scroll (startScroll()).
Hero LiquidReveal Canvas
Full-bleed before/after cursor trail effect. Base visible <img> (beforeSrc) loads .../hero/after.jpg; cursor trail <canvas> (afterSrc) paints .../hero/before.jpg with brushRadius = 143 CSS px, decay = 0.016 per frame, dpr = min(devicePixelRatio, 2), radial gradient stops 1 / 0.82 / 0 at 0 / 0.55 / 1, and hard clear after 120 idle frames.
DOM Section Order & Overlays
PageLoader → Header (with 1s live local clock H:MMam/pm • D Month, YYYY) → main { Hero (LUMORA watermark, 3-item HeroCard carousel, 7-partner grid) → About (35ms staggered word reveal) → CreateBand (We / Build / → / Better) → Portfolio (4 dark cards) → Autonomous Exam-Management Studio → Services (4 hover-fill rows) → Stats (scroll-driven count-up 150+, 98%, 12, 40+) } → Footer → NavMenu (overlay) → RequestModal (overlay).

4.2 Three.js Starfield Close (r0.143.0) WebGL Pipeline (UI-STARFIELD)
The dark studio sections (#exam-engine, #careers stats panel, #site-footer) are backed by the exact Three.js Starfield Close (r0.143.0) scene:

WebGL Parameter / Shader Stage
Exact Technical Specification
Renderer, Camera & Fog
THREE.WebGL1Renderer({ canvas, antialias: true }) (with automatic WebGLRenderer fallback), VSMShadowMap, THREE.Fog(0x000000, 0, 15), PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 80) at (0, 0, 5). Layers: NONE: 0, TORUS_SCENE: 1, BLOOM_SCENE: 2, ENTIRE_SCENE: 3.
Star Cloud Geometry
THREE.Points with count = 4200, depth = 30. Bounding box: x ∈ [-12, 12], y ∈ [-8, 8], z ∈ [-15, 15]. Attributes: position (3), aScale (1), aPhase (1), aPalette (1), aBright (1).
Star Vertex & Fragment Shaders
Endless +Z drift with mod(pos.z + uDrift + (uDepth * 0.5), uDepth) - (uDepth * 0.5). Per-star twinkle sin(uTime * 1.6 + aPhase * 6.2831). World-space cursor repulsion with uRepelRadius = 5.0, uRepelStrength = 0.35. Star tints: uColorA = #aef6cf (mint), uColorB = #5fe6a0 (jade), uColorC = #eafff2 (bone), uBrightness = 1.85, uSize = 50.
3-Composer Post-Processing & FinalPass
1. torusComposer: RenderPass → GammaCorrectionShader → UnrealBloomPass(0.22, 0.2, 0) → CopyShader.2. bloomComposer: RenderPass → UnrealBloomPass(0.4, 0.55, 0) → GammaCorrectionShader.3. finalComposer: RenderPass → FinalPass combining uBg = #0a0a24 and warp3d procedural corner flames (uFlameA = #aee9ff, uFlameB = #c79bff, uFlameAmt = 0.2).
Scroll & Pointer Dynamics
Double-damped scroll (scrollSmooth lerp 0.10, scrollCurrent lerp 0.06) drives forward camera dive (z = 5 - scroll * 8), drift surge (2.35 + scroll * 6), and barrel roll (0.03 + scroll * 0.1).

5. Phased Build Order & Mandatory FAANG QA Verification Gates
Phase
Build Scope (Frontend + Backend Integration)
Mandatory Bug-Testing & QA Gate Criteria
Phase 1
Upload, Parse & Single-Paper Seeded Plan + Lumora/Starfield ShellBuild PageLoader, LiquidReveal, Starfield Close, deterministic mulberry32 PRNG, and basic candidate parser + room bin-packing.
• Assert identical seat maps across 100 runs with seed "LUMORA-2026".• Verify 60fps rendering on both 2D LiquidReveal and 3D EffectComposer pipelines with 0 console/WebGL errors.
Phase 2
8-Neighbor Adjacency Rules, Messy Edge Cases & Visual GridImplement 8-directional conflict checks, PWD Ground-Floor Row-1 priority pass, irregular/missing seats, and the interactive hover-ray seat grid.
• Automated audit countTotalConflicts(allocatedRooms) === 0 (L/R/F/B + 4 Diagonals).• Assert 100% of isPWD candidates reside at roomId === 'R101' and row === 0.
Phase 3
Smart Invigilator Roster & Fairness EngineBuild faculty matcher enforcing 1:30 ratio, 0 same-subject room clashes, sick-leave exclusions, Reserve/Flying Squad pools, and Fairness Score.
• Assert invigilator.dept ∉ room.activeSubjects across all active rooms.• Verify Fairness Score recalculates accurately when a faculty member is marked sick.
Phase 4
PDF/Print Outputs, QR Hall Tickets & Student Roll LookupBuild O(1) roll lookup index, procedural SVG QR code generator, and Door Sheet / Attendance Sheet export modal.
• Test lookup with valid (CS2601), lowercase (ec2602), and invalid (XX9999) roll numbers.• Verify clicking any seat or search result updates the SVG QR Hall Ticket immediately.
Phase 5
AI Layer & Live Partial Delta ReallocationWire plain-language command parser, partial room-closure delta reallocation, messy backlog ingestion, and Controller >95% capacity risk summarizer.
• Close Room 102 and assert 100% of seats in Room 101 and Room 103 remain unchanged while displaced candidates move to Room 204 with 0 conflicts.


