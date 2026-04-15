-- Generated schema snapshot
-- Database: edu_platform
-- Generated at: 2026-04-15T14:49:14.525Z

-- announcements
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `audience` enum('all','students','parents','teachers') NOT NULL DEFAULT '''all''',
  `created_by` int(11) NULL DEFAULT 'NULL',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  PRIMARY KEY (`id`)
);

-- billing_events
DROP TABLE IF EXISTS `billing_events`;
CREATE TABLE `billing_events` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `payment_id` bigint(20) NOT NULL,
  `refund_id` bigint(20) NULL DEFAULT 'NULL',
  `event_type` varchar(80) NOT NULL,
  `actor_user_id` int(11) NULL DEFAULT 'NULL',
  `payload` longtext NULL DEFAULT 'NULL',
  `created_at` datetime NOT NULL DEFAULT 'current_timestamp()',
  KEY `idx_billing_events_actor_user_id` (`actor_user_id`),
  KEY `idx_billing_events_actor_user_id_2` (`actor_user_id`),
  KEY `idx_billing_events_created_at` (`created_at`),
  KEY `idx_billing_events_created_at_2` (`created_at`),
  KEY `idx_billing_events_event_type` (`event_type`),
  KEY `idx_billing_events_event_type_2` (`event_type`),
  KEY `idx_billing_events_payment_id` (`payment_id`),
  KEY `idx_billing_events_payment_id_2` (`payment_id`),
  KEY `idx_billing_events_refund_id` (`refund_id`),
  KEY `idx_billing_events_refund_id_2` (`refund_id`),
  PRIMARY KEY (`id`)
);

-- educational_systems
DROP TABLE IF EXISTS `educational_systems`;
CREATE TABLE `educational_systems` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) NOT NULL,
  `is_active` tinyint(1) NULL DEFAULT '1',
  `sort_order` int(11) NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  UNIQUE KEY `code` (`code`),
  PRIMARY KEY (`id`)
);

-- grade_levels
DROP TABLE IF EXISTS `grade_levels`;
CREATE TABLE `grade_levels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stage_id` int(11) NOT NULL,
  `name_en` varchar(100) NOT NULL,
  `name_ar` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `sort_order` int(11) NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_stage_grade` (`stage_id`, `code`)
);

-- grade_stages
DROP TABLE IF EXISTS `grade_stages`;
CREATE TABLE `grade_stages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `system_id` int(11) NOT NULL,
  `name_en` varchar(100) NOT NULL,
  `name_ar` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `sort_order` int(11) NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_system_stage` (`system_id`, `code`)
);

-- homework_assignments
DROP TABLE IF EXISTS `homework_assignments`;
CREATE TABLE `homework_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NULL DEFAULT 'NULL',
  `due_at` datetime NOT NULL,
  `max_score` int(11) NULL DEFAULT 'NULL',
  `attachments_url` varchar(255) NULL DEFAULT 'NULL',
  `is_active` tinyint(1) NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  KEY `idx_homework_subject` (`subject_id`),
  KEY `idx_homework_teacher` (`teacher_id`),
  PRIMARY KEY (`id`)
);

-- homework_submissions
DROP TABLE IF EXISTS `homework_submissions`;
CREATE TABLE `homework_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `homework_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submitted_at` datetime NULL DEFAULT 'NULL',
  `answer_text` text NULL DEFAULT 'NULL',
  `attachment_url` varchar(255) NULL DEFAULT 'NULL',
  `score` decimal(5,2) NULL DEFAULT 'NULL',
  `feedback` text NULL DEFAULT 'NULL',
  `status` enum('not_started','submitted','graded','late') NULL DEFAULT '''not_started''',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  KEY `idx_homework_submissions_student` (`student_id`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_homework_student` (`homework_id`, `student_id`),
  UNIQUE KEY `uq_hw_student` (`homework_id`, `student_id`)
);

