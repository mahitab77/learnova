# Learnova Platform — Security and Engineering Standards

Version: 1.3  
Status: Normative engineering baseline, revised after registration-model and academic-scope matching clarification

## 1. Security principles

1. Backend enforcement is authoritative.
2. Authentication and authorization are separate concerns.
3. Setup permissions and operational permissions are separate concerns.
4. Schema truth is authoritative for writes.
5. Route protection must be explicit and minimal.
6. Transactions should begin before race-sensitive availability checks.
7. Parent-led child creation is an identity concern, while child direct login is a separate access concern.
8. Normalized academic scope is authoritative wherever student scope is used for discovery, selection, or booking.
9. A child without direct login is still a real student identity, not a loose profile.
10. Direct student self-registration is a first-class public registration path.
11. `grade_level_id = null` means stage-wide applicability only; it must not be treated as a wildcard across grade-specific rows.

## 2. Authentication and authorization

### Required posture
- Session-cookie auth is mandatory for authenticated routes.
- Role checks must be enforced server-side.
- Teacher operational routes require both teacher role and approved/active teacher status.
- Parent-child linkage must be validated on every targeted parent action.
- Child direct login enablement must respect `parent_students.has_own_login` for parent-created child identities.
- Direct student self-registered accounts are independent student identities and are not gated by `parent_students`.

### Teacher route standard
Use two levels:
- `requireTeacherSession` for teacher-authenticated access
- `requireTeacherApproved` for operational teaching endpoints

### Approval middleware rule
An “approved” status cached in session metadata MUST NOT bypass a DB truth check when operational access depends on current `teachers.status` and `teachers.is_active`.

## 3. Identity and linkage standards

### Supported student identity modes
The implementation must support all three of the following:
1. direct student self-registration
2. parent-created child identity with `has_own_login = 0`
3. parent-created child identity with `has_own_login = 1`

### Parent-created child identity rule
When a parent adds a child, the backend MUST create:
- a `users` row with `role = student`
- a `students` row linked through `students.user_id`
- a `parent_students` linkage row

Creating only a loose student profile without a corresponding student identity is non-conformant.

### No-own-login clarification
`has_own_login = 0` means:
- the child identity exists
- the child is linked to the parent
- the child cannot authenticate directly

It does **not** mean:
- reuse the parent’s `users` row as the student identity
- skip creation of the child’s student identity

### Parent-child targeting rule
Any endpoint that acts on behalf of a parent for a child MUST verify:
- authenticated parent session
- `parent_students` linkage
- target action ownership rules

### Student scope rule
Any endpoint needing student academic scope MUST resolve it from:
- `students.system_id`
- `students.stage_id`
- `students.grade_level_id`

Legacy `grade_stage` / `grade_number` may be used only as a temporary migration fallback and should be removed from operational logic after convergence.

### Academic-scope matching rule
For discovery, selection, subject availability, slot-offering visibility, and booking:
- if the student or child has a concrete `grade_level_id`, the backend may match rows where `grade_level_id = student.grade_level_id` or `grade_level_id IS NULL`
- if the student or child has `grade_level_id = null`, the backend may match only rows where `grade_level_id IS NULL`
- `student.grade_level_id = null` or `child.grade_level_id = null` MUST NOT be interpreted as a wildcard that matches all grade-specific rows within the stage

This rule applies to both `subject_availability` and slot-offering rows such as `teacher_schedule_subjects` / `v_teacher_slot_offerings`.

## 4. Data contracts and normalization

### Schedule contract
- canonical weekday model = `1..7`
- canonical keys = `weekday`, `start_time`, `end_time`, `is_group`, `max_students`, `is_active`

### Catalog contract
- grade catalog must expose systems, stages, levels
- stages/levels should expose both `nameEn` and `nameAr`
- lookup endpoints required for registration must be public

### Student academic contract
- student academic scope must be normalized on `students`
- direct student registration should submit normalized scope directly
- discovery, selection, and booking must not reconstruct scope from UI labels or ad hoc string matching

## 5. Mutation standards

### General
All state-changing handlers should:
- validate inputs before DB writes
- use transaction boundaries where race conditions matter
- stamp actor fields when schema supports it
- avoid writing columns not present in the real schema

### Lesson-session mutations
Lesson-session status changes should use only schema-real fields such as:
- `status`
- `cancelled_by`
- `cancel_reason`
- `updated_by_user_id`

### Identity mutations
Parent-led child creation should:
- create all required rows in one atomic unit where possible
- avoid partial success where a linkage row exists without a linked student identity
- set child login capability explicitly when the product distinguishes linked identity vs direct login

Direct student self-registration should:
- create `users(role=student)` and `students(user_id=...)` atomically
- store normalized scope on `students`
- avoid creating `parent_students` rows
- treat legacy scope labels only as temporary compatibility input

## 6. Discovery and booking standards

### Discovery
Teacher discovery must be based on:
- academic-scope compatibility
- active live offerings

It must not rely only on broad teacher-subject capability when the booking engine already depends on slot offerings.

### Selection
Teacher selection writes must use the same eligibility rule as discovery reads.

### Booking
Booking must validate:
- active student context
- normalized academic scope
- active selection
- slot ownership/activity
- academic-scope offering fit
- future time
- overlap protection

## 7. Ratings standards

Ratings must be:
- session-scoped
- uniquely constrained one per session
- actor-owned
- hidden-aware for aggregates
- editable only in bounded window

## 8. Public vs protected endpoint rules

### Public
- registration page lookups (`/meta/grade-catalog`, `/subjects`)
- login/register endpoints
- direct student registration entry-point data
- parent registration entry-point data

### Protected
- teacher operational APIs
- parent/student owned data
- all state-changing actions outside registration

## 9. Engineering quality rules

- Avoid duplicate business-rule implementations across controllers.
- Prefer shared helpers for academic scope and schedule normalization.
- Prefer stable envelope shapes to reduce FE/BE drift.
- Add small compatibility shims only when migrating, and remove them after convergence.
- Keep improvements close to current implementation unless a real defect demands a stronger change.
- Do not leave parent registration, child creation, child login-capability behavior, or direct student registration behavior implicit; document the rule explicitly in code and docs.
