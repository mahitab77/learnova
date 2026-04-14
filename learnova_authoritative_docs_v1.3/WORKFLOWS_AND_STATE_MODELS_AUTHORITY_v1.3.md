# Learnova Platform — Authoritative Workflows and State Models

Version: 1.3  
Status: Normative workflow reference, revised after registration-model and academic-scope matching clarification

## 1. Workflow conventions

This document defines workflow states and invariants. If UI behavior, controller logic, and schema disagree, this document is the target contract implementation must fulfill.

Normative language:
- MUST = required
- SHOULD = strongly recommended
- MAY = optional

## 2. Identity and registration workflows

### 2.1 Direct student self-registration

#### Inputs
- credentials
- personal/basic student details
- academic scope
- agreements/consents

#### Target flow
1. Student opens public registration flow.
2. System provides public academic catalog lookups.
3. Student submits registration.
4. System creates:
   - `users(role = student)`
   - `students(user_id = users.id)`
5. System stores normalized academic scope:
   - `system_id`
   - `stage_id`
   - `grade_level_id`
6. Student signs in directly and uses the platform.

#### Invariants
- grade catalog and subjects must be fetchable before login when needed
- normalized academic scope must be stored on `students`
- legacy `grade_stage` / `grade_number` are transitional compatibility fields only
- direct student registration must not create a parent linkage row

### 2.2 Parent registration and child creation — no direct login

#### Inputs
- parent credentials
- parent profile data
- one or more children with academic scope and relationship details

#### Target flow
1. Parent opens public registration flow.
2. System creates:
   - `users(role = parent)`
   - `parents(user_id = users.id)`
3. Parent adds a child in no-own-login mode.
4. For each child, system creates:
   - `users(role = student)` for the child identity
   - `students(user_id = child_user.id)`
   - `parent_students(parent_id, student_id, relationship, has_own_login = 0)`
5. Child academic scope is stored in normalized fields on `students`.
6. Parent acts in linked child context immediately.
7. Child direct sign-in is disabled.

#### Invariants
- every parent-added child MUST get a linked student identity
- parent-child linkage must exist in `parent_students`
- `has_own_login = 0` means child identity exists but direct login is not enabled
- “same account” means parent context, not reusing the parent `users` row as the child identity
- parent-child linkage validation is mandatory on all targeted parent actions

### 2.3 Parent registration and child creation — direct login enabled

#### Inputs
- parent credentials
- parent profile data
- one or more children with academic scope and relationship details
- child login enablement

#### Target flow
1. Parent opens public registration flow.
2. System creates:
   - `users(role = parent)`
   - `parents(user_id = users.id)`
3. Parent adds a child in own-login-enabled mode.
4. For each child, system creates:
   - `users(role = student)` for the child identity
   - `students(user_id = child_user.id)`
   - `parent_students(parent_id, student_id, relationship, has_own_login = 1)`
5. Child academic scope is stored in normalized fields on `students`.
6. Parent acts in linked child context immediately.
7. Child may sign in directly using the child’s own student account credentials.

#### Invariants
- every parent-added child MUST get a linked student identity
- parent-child linkage must exist in `parent_students`
- `has_own_login = 1` means the child may authenticate directly
- parent linkage remains in force even when direct child login is enabled
- parent-child linkage validation is mandatory on all targeted parent actions

### 2.4 Parent ↔ student switch workflow

#### Target flow
1. Parent enters student mode for linked child.
2. System stores parent session snapshot.
3. Student-mode context is activated.
4. Parent may switch back.
5. Parent context is restored from snapshot.

#### Invariants
- only linked students may be switched into
- nested switch stacking should be prevented
- session regeneration should occur on switch and restore

## 3. Teacher registration workflow

### Inputs
- personal details
- credentials
- professional details
- teacher-wide education system / grade levels / subjects
- weekly schedule drafts
- demo videos
- agreements/consents

### Target state flow
1. Draft form
2. Submitted registration
3. Teacher row exists with `status = pending_review`
4. Admin reviews
5. Teacher becomes `approved` or `rejected`

### Invariants
- grade catalog and subjects must be fetchable before login
- registration schedules must already use canonical schedule payload
- registration schedules create draft/live-ready slots, but not slot offerings
- teacher operational routes remain blocked until approved

## 4. Teacher slot and offering workflow

### Slot lifecycle
States:
- Draft slot = slot exists, zero offerings
- Live slot = slot exists, one or more active offerings
- Inactive slot = slot exists, `is_active = 0`

### Slot invariants
- slot defines time only
- slot does not encode academic scope
- weekday must be canonical `1..7`
- group slots may exist, but direct group booking is deferred until implemented

### Offering lifecycle
States:
- no offering rows
- one or more active offering rows
- offering rows replaced atomically per slot

### Offering invariants
- every offering row must include `subject_id`, `system_id`, `stage_id`
- `grade_level_id` may be null and means stage-wide
- a stage-wide null offering may match any student within the same system/stage
- a grade-specific offering may match only students/children with the exact same `grade_level_id`
- a student/child with `grade_level_id = null` must not match grade-specific offerings by wildcard
- duplicate offerings for same slot are de-duplicated
- stage must belong to system
- grade level must belong to stage when present