-- lesson_sessions
DROP TABLE IF EXISTS `lesson_sessions`;
CREATE TABLE `lesson_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `system_id` int(11) NULL DEFAULT 'NULL',
  `stage_id` int(11) NULL DEFAULT 'NULL',
  `grade_level_id` int(11) NULL DEFAULT 'NULL',
  `schedule_id` int(11) NULL DEFAULT 'NULL',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `is_group` tinyint(1) NOT NULL DEFAULT '0',
  `max_students` int(11) NULL DEFAULT 'NULL',
  `created_by_user_id` int(11) NOT NULL,
  `updated_by_user_id` int(11) NULL DEFAULT 'NULL',
  `student_id` int(11) NULL DEFAULT 'NULL',
  `status` enum('pending','scheduled','approved','rejected','completed','cancelled','no_show') NOT NULL DEFAULT '''pending''',
  `cancelled_by` enum('student','teacher','parent','admin','system') NULL DEFAULT 'NULL',
  `cancel_reason` varchar(255) NULL DEFAULT 'NULL',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  `exception_id` int(11) NULL DEFAULT 'NULL',
  `cancelled_at` datetime NULL DEFAULT 'NULL',
  `zoom_meeting_id` varchar(64) NULL DEFAULT 'NULL',
  `zoom_password` varchar(128) NULL DEFAULT 'NULL',
  `youtube_video_id` varchar(32) NULL DEFAULT 'NULL',
  KEY `fk_lesson_sessions_updated_by` (`updated_by_user_id`),
  KEY `fk_ls_grade_level` (`grade_level_id`),
  KEY `fk_ls_schedule` (`schedule_id`),
  KEY `fk_ls_stage` (`stage_id`),
  KEY `idx_lesson_sessions_starts` (`starts_at`, `id`),
  KEY `idx_lesson_sessions_status_created` (`status`, `created_at`, `id`),
  KEY `idx_lesson_sessions_status_starts_at` (`status`, `starts_at`),
  KEY `idx_lesson_sessions_student` (`student_id`),
  KEY `idx_lesson_sessions_student_starts_at` (`student_id`, `starts_at`),
  KEY `idx_lesson_sessions_student_status_starts` (`student_id`, `status`, `starts_at`),
  KEY `idx_lesson_sessions_teacher_starts_at` (`teacher_id`, `starts_at`),
  KEY `idx_lesson_sessions_teacher_status_starts_ends` (`teacher_id`, `status`, `starts_at`, `ends_at`),
  KEY `idx_lesson_sessions_teacher_time` (`teacher_id`, `starts_at`, `ends_at`, `status`),
  KEY `idx_ls_created_by_user` (`created_by_user_id`),
  KEY `idx_ls_scope_time` (`system_id`, `stage_id`, `grade_level_id`, `starts_at`),
  KEY `idx_ls_teacher_scope_time` (`teacher_id`, `system_id`, `stage_id`, `grade_level_id`, `starts_at`),
  KEY `idx_ls_teacher_time_range` (`teacher_id`, `starts_at`, `ends_at`),
  KEY `idx_sessions_exception` (`exception_id`),
  KEY `idx_sessions_subject_time` (`subject_id`, `starts_at`),
  KEY `idx_sessions_teacher_end` (`teacher_id`, `ends_at`),
  KEY `idx_sessions_teacher_time` (`teacher_id`, `starts_at`),
  KEY `ix_lesson_sessions_createdby_status_start` (`created_by_user_id`, `status`, `starts_at`),
  KEY `ix_lesson_sessions_teacher_status_start` (`teacher_id`, `status`, `starts_at`),
  KEY `ix_lesson_sessions_teacher_time` (`teacher_id`, `starts_at`, `ends_at`),
  PRIMARY KEY (`id`)
);

-- lesson_session_students
DROP TABLE IF EXISTS `lesson_session_students`;
CREATE TABLE `lesson_session_students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `attendance_status` enum('scheduled','present','absent','late','excused') NOT NULL DEFAULT '''scheduled''',
  `joined_at` datetime NULL DEFAULT 'NULL',
  `left_at` datetime NULL DEFAULT 'NULL',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  KEY `idx_lesson_session_students_session_id` (`session_id`),
  KEY `idx_lss_student_session` (`student_id`, `session_id`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_session_student` (`session_id`, `student_id`),
  UNIQUE KEY `uq_lesson_session_students_session_student` (`session_id`, `student_id`),
  UNIQUE KEY `uq_lss_session_student` (`session_id`, `student_id`),
  UNIQUE KEY `uq_session_student` (`session_id`, `student_id`)
);

-- notifications
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('homework_due','quiz_due','grade_posted','announcement','system') NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NULL DEFAULT 'NULL',
  `related_type` enum('homework','quiz','announcement','subject','teacher','lesson_session','other') NULL DEFAULT 'NULL',
  `related_id` int(11) NULL DEFAULT 'NULL',
  `extra_data` text NULL DEFAULT 'NULL',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime NULL DEFAULT 'NULL',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  KEY `idx_notifications_user` (`user_id`, `is_read`, `created_at`),
  KEY `idx_notifications_user_read_created` (`user_id`, `is_read`, `created_at`),
  KEY `ix_notifications_user_read_created` (`user_id`, `is_read`, `created_at`),
  PRIMARY KEY (`id`)
);

-- parents
DROP TABLE IF EXISTS `parents`;
CREATE TABLE `parents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `phone` varchar(50) NULL DEFAULT 'NULL',
  `notes` text NULL DEFAULT 'NULL',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
);

