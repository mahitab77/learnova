# Learnova Platform — Implementation Conformance Program

Version: 1.3  
Status: Execution blueprint to make implementation match the authority docs after registration-model and academic-scope matching clarification

## 1. Program objective

Bring the current implementation into conformance with the authoritative architecture, workflow, and engineering standards while staying close to the current system.

This revised program explicitly includes:
- direct student self-registration as a first-class public path
- parent-led child identity creation with direct login disabled
- parent-led child identity creation with direct login enabled
- normalized student academic-scope adoption
- explicit null-grade matching semantics for discovery, selection, and booking
- discovery/selection/booking convergence

### Registration model to implement and preserve

The product supports three valid ways a student identity may exist and access the platform:

1. **Direct student self-registration**
   - intended for students who can register and authenticate on their own
   - creates a `users(role=student)` row and a linked `students` row
   - does **not** create a `parent_students` linkage row automatically

2. **Parent registration + linked child identity without direct login**
   - intended for younger children
   - parent creates the child
   - backend still creates a distinct student identity:
     - `users(role=student)`
     - `students(user_id=child_user.id)`
     - `parent_students(..., has_own_login=0)`
   - the child exists as a real student identity, but cannot sign in directly

3. **Parent registration + linked child identity with direct login**
   - parent creates the child and enables child sign-in
   - backend creates:
     - `users(role=student)`
     - `students(user_id=child_user.id)`
     - `parent_students(..., has_own_login=1)`
   - the child may authenticate directly using their own student login

### Clarification about “same account”

“Parent uses the same account for the child” means the parent signs in once and acts in linked child context. It does **not** mean the child lacks a student identity or shares the parent’s `users` row. Parent-led child creation must always produce a real linked student identity.

## 2. Sequence

### Phase 1 — Identity and academic-scope source of truth
Objective:
- make normalized student academic scope authoritative in backend logic
- codify all three supported student identity entry/access modes
- ensure parent-created children are linked student identities, not loose profiles
- make direct student self-registration public and canonical

Primary files:
- `src/utils/academicScope.js`
- `src/controllers/auth.controller.js`
- `src/controllers/student.controller.js`
- `src/controllers/parent.controller.js`
- any registration service/helper
- any parent-child creation helper
- `src/app/auth/register-student/page.tsx`
- related FE registration entry points only as needed for contract alignment

Success criteria:
- backend resolves student scope from `students.system_id`, `students.stage_id`, `students.grade_level_id`
- direct student self-registration works through a public FE + BE flow
- parent-led child creation yields linked student identity + linkage row
- `has_own_login` explicitly governs direct sign-in for parent-created children
- legacy scope fallback exists only as temporary compatibility

### Phase 2 — Contracts and public registration data
Objective:
- public grade catalog and subjects lookups
- canonical schedule contract
- weekday consistency across registration, dashboard, and backend CRUD

Primary files:
- `src/routes/meta.routes.js`
- subject route file exposing `GET /subjects`
- `src/controllers/meta.controller.js`
- `src/utils/scheduleContract.js`
- `src/controllers/auth.controller.js`
- `src/controllers/teacher.controller.js`
- `src/app/auth/register-teacher/page.tsx`
- `src/app/teacher/dashboard/useTeacherDashboard.ts`
- `src/app/teacher/dashboard/panels/TeacherSchedulePanel.tsx`

Success criteria:
- pre-auth registration lookups work
- registration and dashboard share schedule contract
- weekday drift eliminated

### Phase 3 — Ratings completion
Objective:
- keep schema-backed rating support fully real
- wire existing FE rating UX to real backend endpoints
- ensure rating eligibility follows completed session rules

Primary files:
- `src/controllers/rating.controller.js`
- student/parent route modules
- verify existing rating FE files only

Success criteria:
- one rating per session enforced
- student and parent rating endpoints work
- parent/student flows use correct eligibility
- teacher discovery can display real rating aggregates

