System & UI/UX Design Document (SDD): Lumora × Starfield Autonomous Exam-Management System
1. Document Control & Architectural Overview
Metadata Field
Technical Specification
Document Title
System & UI/UX Design Document (SDD): Lumora × Starfield Autonomous Exam-Management System
Engineering Standard
FAANG Principal Systems & Creative Graphics Architecture Bar
Date
November 7, 2026
Runtime Target
Zero-Build ES Module Single-File Web Application + Scalable REST/GraphQL Backend Architecture
Core Subsystems
1. Lumora Adaptive UI Shell (Onest font, viewport-scaled rem grid, Lenis smooth scroll, LiquidReveal 2D canvas)2. Three.js Starfield Close (r0.143.0) WebGL1 Engine (4,200-particle tunnel, 3-composer UnrealBloomPass + FinalPass warp3d shader pipeline)3. Deterministic 8-Neighbor Graph-Coloring Solver (mulberry32 seeded PRNG, PWD priority pre-pass, greedy + recursive backtracking)4. Smart Invigilator Roster & Fairness Engine (1:30 ratio, 0 subject clash, Reserve/Flying Squad pool, standard-deviation Fairness Score)5. AI Operational Layer & Partial Delta Reallocator (Schema-free messy Excel parser, NL disruption parser, O(1) QR student lookup)

1.1 High-Level System Topology
The system is designed around a Layered Reactive Architecture where deterministic algorithmic state drives both DOM views and GPU-accelerated canvas surfaces at 60 FPS:

Architectural Layer
Responsibility
Key Modules & Primitives
L1: Presentation & Motion Layer (Lumora Shell)
Renders the adaptive rem layout, locks/unlocks scroll during overlays, and drives spring-based micro-interactions and text reveals.
AdaptiveGrid, LenisScrollController, PageLoader (000→100), LiquidRevealCanvas, SpringStepper, LineWordRevealObserver, NavMenu, RequestModal
L2: 3D WebGL Atmosphere Layer (Starfield Close)
Renders the continuous 4,200-star tunnel behind dark studio sections, reacting to scroll depth and world-space pointer repulsion.
THREE.WebGL1Renderer, BufferGeometry (4200 pts), StarShaderMaterial, torusComposer, bloomComposer, finalComposer (FinalPass warp3d)
L3: Application Controller & AI Intent Layer
Parses messy departmental spreadsheets, interprets plain-language disruption commands, and coordinates partial delta updates.
MessySheetNormalizer, NLCommandParser, DeltaReallocationOrchestrator, ControllerRiskSummarizer, DocumentExportGenerator
L4: Deterministic Constraint Solver Layer
Executes seeded PRNG shuffling, 8-neighbor graph coloring, PWD front-row priority placement, room bin-packing, and faculty matching.
FNV1aHash, mulberry32PRNG, AdjacencyGraph8D, PWDPriorityAllocator, GreedyBacktrackingColorer, InvigilatorFairnessMatcher
L5: Data Store & O(1) Lookup Index Layer
Maintains canonical entities (Students, Rooms, Benches, Papers, Faculty, Sessions) and provides O(1) hash lookup by Roll Number.
StudentLookupMap (Map<RollNo, SeatRecord>), RoomMatrixStore, FacultyRosterStore, AuditTrailLedger

2. Data Architecture, Entity Schemas & Database Design
2.1 Core Domain Schemas
All in-memory state and persistent backend records strictly conform to the following canonical schemas:

