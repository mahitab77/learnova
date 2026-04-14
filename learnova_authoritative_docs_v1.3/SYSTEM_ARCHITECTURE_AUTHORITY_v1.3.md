# Learnova Platform — Authoritative System Architecture and Design

Version: 1.3  
Status: Authoritative baseline, revised after registration-model and academic-scope matching clarification, with latest schema alignment  
Audience: Engineering, product, QA, architecture

## 1. Purpose

This document defines the authoritative architecture and target design for the Learnova platform as it exists today, with the minimum necessary hardening and alignment required to make the system coherent, safe to extend, and operationally predictable.

This is **not** a greenfield redesign. It is an architecture baseline that stays close to the current implementation while resolving identified contract drift, workflow gaps, identity ambiguity, and security inconsistencies.

## 2. Design principles

1. **Source-of-truth over duplicate logic.** Business rules must exist once per domain concern.
2. **Workflow integrity over UI convenience.** The frontend may guide, but the backend must enforce.
3. **Session-cookie auth as the default model.** No localStorage auth, no URL user IDs for authority.
4. **Academic scope is explicit.** System, stage, and optional grade must be resolved deterministically.
5. **A slot is time; an offering is audience.** These are separate concepts and must remain separate.
6. **Payments are intentionally offline/manual for now.** No fake gateway assumptions in core workflow.
7. **Pending teachers may configure; approved teachers may operate.** Configuration and operational permissions are different concerns.
8. **Schema-aligned mutations only.** Controllers must only write fields that exist in the real schema.
9. **Three student entry/access modes are first-class.** The system must support:
   - direct student self-registration
   - parent-created child identity without direct login
   - parent-created child identity with direct login
10. **A child identity and a child login are not the same concern.** A child may exist as a linked student identity before direct login is enabled.

## 3. System context

The platform is a session-authenticated tutoring/LMS system with four primary actors:

- Student
- Parent
- Teacher
- Admin

Core capabilities currently implemented in the codebase and schema:

- Student self-registration
- Parent-led linked student management
- Teacher registration and approval workflow
- Teacher/subject selection
- Weekly schedules and schedule exceptions
- Slot offerings by academic scope
- Lesson request / approval / scheduling / attendance lifecycle
- Homework and quizzes
- Notifications and announcements
- Ratings
- Manual/offline payment posture with schema support for future completion

## 4. Bounded contexts

### 4.1 Identity and session context

Responsible for:
- user login/session
- role enforcement
- direct student accounts
- parent-created student identities
- parent ↔ student switching context
- teacher approval gating

Primary tables:
- `users`
- `parents`
- `students`
- `teachers`
- `parent_students`

### 4.2 Academic catalog context

Responsible for:
- educational systems
- grade stages
- grade levels
- subjects
- subject availability by academic scope

Primary tables:
- `educational_systems`
- `grade_stages`
- `grade_levels`
- `subjects`
- `subject_availability`

### 4.3 Teacher capability and availability context

Responsible for:
- teacher profile and approval
- teacher-wide subject and grade capability
- weekly schedule slots
- schedule exceptions
- per-slot offerings
- teacher demo videos

Primary tables:
- `teachers`
- `teacher_subjects`
- `teacher_grade_levels`
- `teacher_schedules`
- `teacher_schedule_exceptions`
- `teacher_schedule_subjects`
- `teacher_videos`
- `v_teacher_slot_offerings`

### 4.4 Discovery and selection context

Responsible for:
- parent and student teacher selection
- parent teacher-change requests
- student active teacher selections

Primary tables:
- `student_teacher_selections`
- `parent_change_requests`

### 4.5 Booking and session execution context

Responsible for:
- teacher availability query
- lesson requests
- teacher approval/rejection
- session creation and lifecycle
- attendance tracking

Primary tables:
- `lesson_sessions`
- `lesson_session_students`
- plus availability tables in 4.3

### 4.6 Learning activity context