### Phase 4 — Teacher slot offerings UI
Objective:
- expose per-slot offerings management in the teacher dashboard
- make draft/live slot states explicit

Primary files:
- `src/app/teacher/dashboard/teacherDashboardTypes.ts`
- `src/app/teacher/dashboard/teacherDashboardTexts.ts`
- `src/app/teacher/dashboard/useTeacherDashboard.ts`
- `src/app/teacher/dashboard/modals/SlotOfferingsModal.tsx`
- `src/app/teacher/dashboard/panels/TeacherSchedulePanel.tsx`
- `src/app/teacher/dashboard/page.tsx`

Success criteria:
- teacher can manage offerings per slot
- draft vs live slots are visible
- booking model and teacher UI align

### Phase 5 — Discovery, selection, and booking alignment
Objective:
- make parent and student discovery use the same academic-scope and offering logic as booking
- remove null-grade wildcard behavior from academic-scope matching
- remove schedule identity guessing in student booking

Primary files:
- `src/utils/academicScope.js`
- `src/controllers/student.controller.js`
- `src/controllers/parent.controller.js`
- `src/app/student/onboarding/page.tsx`
- `src/app/student/dashboard/page.tsx`
- verify `src/app/parent/choose-teacher/page.tsx`

Success criteria:
- parent chooser returns only valid live-offering teachers
- student onboarding returns only valid live-offering teachers
- write paths use the same eligibility validator as read paths
- `student.grade_level_id = null` or `child.grade_level_id = null` matches only stage-wide rows where `grade_level_id IS NULL`
- grade-specific rows are returned only for exact grade matches
- booking uses deterministic slot/schedule identity

### Phase 6 — Security and consistency hardening
Objective:
- approval-gate teacher operational routes
- align lesson mutation writes to schema
- make authenticated mutation transport and CSRF behavior consistent
- regression-verify switch/session workflows

Primary files:
- `src/middlewares/teacher.js`
- `src/middlewares/csrf.js`
- `src/routes/teacher.routes.js`
- `src/routes/payment.routes.js`
- `src/controllers/teacher.controller.js`
- `src/controllers/student.controller.js`
- FE authenticated mutation callers using raw fetch

Success criteria:
- only approved active teachers access operational routes
- mutation writes are schema-aligned
- authenticated mutation flows use one shared transport path
- CSRF is fail-closed for authenticated mutation requests

### Phase 7 — Payment posture alignment
Objective:
- make UI and backend truthfully reflect offline/manual payment posture unless a full product decision and end-to-end gateway flow are implemented

Primary files:
- `src/controllers/payment.controller.js`
- `src/controllers/refund.controller.js`
- `src/routes/payment.routes.js`
- `src/app/parent/checkout/[sessionId]/page.tsx`
- `src/services/paymentService.ts`

Success criteria:
- no fake-live checkout behavior remains
- client-supplied placeholder amount is gone
- payment UI truth matches actual product scope

## 3. Delivery rules

- Each phase should end with build + targeted workflow checks.
- Do not combine major UX redesigns with structural conformance work.
- Keep endpoint paths stable unless absolutely necessary.
- Use commit boundaries per phase and keep changes auditable.
- Do not start enhancement polish on discovery/booking/payment until the conformance phase for that domain is complete.

## 4. Enhancements intentionally deferred until after conformance

Deferred until core conformance is achieved:
- full payment gateway integration
- public review pages
- exact next-available teacher summaries in chooser cards
- group booking support
- major marketplace ranking/filter redesign

## 5. Definition of ready-for-enhancement

The platform is ready for broader enhancements only when:
- all conformance phases are complete
- role/access rules are stable
- registration identity paths are explicit and correct
- all three supported student entry/access modes work as defined
- slot/offering/discovery/booking models are aligned
- null-grade matching semantics are implemented consistently across subject availability, teacher discovery, selection, availability, and booking
- ratings are fully real
- no schema-contract drift remains in lesson mutations
- normalized student academic scope is the sole operational source of truth