Entity Name
Primary Key
Fields & Data Types
Domain Constraints & Invariants
CampusBlock
blockId: string
campusId: string, blockName: string, totalFloors: number
Groups rooms by physical building for Flying Squad routing and multi-campus datesheets.
ExamRoom
roomId: string
blockId: string, label: string, floor: number, rows: number, cols: number, benchSize: 2 | 3, blockedCoords: Array<[number, number]>, isClosed: boolean, isStandby: boolean
floor === 0 identifies ground-floor accessible rooms required for PWD candidates. blockedCoords marks broken desks or missing rows.
SeatNode
seatId: string (roomId:r:c)
roomId: string, r: number, c: number, seatLabel: string (A1..Z9), benchIndex: number, blocked: boolean, student: StudentRecord | null
Connected to up to 8 adjacent SeatNode instances via [-1..1, -1..1] offsets within the same roomId.
StudentRecord
roll: string
name: string, subject: string, batch: string, isPWD: boolean, isBacklog: boolean, enrolledPapers: string[]
roll is normalized to uppercase trimmed ASCII. isBacklog === true flags repeaters sitting across batches.
FacultyMember
facultyId: string
name: string, deptSubject: string, cumulativeDuties: number, heavyDaysStreak: number, status: 'Active' | 'Sick Leave' | 'On Leave' | 'Reserve Standby' | 'Flying Squad', blockedSlots: string[]
Cannot be assigned to any ExamRoom where deptSubject is in the room's active student subject set.
AllocationPlan
planId: string
sessionSlot: string, auditSeed: string, seedHash: number, rooms: Record<string, AllocatedRoom>, totalConflicts: number, fairnessScore: number, energySavedPct: number
Invariant: totalConflicts === 0 across all active rooms; reproducible bit-for-bit from auditSeed.

2.2 O(1) Roll-Number Lookup & QR Payload Schema
To guarantee sub-millisecond student lookups during peak exam-morning traffic, the solver populates an indexed hash map (studentLookupMap) immediately upon allocation completion:

Lookup Key: Normalized Roll Number (string, e.g., "CS2601").
Lookup Value: { roll, subject, batch, isPWD, isBacklog, roomId, floor, r, c, benchIndex: Math.floor(c / benchSize) + 1, seatLabel, sessionTime, auditSeed, qrSignature }.
QR Code Payload Format: LUMORA-EXAM|v1|${roll}|${subject}|${roomId}|${seatLabel}|${sessionSlot}|${seedHash} — encoded into a deterministic SVG matrix for instant optical verification at exam hall doors.
3. Algorithmic Engine Low-Level Design
3.1 Deterministic Seeded PRNG (FNV-1a + mulberry32)
To satisfy the Fairness and Audit requirement (unpredictable before exam day, 100% reproducible during a viva or dispute), Math.random() is strictly prohibited inside the solver. All randomization uses a two-stage pipeline:

String-to-Uint32 Seed Hashing (FNV-1a):
Initialize h = 2166136261 >>> 0.
For each character code c in auditSeed: h = Math.imul(h ^ c, 16777619) >>> 0.
32-Bit State Generator (mulberry32):
Given state a = h, each draw increments t = (a += 0x6D2B79F5), applies bit-mixing t = Math.imul(t ^ (t >>> 15), t | 1), t ^= t + Math.imul(t ^ (t >>> 7), t | 61), and returns ((t ^ (t >>> 14)) >>> 0) / 4294967296 in [0, 1).
Deterministic Fisher-Yates Shuffle:
Candidate queues are shuffled in O(N) using draws from mulberry32(h), ensuring identical seat maps whenever the same auditSeed is supplied.
3.2 8-Neighbor Graph-Coloring & Backtracking Solver
Each room R_k is a 2D grid of rows × cols seats.