-- parent_change_requests
DROP TABLE IF EXISTS `parent_change_requests`;
CREATE TABLE `parent_change_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `current_teacher_id` int(11) NULL DEFAULT 'NULL',
  `requested_teacher_id` int(11) NULL DEFAULT 'NULL',
  `reason_text` text NULL DEFAULT 'NULL',
  `status` enum('pending','approved','rejected') NULL DEFAULT '''pending''',
  `admin_id` int(11) NULL DEFAULT 'NULL',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  `processed_at` timestamp NULL DEFAULT 'NULL',
  KEY `admin_id` (`admin_id`),
  KEY `current_teacher_id` (`current_teacher_id`),
  KEY `fk_parent_change_subject` (`subject_id`),
  KEY `idx_parent_change_requests_parent_created_status` (`parent_id`, `created_at`, `status`),
  KEY `idx_pcr_created_at` (`created_at`, `id`),
  KEY `idx_pcr_requested_teacher_id` (`requested_teacher_id`),
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`)
);

-- parent_students
DROP TABLE IF EXISTS `parent_students`;
CREATE TABLE `parent_students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `relationship` enum('mother','father','guardian') NULL DEFAULT '''mother''',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  `has_own_login` tinyint(1) NOT NULL DEFAULT '0',
  KEY `fk_parent_students_student` (`student_id`),
  KEY `idx_parent_students_created` (`created_at`, `id`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_parent_students_parent_student` (`parent_id`, `student_id`)
);

-- password_reset_otps
DROP TABLE IF EXISTS `password_reset_otps`;
CREATE TABLE `password_reset_otps` (
  `otp_id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `code_hash` char(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT 'current_timestamp()',
  KEY `idx_password_reset_otps_email` (`email`),
  KEY `idx_password_reset_otps_expires_at` (`expires_at`),
  KEY `idx_password_reset_otps_user_id` (`user_id`),
  PRIMARY KEY (`otp_id`),
  CONSTRAINT `fk_password_reset_otps_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE RESTRICT ON DELETE CASCADE
);

-- payments
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NULL DEFAULT 'NULL',
  `payer_user_id` int(11) NOT NULL,
  `amount_cents` int(10) unsigned NOT NULL,
  `currency` char(3) NOT NULL DEFAULT '''EGP''',
  `status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT '''pending''',
  `gateway` varchar(50) NULL DEFAULT 'NULL',
  `gateway_payment_id` varchar(255) NULL DEFAULT 'NULL',
  `gateway_response` longtext NULL DEFAULT 'NULL',
  `paid_at` datetime NULL DEFAULT 'NULL',
  `failed_at` datetime NULL DEFAULT 'NULL',
  `created_at` datetime NOT NULL DEFAULT 'current_timestamp()',
  `updated_at` datetime NOT NULL DEFAULT 'current_timestamp()' ON UPDATE CURRENT_TIMESTAMP(),
  KEY `idx_payments_created_at` (`created_at`),
  KEY `idx_payments_created_at_2` (`created_at`),
  KEY `idx_payments_payer_user_id` (`payer_user_id`),
  KEY `idx_payments_payer_user_id_2` (`payer_user_id`),
  KEY `idx_payments_session_id` (`session_id`),
  KEY `idx_payments_status` (`status`),
  KEY `idx_payments_status_2` (`status`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_session_id` (`session_id`)
);