Responsible for:
- homework assignments and submissions
- quiz assignments and submissions
- grading

Primary tables:
- `homework_assignments`
- `homework_submissions`
- `quiz_assignments`
- `quiz_submissions`

### 4.7 Communication context

Responsible for:
- notifications
- announcements

Primary tables:
- `notifications`
- `announcements`

### 4.8 Billing and rating context

Responsible for:
- payment intent / payment records
- refunds
- billing audit trail
- teacher ratings and aggregates

Primary tables:
- `payments`
- `refunds`
- `billing_events`
- `teacher_ratings`

## 5. Canonical identity concepts

### 5.1 User account

A `users` row is the canonical login/session identity.  
A user has one primary role:
- `student`
- `parent`
- `teacher`
- `admin`

### 5.2 Student identity

A student identity is represented by:
- one `users` row with `role = student`
- one `students` row
- linkage through `students.user_id`

A student identity may be created in one of three ways:
1. direct student self-registration
2. parent-led child creation with direct login disabled
3. parent-led child creation with direct login enabled

### 5.3 Parent-led child identity

When a parent adds a child, the system MUST create:
- a `users` row for the child with `role = student`
- a `students` row linked via `students.user_id`
- a `parent_students` row linking the parent to the child

This is an authoritative rule. A parent-added child is not merely a loose profile row; it is a linked student identity.

### 5.4 Child login capability

`parent_students.has_own_login` governs whether a **parent-created** linked child identity may authenticate directly.

Rules:
- `has_own_login = 0` means the child exists as a linked student identity but direct login is not enabled
- `has_own_login = 1` means the child may authenticate directly using their own student account credentials
- Parent-child linkage exists regardless of `has_own_login`

### 5.5 Parent-context clarification

When product/UI language says the parent uses “the same account” for the child, the authoritative meaning is:

- the parent authenticates once using the parent account
- the parent acts in linked child context
- the child still has a distinct student identity in `users` + `students`
- the child does **not** share the parent’s `users` row

### 5.6 Direct student self-registration

A directly self-registered student is a standalone student identity:
- `users(role=student)`
- `students(user_id=users.id)`

This path does **not** create a `parent_students` linkage row automatically.

### 5.7 Parent-owned child actions

A parent may act for a child only when:
- the parent is authenticated
- the child is linked through `parent_students`
- the targeted action is allowed in child context

Linkage validation is mandatory on every targeted parent action.

## 6. Canonical academic concepts

### 6.1 Academic scope

Academic scope is the tuple:
- `system_id`
- `stage_id`
- `grade_level_id` (nullable)

Rules:
- `system_id` and `stage_id` are mandatory for scoped matching.
- `grade_level_id = null` means stage-wide applicability.
- For operational matching, a student or child with `grade_level_id = null` is stage-wide only and does **not** match grade-specific rows by wildcard.
- For operational matching, a student or child with a concrete `grade_level_id` may match exact-grade rows or stage-wide rows where `grade_level_id IS NULL`.
- Subject availability must be validated against the student's or child’s real academic scope.

### 6.2 Student academic scope source of truth

The authoritative academic scope for a student is stored on `students`:
- `system_id`
- `stage_id`
- `grade_level_id`

Legacy fields such as `grade_stage` and `grade_number` are transitional compatibility fields only and must not remain the long-term source of truth.

## 7. Canonical scheduling concepts

### 7.1 Slot

A slot is only time and delivery shape:
- `weekday`
- `start_time`
- `end_time`
- `is_group`
- `max_students`
- `is_active`

A slot does **not** define subject/system/stage/grade by itself.

### 7.2 Offering

An offering defines audience for a slot:
- `subject_id`
- `system_id`
- `stage_id`
- `grade_level_id | null`
- `is_active`

A slot may exist without offerings. Such a slot is a valid **draft slot**, not an error.

### 7.3 Lesson request