8-Directional Adjacency Vector Definition:
DIRS_8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]] (Front-Left, Front, Front-Right, Left, Right, Back-Left, Back, Back-Right).
Function has8NeighborConflict(grid, r, c, candidateSubject, candidateBatch) iterates over all (dr, dc) ∈ DIRS_8. If any valid coordinate (r + dr, c + dc) contains an assigned student where student.subject === candidateSubject, it returns true (conflict detected).
Pass 1 — Room Bin-Packing (Optimization Goal):
Available non-closed, non-standby rooms are ordered by floor accessibility (floor === 0 first) and capacity. If TotalCandidates ≤ Sum(Capacity of R_1..R_m), rooms R_{m+1}..R_n are kept in Dark Standby Mode (allocated = 0), minimizing electricity, lighting, HVAC, and invigilators.
Pass 2 — PWD Ground-Floor Front-Row Priority Allocation:
Extract all candidates with isPWD === true.
Iterate through Ground-Floor rooms (floor === 0) and Front-Row coordinates (r === 0, c = 0..cols-1). Assign each PWD candidate to the first unblocked front-row seat where has8NeighborConflict(...) === false.
Pass 3 — Greedy Interleaved Coloring with Recursive Backtracking:
Group remaining regular and backlog candidates by subject and interleave them using the seeded PRNG so consecutive candidates in the queue represent distinct subjects.
For each open room and each unblocked, unassigned seat (r, c):
Greedy Scan: Scan the unplaced queue for the first candidate S_i where has8NeighborConflict(grid, r, c, S_i.subject) === false.
Backtracking Swap Fallback: If no candidate in unplaced satisfies (r, c) without a conflict, select cand = unplaced[0] and iterate backward over already-populated, non-PWD seats (sr, sc) where grid[sr][sc].student.subject !== cand.subject. Temporarily lift prevStu = grid[sr][sc].student and test if cand is conflict-free at (sr, sc) AND prevStu is conflict-free at (r, c). Upon finding a valid swap, commit cand to (sr, sc), place prevStu at (r, c), update studentLookupMap, and continue.
3.3 Partial Delta Reallocation Algorithm (Live Disruption Engine)
When a live disruption occurs (e.g., "Room 102 is closed for maintenance" or "Prof. Nair is sick"):

Isolation: Identify the affected resource (Room 102 or Faculty F2). Freeze the seat matrices of all unaffected rooms (Room 101, Room 103) as immutable snapshots.
Delta Extraction: Extract only the displaced student slice DeltaStudents = Room102.students (preserving their original seeded order).
Standby Activation & Coloring: Activate Standby Reserve Room 204 (standby → active) and run the 8-neighbor graph-coloring solver exclusively on DeltaStudents inside Room 204.
Verification: Assert Diff(Room101_Before, Room101_After) === 0, Diff(Room103_Before, Room103_After) === 0, and Conflicts(Room204) === 0.
3.4 Smart Invigilator Bipartite Matcher & Fairness Score Formula
Ratio Calculation: For each active room R_k with N_k > 0 seated students, compute RequiredInvigilators(R_k) = Math.max(1, Math.ceil(N_k / 30)).
Candidate Filtering: Filter FACULTY_POOL to exclude faculty where:
status === 'Sick Leave' or 'On Leave'
deptSubject ∈ ActiveSubjects(R_k) (Zero Subject Clash Rule)
heavyDaysStreak ≥ 2 (No Back-to-Back Heavy Days Rule)
Greedy Duty Equalization: Sort eligible faculty by ascending cumulativeDuties (breaking ties deterministically via the seeded PRNG), assign the top RequiredInvigilators(R_k) faculty to R_k, and increment their duty counters.
Standby & Flying Squad Assignment: Assign remaining eligible faculty with the lowest duty counts to Reserve Standby and Flying Squad pools.
Fairness Score Computation:
Let D = [d_1, d_2, ..., d_M] be the duty counts across all M active faculty members.
Compute mean μ = (1/M) × Σ d_i and standard deviation σ = √((1/M) × Σ (d_i - μ)²).
Compute FairnessScore = Math.max(0, Math.min(100, Number((100 - σ * 15).toFixed(1)))).
3.5 AI Schema-Free Excel Normalizer & Intent Parser Design
Heuristic Header Mapping (MessySheetNormalizer):
Normalizes raw spreadsheet headers by stripping punctuation/whitespace and matching against token dictionaries:
roll: ['roll', 'reg', 'registration', 'enrol', 'uid', 'id', 'matric']
subject: ['subj', 'paper', 'course', 'code', 'module']
isPWD: ['pwd', 'disab', 'handicap', 'accessible', 'ground', 'special']
isBacklog: ['backlog', 'repeat', 'arrear', 'supp', 'reappear']
Deterministic NL Intent Classifier (NLCommandParser):
Matches administrator or student utterances against prioritized intent patterns:
INTENT_CLOSE_ROOM: Matches /(?:room|hall)\s*(\d+)\s*(?:is\s*)?(?:closed|maintenance|shut|move)/i → Triggers DeltaReallocation(roomId).
INTENT_FACULTY_SICK: Matches /(?:prof|dr|faculty|invigilator)?\s*([a-z]+)\s*(?:is\s*)?(?:sick|leave|absent|swap)/i → Marks faculty on leave, promotes Reserve Standby, and recomputes Fairness Score.
INTENT_INGEST_BACKLOG: Matches /(?:parse|add|upload|ingest).*?(?:backlog|repeat|excel)/i → Appends backlog cohort and runs incremental graph coloring.
INTENT_STUDENT_LOOKUP: Matches /([A-Z]{2}\d{4})/i → Queries studentLookupMap and highlights seat + QR Hall Ticket.
4. Frontend Design System Specification (Lumora Studio)
4.1 Viewport-Proportional Adaptive rem Grid Math
Every layout container, typography token, padding, and border-radius is expressed in rem units scaled dynamically against the viewport width:

Viewport Breakpoint / Condition
Root html Font-Size Rule
Mathematical Basis
w > 1920px (Ultra-Wide Scale-Up)
Runtime JS: size = 16 - (16 * (((1920 - w) / 1920) * 100 * 0.6666)) / 100 (px)
Damped linear interpolation above baseWidth = 1920 with coef = 0.6666 so ultra-wide displays scale up smoothly.
max-width: 1920px
html { font-size: 0.833333vw; }
16 × 100 ÷ 1920 = 0.833333vw (1rem = 16px at 1920px).
max-width: 1440px
html { font-size: 1.111111vw; }
16 × 100 ÷ 1440 = 1.111111vw (1rem = 16px at 1440px).
max-width: 1024px
html { font-size: 1.5625vw; }
16 × 100 ÷ 1024 = 1.5625vw (1rem = 16px at 1024px).
max-width: 640px
html { font-size: 4.444444vw; }
16 × 100 ÷ 360 = 4.444444vw (1rem = 16px at 360px mobile baseline).

4.2 Design Tokens, Palette & Spring Physics Mapping
Token Category
CSS Custom Properties & Exact Values
Surface & Ink Palette
--background: #ffffff, --foreground: #111111, --ink: #0a0a0a, --muted: #8d8d8d, --subtle: #b6b6b6, --line: #e6e5e2, --surface: #f1f0ee, --surface-2: #e3e2df, --hero-from: #ecebe9, --hero-to: #c9c9c9
Brand & Starfield Accents
--accent: #b15f2c, --accent-from: #cf8047, --accent-to: #97501f, --star-mint: #aef6cf, --star-jade: #5fe6a0, --star-bone: #eafff2, --flame-a: #aee9ff, --flame-b: #c79bff
Border Radii & Containers
--radius-pill: 9999px, --radius-card: 2rem, --radius-card-sm: 1.25rem, --radius-control: 0.875rem, --text-watermark: 13rem, --container-shell: 88rem
Spring Physics & Easing Curves
• Header / Loader Exit ({tension: 210..220, friction: 26..30}) → cubic-bezier(.22, 1, .36, 1) (700ms)• Section & Card Reveals ({tension: 180..200, friction: 24..26}) → cubic-bezier(.16, 1, .3, 1) (750ms)• Interactive Hovers ({tension: 320, friction: 18}) → cubic-bezier(.2, .8, .2, 1) (350ms, gated by @media (hover: hover) and (pointer: fine))• Line Clip Reveal → cubic-bezier(0.215, 0.61, 0.355, 1) (900ms, lineStagger: 120ms)• Word Reveal (About H2) → cubic-bezier(0.165, 0.84, 0.44, 1) (700ms, wordStagger: 35ms)