-- quiz_assignments
DROP TABLE IF EXISTS `quiz_assignments`;
CREATE TABLE `quiz_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NULL DEFAULT 'NULL',
  `available_from` datetime NULL DEFAULT 'NULL',
  `available_until` datetime NULL DEFAULT 'NULL',
  `time_limit_min` int(11) NULL DEFAULT 'NULL',
  `max_score` int(11) NULL DEFAULT 'NULL',
  `is_active` tinyint(1) NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  KEY `idx_quiz_subject` (`subject_id`),
  KEY `idx_quiz_teacher` (`teacher_id`),
  PRIMARY KEY (`id`)
);

-- quiz_submissions
DROP TABLE IF EXISTS `quiz_submissions`;
CREATE TABLE `quiz_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quiz_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `started_at` datetime NULL DEFAULT 'NULL',
  `submitted_at` datetime NULL DEFAULT 'NULL',
  `score` decimal(5,2) NULL DEFAULT 'NULL',
  `status` enum('not_started','in_progress','submitted','graded','late') NULL DEFAULT '''not_started''',
  `answers_json` text NULL DEFAULT 'NULL',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  KEY `idx_quiz_submissions_student` (`student_id`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quiz_student` (`quiz_id`, `student_id`)
);

-- refunds
DROP TABLE IF EXISTS `refunds`;
CREATE TABLE `refunds` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `payment_id` bigint(20) NOT NULL,
  `requested_by_user_id` int(11) NOT NULL,
  `amount_cents` int(10) unsigned NOT NULL,
  `reason` text NULL DEFAULT 'NULL',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT '''pending''',
  `gateway_refund_id` varchar(255) NULL DEFAULT 'NULL',
  `resolved_by_user_id` int(11) NULL DEFAULT 'NULL',
  `resolved_at` datetime NULL DEFAULT 'NULL',
  `created_at` datetime NOT NULL DEFAULT 'current_timestamp()',
  `updated_at` datetime NOT NULL DEFAULT 'current_timestamp()' ON UPDATE CURRENT_TIMESTAMP(),
  KEY `idx_refunds_payment_id` (`payment_id`),
  KEY `idx_refunds_payment_id_2` (`payment_id`),
  KEY `idx_refunds_requested_by_user_id` (`requested_by_user_id`),
  KEY `idx_refunds_requested_by_user_id_2` (`requested_by_user_id`),
  KEY `idx_refunds_resolved_by_user_id` (`resolved_by_user_id`),
  KEY `idx_refunds_resolved_by_user_id_2` (`resolved_by_user_id`),
  KEY `idx_refunds_status` (`status`),
  KEY `idx_refunds_status_2` (`status`),
  PRIMARY KEY (`id`)
);

-- schema_migrations
DROP TABLE IF EXISTS `schema_migrations`;
CREATE TABLE `schema_migrations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(191) NOT NULL,
  `applied_at` datetime NOT NULL DEFAULT 'current_timestamp()',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_schema_migrations_name` (`migration_name`)
);

-- settings
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `config_key` varchar(100) NOT NULL,
  `config_json` text NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT 'current_timestamp()' ON UPDATE CURRENT_TIMESTAMP(),
  PRIMARY KEY (`config_key`),
  UNIQUE KEY `uq_settings_config_key` (`config_key`)
);

-- students
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `grade_stage` varchar(50) NULL DEFAULT 'NULL',
  `grade_number` int(11) NULL DEFAULT 'NULL',
  `gender` enum('male','female') NULL DEFAULT 'NULL',
  `onboarding_completed` tinyint(1) NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  `system_id` int(11) NULL DEFAULT 'NULL',
  `stage_id` int(11) NULL DEFAULT 'NULL',
  `grade_level_id` int(11) NULL DEFAULT 'NULL',
  KEY `fk_students_grade_level` (`grade_level_id`),
  KEY `fk_students_stage` (`stage_id`),
  KEY `fk_students_system` (`system_id`),
  KEY `fk_students_user_ref_final` (`user_id`),
  PRIMARY KEY (`id`)
);

-- student_scope_backfill_map
DROP TABLE IF EXISTS `student_scope_backfill_map`;
CREATE TABLE `student_scope_backfill_map` (
  `legacy_grade_stage` varchar(50) NOT NULL,
  `legacy_grade_number` int(11) NOT NULL,
  `system_id` int(11) NOT NULL,
  `stage_id` int(11) NOT NULL,
  `grade_level_id` int(11) NULL DEFAULT 'NULL',
  `notes` varchar(255) NULL DEFAULT 'NULL',
  KEY `idx_student_scope_backfill_grade_level` (`grade_level_id`),
  KEY `idx_student_scope_backfill_stage` (`stage_id`),
  KEY `idx_student_scope_backfill_system` (`system_id`),
  PRIMARY KEY (`legacy_grade_stage`, `legacy_grade_number`)
);

-- student_subjects
DROP TABLE IF EXISTS `student_subjects`;
CREATE TABLE `student_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  KEY `idx_student_subjects_student` (`student_id`),
  KEY `idx_student_subjects_subject` (`subject_id`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_student_subject` (`student_id`, `subject_id`),
  UNIQUE KEY `uq_student_subject` (`student_id`, `subject_id`),
  UNIQUE KEY `uq_student_subjects_student_subject` (`student_id`, `subject_id`)
);

-- student_teacher_selections
DROP TABLE IF EXISTS `student_teacher_selections`;
CREATE TABLE `student_teacher_selections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `selected_by` enum('student','parent','admin') NULL DEFAULT '''student''',
  `status` enum('active','pending_change','replaced') NULL DEFAULT '''active''',
  `selected_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  KEY `fk_sts_subject` (`subject_id`),
  KEY `fk_sts_teacher` (`teacher_id`),
  KEY `idx_sts_status_teacher_subject` (`status`, `teacher_id`, `subject_id`),
  KEY `idx_sts_student_status` (`student_id`, `status`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_student_subject` (`student_id`, `subject_id`),
  UNIQUE KEY `uq_student_teacher_selection` (`student_id`, `subject_id`)
);

-- subjects
DROP TABLE IF EXISTS `subjects`;
CREATE TABLE `subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name_en` varchar(200) NOT NULL,
  `name_ar` varchar(200) NOT NULL,
  `description_en` text NULL DEFAULT 'NULL',
  `description_ar` text NULL DEFAULT 'NULL',
  `is_active` tinyint(1) NULL DEFAULT '1',
  `sort_order` int(11) NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  PRIMARY KEY (`id`)
);