A lesson request is a proposed future lesson tied to:
- selected teacher
- selected subject
- concrete schedule slot
- concrete datetime window
- child/student academic scope

### 7.4 Session

A lesson session is the lifecycle record derived from a request or approved booking and stores:
- teacher
- subject
- academic scope
- schedule_id / exception_id when applicable
- starts/ends timestamps
- status
- cancellation metadata
- actor metadata
- optional meeting metadata

## 8. Canonical technical contracts

### 8.1 Schedule payload contract

The authoritative slot payload is:

```ts
{
  weekday: number,      // canonical backend model: 1..7
  start_time: string,   // HH:MM or HH:MM:SS input tolerated
  end_time: string,
  is_group: 0 | 1,
  max_students: number | null,
  is_active?: 0 | 1
}
```

Canonical weekday model:
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday
- 7 = Sunday

Temporary compatibility for legacy `0..6` inputs may exist during migration, but all stored and returned values should converge to `1..7`.

### 8.2 Registration lookups

The following endpoints are public reference-data endpoints and MUST be available without authentication:
- `GET /meta/grade-catalog`
- `GET /subjects`

These endpoints expose non-sensitive catalog data required during registration.

### 8.3 Ratings contract

Ratings are session-scoped and owned by the eligible actor.

Rules:
- exactly one rating per session
- 1..5 stars
- optional comment
- editable for 7 days after eligible completion
- teacher cannot rate themselves
- hidden ratings excluded from aggregate display

## 9. Identity and registration entry paths

### 9.1 Path A — Direct student self-registration

1. Student opens the public student registration flow.
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
7. No `parent_students` linkage row is created automatically.

### 9.2 Path B — Parent registration + linked child without direct login

1. Parent creates a parent account.
2. System creates:
   - `users(role = parent)`
   - `parents(user_id = users.id)`
3. Parent adds one or more children in no-own-login mode.
4. For each child, system creates:
   - `users(role = student)` for the child
   - `students(user_id = child_user.id)`
   - `parent_students(parent_id, student_id, has_own_login = 0, relationship)`
5. Child academic scope is stored in normalized fields on `students`.
6. Parent acts in linked child context immediately.
7. Child cannot sign in directly.

### 9.3 Path C — Parent registration + linked child with direct login

1. Parent creates a parent account.
2. System creates:
   - `users(role = parent)`
   - `parents(user_id = users.id)`
3. Parent adds one or more children in own-login-enabled mode.
4. For each child, system creates:
   - `users(role = student)` for the child
   - `students(user_id = child_user.id)`
   - `parent_students(parent_id, student_id, has_own_login = 1, relationship)`
5. Child academic scope is stored in normalized fields on `students`.
6. Parent remains linked to the child.
7. Child may authenticate directly using their own student account credentials.

### 9.4 Entry-path invariants

- All three paths are first-class and supported.
- Every child added by a parent MUST result in a linked student identity, not just a loose profile row.
- Parent-child linkage MUST be validated on every targeted parent action.
- Child academic scope MUST be stored in normalized form on `students`.
- Whether a parent-created child can sign in directly is controlled by `has_own_login`, not by whether the child identity exists.
- Direct student self-registration must not create a parent linkage row automatically.

## 10. Workflow model

### 10.1 Teacher registration and activation

1. Teacher submits registration.
2. Registration captures:
   - personal details
   - professional details
   - teacher-wide subjects and grades
   - initial weekly slots
   - demo videos
3. Teacher enters `pending_review`.
4. Admin approves or rejects.
5. Teacher may configure profile/setup routes while pending.
6. Only approved and active teachers may use operational teaching routes.

### 10.2 Teacher scheduling model

1. Teacher creates or edits a weekly slot.
2. Teacher may add schedule exceptions.
3. Teacher attaches offerings to slots.
4. Students/parents only see/book slots whose offerings match the relevant academic scope.

### 10.3 Parent teacher selection