## 5. Parent teacher selection workflow

### Current intent
The parent selects a teacher for a linked child and subject.

### Authoritative target flow
1. Parent chooses linked child
2. Parent chooses subject
3. Backend resolves child academic scope from normalized student fields
4. Backend validates subject availability for that scope
5. Backend returns only teachers with live offerings that match the scope
6. Parent either:
   - assigns directly if no current teacher exists
   - creates a change request if a current teacher already exists

### Invariants
- parent must be linked to child
- discovery must use live offerings, not broad teacher-subject capability only
- if the child has a concrete `grade_level_id`, discovery may match exact-grade or stage-wide null-grade offerings
- if the child has `grade_level_id = null`, discovery may match only stage-wide null-grade offerings
- child null-grade scope must not widen discovery to all grade-specific rows within the stage
- current teacher must be filtered out in change-teacher flow
- teacher cards may show metadata and rating aggregates

## 6. Student teacher selection and booking workflow

### 6.1 Student teacher selection
1. Student chooses subject.
2. Backend resolves student academic scope from normalized student fields.
3. Backend returns only eligible teachers with live offerings matching that scope.
4. Student selects a teacher for the subject.
5. Backend validates selection against the same live-offering rule used for discovery.

### 6.1.1 Academic-scope matching semantics
For teacher discovery, selection, availability, and booking:
- a student with a concrete `grade_level_id` may match exact-grade rows and stage-wide rows where `grade_level_id IS NULL`
- a student with `grade_level_id = null` may match only stage-wide rows where `grade_level_id IS NULL`
- `student.grade_level_id = null` must not be interpreted as a wildcard that matches all grade-specific rows within the stage

### 6.2 Student booking

#### Inputs
- selected teacher
- selected subject
- selected slot
- proposed start/end timestamps

#### Authoritative flow
1. Student requests availability for teacher
2. Backend returns:
   - active slots
   - scope-aware slot offerings
   - active exceptions
   - blocking sessions
3. Student picks a valid slot/time
4. Backend validates in transaction:
   - active student context
   - normalized student academic scope
   - subject enrollment
   - active teacher selection
   - slot ownership and activity
   - non-group rule
   - weekday fit
   - time-window fit
   - offering academic-scope fit
   - exception rules
   - overlap prevention for teacher and student
5. Backend creates/updates lesson session lifecycle record

### Booking invariants
- no session in the past
- student must have teacher actively selected for the subject
- academic scope is derived, not manually chosen at booking time
- a student with `grade_level_id = null` may book only against stage-wide rows where the offering/availability `grade_level_id IS NULL`
- booking is approval-based by default
- frontend must not guess schedule identity from unrelated offering rows

## 7. Lesson request / session lifecycle

### Canonical statuses currently in schema
- pending
- scheduled
- approved
- rejected
- completed
- cancelled
- no_show

### Required interpretation
- pending = requested / awaiting approval
- scheduled/approved = operationally confirmed future lesson
- rejected = teacher/admin declined before delivery
- cancelled = a previously viable/confirmed session will not be delivered
- completed/no_show = terminal delivery outcome states

### Cancellation invariants
- cancellation must record `cancelled_by`
- cancellation should record `cancel_reason` when supplied
- mutations should stamp `updated_by_user_id`
- implementation must only write schema-real columns

## 8. Attendance workflow

Attendance is tracked per student in `lesson_session_students`.

Valid statuses:
- scheduled
- present
- absent
- late
- excused

### Invariants
- attendance is session-student scoped
- final delivery status should derive from attendance-backed outcome after session end
- rating eligibility may depend on attendance-backed completion

## 9. Rating workflow

### Target flow
1. Student or linked parent requests rating state for a session
2. Backend returns `canRate`, `editableUntil`, and existing rating if any
3. Eligible actor submits 1..5 stars and optional comment
4. Backend upserts the single session rating
5. Backend returns updated aggregate summary for the teacher

### Invariants
- exactly one rating per session
- only session owner or linked parent may rate
- teacher cannot rate themselves
- edit window = 7 days after eligible completion
- hidden ratings excluded from aggregate display

## 10. Homework and quiz workflow

### Homework
Teacher creates assignment -> student submits -> teacher grades -> parent/student can view outcomes.

### Quiz
Teacher creates quiz -> student starts/submits -> teacher grades -> parent/student can view outcomes.

### Invariants
- only approved operational teachers should manage homework/quizzes
- student/parent read models should respect ownership/linkage

## 11. Payment posture workflow

### Current authoritative posture
Payment is offline/manual until a gateway/product decision is finalized.

### Invariants
- booking/session UX must not pretend a live payment gateway exists
- any payment/billing UI must clearly reflect manual/offline posture unless end-to-end gateway flow is actually implemented
- refunds and billing events may exist in schema/API without implying live gateway processing