-- subject_availability
DROP TABLE IF EXISTS `subject_availability`;
CREATE TABLE `subject_availability` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_id` int(11) NOT NULL,
  `system_id` int(11) NOT NULL,
  `stage_id` int(11) NOT NULL,
  `grade_level_id` int(11) NULL DEFAULT 'NULL',
  `is_core` tinyint(1) NULL DEFAULT '1',
  `is_active` tinyint(1) NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  `grade_level_id_u` int(11) NULL DEFAULT 'NULL' STORED GENERATED,
  KEY `grade_level_id` (`grade_level_id`),
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  KEY `system_id` (`system_id`),
  UNIQUE KEY `unique_subject_availability` (`subject_id`, `system_id`, `stage_id`, `grade_level_id`),
  UNIQUE KEY `uq_availability` (`subject_id`, `system_id`, `stage_id`, `grade_level_id_u`),
  UNIQUE KEY `uq_subject_avail` (`subject_id`, `system_id`, `stage_id`, `grade_level_id_u`),
  UNIQUE KEY `uq_subject_availability_scope` (`subject_id`, `system_id`, `stage_id`, `grade_level_id_u`)
);

-- teachers
DROP TABLE IF EXISTS `teachers`;
CREATE TABLE `teachers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NULL DEFAULT 'NULL',
  `name` varchar(150) NOT NULL,
  `bio_short` varchar(255) NULL DEFAULT 'NULL',
  `gender` enum('male','female') NULL DEFAULT 'NULL',
  `photo_url` varchar(255) NULL DEFAULT 'NULL',
  `is_active` tinyint(1) NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  `status` enum('pending_review','approved','rejected') NOT NULL DEFAULT '''pending_review''',
  `max_capacity` int(11) NULL DEFAULT 'NULL',
  `approval_notes` text NULL DEFAULT 'NULL',
  `phone` varchar(50) NULL DEFAULT 'NULL',
  `nationality` varchar(100) NULL DEFAULT 'NULL',
  `date_of_birth` date NULL DEFAULT 'NULL',
  `university` varchar(150) NULL DEFAULT 'NULL',
  `specialization` varchar(150) NULL DEFAULT 'NULL',
  `current_occupation` varchar(150) NULL DEFAULT 'NULL',
  `teaching_style` text NULL DEFAULT 'NULL',
  `bio_long` text NULL DEFAULT 'NULL',
  `references_text` text NULL DEFAULT 'NULL',
  `education_system_id` int(11) NULL DEFAULT 'NULL',
  `years_of_experience` varchar(50) NULL DEFAULT 'NULL',
  `highest_qualification` varchar(100) NULL DEFAULT 'NULL',
  `hourly_rate` varchar(50) NULL DEFAULT 'NULL',
  `teaching_philosophy` text NULL DEFAULT 'NULL',
  `achievements` text NULL DEFAULT 'NULL',
  KEY `fk_teachers_education_system` (`education_system_id`),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
);