1. Parent chooses child and subject.
2. System resolves the child’s academic scope from normalized student columns.
3. System validates subject availability for that scope.
4. System returns only teachers with live offerings that match:
   - subject
   - system
   - stage
   - exact student/child grade when present, or
   - stage-wide null grade rows
   and a null student/child grade must not expand matching to all grade-specific offerings within the stage
5. If no current teacher exists, the parent may assign directly.
6. If a current teacher exists, the parent creates a teacher-change request instead.

### 10.4 Student booking

1. Student selects teacher for a subject.
2. Student requests availability.
3. Backend returns slots + slotScopes + exceptions + sessions.
4. Student picks a valid slot/time.
5. Backend validates in transaction:
   - active student context
   - subject enrollment
   - active teacher selection
   - slot ownership and activity
   - non-group rule
   - weekday fit
   - time-window fit
   - offering academic-scope fit using the same null-grade semantics as discovery and selection
   - exception rules
   - overlap prevention for teacher and student
6. Backend creates/updates lesson session lifecycle record.

### 10.5 Teacher lesson request handling

1. Teacher views pending requests.
2. Teacher approves or rejects.
3. Approval/rejection mutates lesson session status.
4. Mutation must stamp actor identity in `updated_by_user_id`.

### 10.6 Ratings

1. Eligible student or linked parent opens rating after completed/attendance-backed session.
2. Backend confirms eligibility.
3. Actor creates or updates the single session rating.
4. Aggregates feed teacher discovery cards.

## 11. Security model

### 11.1 Authentication

- Session-cookie auth is the default and authoritative model.
- Role checks are necessary but not sufficient for teacher operational access.

### 11.2 Teacher access control

Two layers are required:
1. `requireTeacherSession` for authenticated teacher role
2. `requireTeacherApproved` for operational routes

Approved-session fast paths must not bypass DB truth about `teachers.status` and `teachers.is_active`.

### 11.3 Parent-child isolation

Parent actions that target a student must always verify `parent_students` linkage.

### 11.4 Booking integrity

Frontend guidance is helpful, but backend must enforce:
- scope fit
- selection ownership
- overlap protection
- future time
- slot validity
- null-grade semantics that do not widen stage-scoped students into grade-specific offerings

## 12. Payment posture

Payments are intentionally offline/manual until a gateway provider is chosen.

Implications:
- no gateway integration is required for current architecture conformance
- booking and session workflows must not pretend a live payment gateway exists
- UI should reflect payment-arrangement or offline-payment posture where applicable

## 13. Known architecture gaps to close

1. Backend must fully switch student academic-scope reads to normalized `students.system_id`, `students.stage_id`, `students.grade_level_id`.
2. Student and parent discovery/write paths must use the same live-offering validator as booking.
3. Null-grade scope matching must be stage-wide only and must not widen matching to all grade-specific rows.
4. Public direct student self-registration must be fully exposed and use normalized scope as the canonical contract.
5. Student booking must stop inferring wrong schedule identities on the frontend.
6. Ratings must remain lifecycle-gated and hidden-aware in aggregates.
7. Payment UI must match actual offline/manual posture unless true end-to-end payment is implemented.
8. Teacher operational routes must remain approval-gated.
9. Lesson-session mutation writes must remain schema-aligned.

## 14. Definition of “architecturally conformant”

The implementation is conformant when:
- all catalog lookups required pre-auth are public
- schedule contract is singular and canonical
- teacher registration, dashboard scheduling, and booking all interpret weekdays the same way
- slot offerings are teacher-manageable and govern discovery/booking
- parent discovery and student booking share the same academic-scope model
- null-grade matching semantics are implemented consistently and do not widen stage-scoped students into grade-specific rows
- direct student self-registration works as defined
- parent-led child creation works in both no-own-login and own-login-enabled modes
- child login capability is governed explicitly by `has_own_login`
- ratings are real, schema-backed, and session-scoped
- teacher operational routes require approved and active teacher status
- session mutation writes match the actual database schema