4.3 PageLoader & Scroll-Lock State Machine
Mount State (t = 0ms): #page-loader mounts at position: fixed; inset: 0; z-index: 120; background: #0a0a0a; border-radius: 0 0 2rem 2rem. Calls stopScroll() which stops Lenis (lenis.stop()) and sets html { position: relative; overflow: hidden; height: 100% }.
Count-Up State (0ms → 1300ms): requestAnimationFrame computes normalized time t = clamp((now - start) / 1300, 0, 1), applies easeInOutCubic(t) = t < 0.5 ? 4*t³ : 1 - ((-2*t + 2)³)/2, updates #loader-fill width 0% → 100%, and formats #loader-counter as String(progress).padStart(3, '0') (000 → 100).
Exit Transition (1300ms → 2000ms): Adds .exit class (transform: translateY(-100%) on panel; opacity: 0; transform: translateY(-12px) on .loader-center).
Interactive Ready State (t = 2000ms): Sets introReady = true, calls startScroll(), removes #page-loader from DOM, and triggers staggered Hero entrance reveals (header: 150ms, eyebrow: 200ms, H1: 250ms, watermark: 300ms, HeroCard: 400ms, partners: 550ms, rating: 650ms, CTAs: 750ms, status bar: 900ms).
4.4 Hero LiquidReveal Dual-Canvas 2D Pipeline
Layer Stack & Strict Asset Mapping:
Base Layer (beforeSrc): <img class="liquid-base-img"> loaded from .../hero/after.jpg (always visible, serves as the Largest Contentful Paint element).
Brush Layer (afterSrc): Offscreen coverCanvas pre-rendered with .../hero/before.jpg using object-fit: cover aspect-ratio math (scale = Math.max(w / iw, h / ih)).
Pointer Interpolation:
On window.pointermove, convert pointer coordinates to device-pixel canvas space (dpr = Math.min(devicePixelRatio, 2)).
Interpolate between lastPt and (x, y) with step size step = Math.max(radius * 0.3, 1) (brushRadius = 143 CSS px), pushing up to 60 intermediate points into the points queue.
Per-Frame Stamp & Decay Loop:
On each animation frame, increment idle if points.length === 0, else reset idle = 0.
Compute decay alpha fade = drawing ? 0.016 : Math.min(0.016 + idle * 0.004, 0.5). Apply globalCompositeOperation = 'destination-out' with fillRect(0, 0, w, h) to smoothly evaporate older brush trails.
For each queued point (px, py), clear brushCanvas (diam = ceil(radius * 2)), draw radial gradient (0 → rgba(255,255,255,1), 0.55 → rgba(255,255,255,0.82), 1 → rgba(255,255,255,0)), composite coverCanvas region using source-in, and stamp onto main #liquid-canvas using source-over. At idle === 120, execute clearRect to eliminate sub-pixel residue.
5. 3D WebGL Post-Processing Design (Three.js Starfield Close r0.143.0)
5.1 Scene Graph, Camera Layers & BufferGeometry
Renderer: THREE.WebGL1Renderer({ canvas, antialias: true }), pixel ratio window.devicePixelRatio, shadowMap.enabled = true, shadowMap.type = THREE.VSMShadowMap.
Scene & Camera: Background 0x000000, THREE.Fog(0x000000, 0, 15), PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 80) positioned at (0, 0, 5).
Layer Bitmask Architecture: LAYERS = { NONE: 0, TORUS_SCENE: 1, BLOOM_SCENE: 2, ENTIRE_SCENE: 3 }. Camera enables layers 1, 2, 3; the THREE.Points star cloud enables LAYERS.ENTIRE_SCENE (3).
BufferGeometry Attributes (count = 4200, depth = 30):
position (Float32Array, itemSize 3): x ∈ [-12, 12], y ∈ [-8, 8], z ∈ [-15, 15].
aPalette (Float32Array, itemSize 1): Discrete index 0, 1, 2 selecting #aef6cf (mint), #5fe6a0 (jade), or #eafff2 (bone).
aBright (Float32Array, itemSize 1): Uniform random in [0.7, 1.3].
aScale (Float32Array, itemSize 1): Power-law distribution 0.5 + Math.pow(Math.random(), 1.4) * 2.5.
aPhase (Float32Array, itemSize 1): Uniform random phase in [0, 1] for independent sinusoidal twinkling.
5.2 Custom GLSL Shader Pipeline
Star Vertex Shader:
Wraps pos.z continuously along the tunnel depth uDepth = 30.0 via mod(pos.z + uDrift + (uDepth * 0.5), uDepth) - (uDepth * 0.5).
Computes per-star twinkle vTwinkle = (1.0 - uTwinkle) + uTwinkle * (0.55 + 0.45 * sin(uTime * 1.6 + aPhase * 6.2831)).
Applies world-space radial cursor repulsion: falloff = smoothstep(uRepelRadius, 0.0, length(modelPosition.xyz - uCursor)), displacing modelPosition.xyz outward by normalize(toParticle + vec3(0.0001)) * falloff * uRepelStrength * uActivity.
Scales perspective point size via gl_PointSize = uSize * aScale * (1.0 / -viewPosition.z).
Star Fragment Shader:
Clips each point sprite to a circle (if (length(gl_PointCoord - 0.5) > 0.5) discard;), applies quartic radial falloff strength = pow(1.0 - d * 2.0, 4.0), and outputs vec4(mix(vec3(0.0), vColor, strength) * uBrightness, strength * uOpacity * vTwinkle) with THREE.AdditiveBlending.
Multi-Composer Post-Processing & FinalPass Shader:
torusComposer (renderToScreen = false): RenderPass → GammaCorrectionShader → UnrealBloomPass(resolution, 0.22, 0.2, 0) → CopyShader.
bloomComposer (renderToScreen = false): RenderPass → UnrealBloomPass(resolution, 0.4, 0.55, 0) → GammaCorrectionShader.
finalComposer (renderToScreen = true): RenderPass → FinalPass ShaderPass. FinalPass evaluates the 3D trigonometric domain-warping function warp3d(vec3(uv.x, sin(uv.y), uv.y), iTime * 1.5) to synthesize corner plasma flames (uFlameA = #aee9ff, uFlameB = #c79bff, uFlameAmt = 0.2) over a radial-vignetted #0a0a24 background (uBg * (1.0 - 0.4 * length(uv))), summing bloomTexture, torusTexture, tDiffuse, and haloTexture.
5.3 World-Space Raycast Repulsion & Double-Damped Scroll Kinematics
World-Space Cursor Raycast: On mousemove, pointer coordinates are converted to Normalized Device Coordinates (ndc.x ∈ [-1, 1], ndc.y ∈ [-1, 1]), unprojected at z = 0.5, and intersected with the z = 0 world plane (t = -camera.position.z / dir.z). POINTER.world lerps toward the intersection point by 0.12 per frame, while POINTER.activity ramps toward 1.0 when active (idle < 3s) and decays to 0.0 when idle.
Double-Damped Scroll Dive: Normalized scroll progress scrollTarget ∈ [0, 1] passes through two cascaded first-order low-pass filters (scrollSmooth += (scrollTarget - scrollSmooth) * 0.10, scrollCurrent += (scrollSmooth - scrollCurrent) * 0.06). Each frame updates:
uDrift += dt * (2.35 + scrollCurrent * 6.0)
camera.position.set(mouseSmooth.x * 0.6, mouseSmooth.y * 0.6, 5.0 - scrollCurrent * 8.0)
group.rotation.z += dt * (0.03 + scrollCurrent * 0.10)
6. Verification, Failure Recovery & Security Design
Verification / Reliability Domain
Engineering Design Control
Zero-Conflict Mathematical Proof
Every solver execution and partial delta reallocation runs an automatic post-condition verifier (countTotalConflicts(allocatedRooms)) that checks all 8 neighbors of every seated student. Any non-zero count triggers an immediate backtracking pass before rendering.
Graceful WebGL / CDN Degradation
If WebGL1 context creation is restricted by hardware policy, the engine automatically falls back to THREE.WebGLRenderer and CSS dark-ink surfaces (#0a0a0a) so the Exam-Management Studio remains 100% functional.
Tamper-Evident Hall Tickets
Student QR Hall Tickets embed the deterministic seedHash alongside RollNo|RoomID|SeatLabel. Any manual alteration of a printed seat number mismatches the room door sheet and QR hash.
Zero-Disruption Delta Isolation
Room closures and faculty sick-leave swaps operate strictly on isolated state slices, guaranteeing that unaffected rooms retain their exact seat coordinates and printed attendance sheets.