-- teacher_grade_levels
DROP TABLE IF EXISTS `teacher_grade_levels`;
CREATE TABLE `teacher_grade_levels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `grade_level_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  KEY `idx_tgl_grade` (`grade_level_id`),
  KEY `idx_tgl_teacher` (`teacher_id`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teacher_grade` (`teacher_id`, `grade_level_id`),
  UNIQUE KEY `uq_teacher_grade_level` (`teacher_id`, `grade_level_id`)
);

-- teacher_ratings
DROP TABLE IF EXISTS `teacher_ratings`;
CREATE TABLE `teacher_ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `student_id` int(11) NULL DEFAULT 'NULL',
  `parent_id` int(11) NULL DEFAULT 'NULL',
  `stars` tinyint(4) NOT NULL,
  `comment` text NULL DEFAULT 'NULL',
  `is_hidden` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  `updated_at` timestamp NOT NULL DEFAULT 'current_timestamp()' ON UPDATE CURRENT_TIMESTAMP(),
  KEY `idx_teacher_ratings_hidden` (`is_hidden`),
  KEY `idx_teacher_ratings_hidden_2` (`is_hidden`),
  KEY `idx_teacher_ratings_parent` (`parent_id`),
  KEY `idx_teacher_ratings_parent_id_2` (`parent_id`),
  KEY `idx_teacher_ratings_student` (`student_id`),
  KEY `idx_teacher_ratings_student_id_2` (`student_id`),
  KEY `idx_teacher_ratings_teacher` (`teacher_id`),
  KEY `idx_teacher_ratings_teacher_id_2` (`teacher_id`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teacher_ratings_session` (`session_id`),
  UNIQUE KEY `uq_teacher_ratings_session_id` (`session_id`)
);

-- teacher_schedules
DROP TABLE IF EXISTS `teacher_schedules`;
CREATE TABLE `teacher_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `weekday` tinyint(4) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_group` tinyint(1) NOT NULL DEFAULT '0',
  `max_students` int(11) NULL DEFAULT 'NULL',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  `updated_at` timestamp NOT NULL DEFAULT 'current_timestamp()' ON UPDATE CURRENT_TIMESTAMP(),
  KEY `idx_teacher_schedules_teacher_weekday_time` (`teacher_id`, `weekday`, `start_time`),
  KEY `idx_ts_teacher_weekday_active` (`teacher_id`, `weekday`, `is_active`),
  KEY `idx_ts_teacher_weekday_end` (`teacher_id`, `weekday`, `end_time`),
  KEY `idx_ts_teacher_weekday_start` (`teacher_id`, `weekday`, `start_time`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teacher_slot` (`teacher_id`, `weekday`, `start_time`, `end_time`)
);

-- teacher_schedule_exceptions
DROP TABLE IF EXISTS `teacher_schedule_exceptions`;
CREATE TABLE `teacher_schedule_exceptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `exception_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `exception_type` enum('unavailable','extra_available') NOT NULL,
  `is_group` tinyint(1) NOT NULL DEFAULT '0',
  `max_students` int(11) NULL DEFAULT 'NULL',
  `note` varchar(255) NULL DEFAULT 'NULL',
  `created_by_user_id` int(11) NULL DEFAULT 'NULL',
  `reason` varchar(255) NULL DEFAULT 'NULL',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  `updated_at` timestamp NOT NULL DEFAULT 'current_timestamp()' ON UPDATE CURRENT_TIMESTAMP(),
  KEY `idx_teacher_schedule_exceptions_teacher_date_active_window` (`teacher_id`, `exception_date`, `is_active`, `start_time`, `end_time`),
  KEY `idx_tse_teacher_day_active_time` (`teacher_id`, `exception_date`, `is_active`, `start_time`, `end_time`),
  KEY `idx_tse_teacher_type_date_time` (`teacher_id`, `exception_type`, `is_active`, `exception_date`, `start_time`, `end_time`),
  KEY `ix_exceptions_teacher_date` (`teacher_id`, `exception_date`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tse_exact` (`teacher_id`, `exception_date`, `start_time`, `end_time`, `exception_type`)
);

-- teacher_schedule_subjects
DROP TABLE IF EXISTS `teacher_schedule_subjects`;
CREATE TABLE `teacher_schedule_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `system_id` int(11) NOT NULL,
  `stage_id` int(11) NOT NULL,
  `grade_level_id` int(11) NULL DEFAULT 'NULL',
  `grade_level_id_u` int(11) NULL DEFAULT 'NULL' STORED GENERATED,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  `updated_at` timestamp NOT NULL DEFAULT 'current_timestamp()' ON UPDATE CURRENT_TIMESTAMP(),
  KEY `fk_tss_grade_level` (`grade_level_id`),
  KEY `fk_tss_stage` (`stage_id`),
  KEY `idx_tss_schedule` (`schedule_id`),
  KEY `idx_tss_schedule_active` (`schedule_id`, `is_active`),
  KEY `idx_tss_scope` (`system_id`, `stage_id`, `grade_level_id`),
  KEY `idx_tss_scope_lookup` (`subject_id`, `system_id`, `stage_id`, `grade_level_id_u`, `is_active`, `schedule_id`),
  KEY `idx_tss_subject` (`subject_id`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_offering` (`schedule_id`, `subject_id`, `system_id`, `stage_id`, `grade_level_id_u`),
  UNIQUE KEY `uq_schedule_subject_scope` (`schedule_id`, `subject_id`, `system_id`, `stage_id`, `grade_level_id_u`),
  UNIQUE KEY `uq_teacher_schedule_subjects_scope` (`schedule_id`, `subject_id`, `system_id`, `stage_id`, `grade_level_id_u`),
  UNIQUE KEY `uq_tss_offering` (`schedule_id`, `subject_id`, `system_id`, `stage_id`, `grade_level_id_u`),
  UNIQUE KEY `uq_tss_scope` (`schedule_id`, `subject_id`, `system_id`, `stage_id`, `grade_level_id_u`),
  UNIQUE KEY `uq_tss_slot_scope` (`schedule_id`, `subject_id`, `system_id`, `stage_id`, `grade_level_id_u`)
);

-- teacher_subjects
DROP TABLE IF EXISTS `teacher_subjects`;
CREATE TABLE `teacher_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  `priority` int(11) NOT NULL DEFAULT '0',
  KEY `idx_subject` (`subject_id`),
  KEY `idx_teacher` (`teacher_id`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teacher_subject` (`teacher_id`, `subject_id`),
  UNIQUE KEY `uq_teacher_subjects_teacher_subject` (`teacher_id`, `subject_id`)
);

-- teacher_videos
DROP TABLE IF EXISTS `teacher_videos`;
CREATE TABLE `teacher_videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `subject_id` int(11) NULL DEFAULT 'NULL',
  `video_url` varchar(255) NOT NULL,
  `is_primary` tinyint(1) NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  PRIMARY KEY (`id`),
  KEY `subject_id` (`subject_id`),
  KEY `teacher_id` (`teacher_id`)
);

-- users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NULL DEFAULT 'NULL',
  `password_hash` varchar(255) NOT NULL,
  `role` enum('student','parent','admin','teacher') NOT NULL DEFAULT '''student''',
  `preferred_lang` varchar(5) NULL DEFAULT '''ar''',
  `is_active` tinyint(1) NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
  UNIQUE KEY `email` (`email`),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
);
