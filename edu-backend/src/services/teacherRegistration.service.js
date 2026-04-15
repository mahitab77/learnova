import { hashPassword } from "../utils/password.js";
import { normalizeIncomingScheduleRow } from "../utils/scheduleContract.js";

function timeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const cleanTime = timeStr.trim();
  const parts = cleanTime.split(":");
  if (parts.length < 2 || parts.length > 3) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const seconds = parts.length === 3 ? parseInt(parts[2], 10) || 0 : 0;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return 0;
  }
  return hours * 3600 + minutes * 60 + seconds;
}

function validateSchedule(schedule, rawSchedule = schedule) {
  const errors = [];
  if (schedule.weekday == null) errors.push(`Invalid weekday: ${rawSchedule?.weekday}`);
  if (!schedule.start_time) {
    errors.push(`Invalid start_time format: ${rawSchedule?.start_time ?? rawSchedule?.startTime}`);
  }
  if (!schedule.end_time) {
    errors.push(`Invalid end_time format: ${rawSchedule?.end_time ?? rawSchedule?.endTime}`);
  }
  if (schedule.start_time && schedule.end_time) {
    const startSeconds = timeToSeconds(schedule.start_time);
    const endSeconds = timeToSeconds(schedule.end_time);
    if (startSeconds >= endSeconds) {
      errors.push(`end_time (${schedule.end_time}) must be after start_time (${schedule.start_time})`);
    }
  }
  if (Number(schedule.is_group) === 1 && (schedule.max_students == null || Number(schedule.max_students) < 2)) {
    errors.push("Group sessions must have max_students >= 2");
  }
  return errors.length > 0 ? errors : null;
}

export class TeacherRegistrationError extends Error {
  constructor(message, { status = 400, code = "TEACHER_REGISTRATION_ERROR", errors } = {}) {
    super(message);
    this.name = "TeacherRegistrationError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export function normalizeAndValidateTeacherRegistrationInput(payload, { normalizeEmail, validatePassword }) {
  const {
    fullName,
    email,
    password,
    preferredLang,
    phone,
    nationality,
    dateOfBirth,
    gender,
    photoUrl,
    yearsOfExperience,
    highestQualification,
    university,
    specialization,
    currentOccupation,
    teachingStyle,
    hourlyRate,
    teachingPhilosophy,
    achievements,
    bio,
    referencesText,
    educationSystemId,
    gradeLevelIds,
    subjectIds,
    schedules,
  } = payload || {};

  if (!fullName || !email || !password) {
    throw new TeacherRegistrationError("fullName, email and password are required.");
  }
  const pwErr = validatePassword(password);
  if (pwErr) throw new TeacherRegistrationError(pwErr);
  if (!phone || !nationality || !dateOfBirth) {
    throw new TeacherRegistrationError("phone, nationality, and dateOfBirth are required.");
  }
  if (yearsOfExperience == null || !highestQualification) {
    throw new TeacherRegistrationError("yearsOfExperience and highestQualification are required.");
  }
  if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
    throw new TeacherRegistrationError("At least one subjectId is required.");
  }
  if (!Array.isArray(gradeLevelIds) || gradeLevelIds.length === 0) {
    throw new TeacherRegistrationError("At least one gradeLevelId is required.");
  }
  if (!Array.isArray(schedules) || schedules.length === 0) {
    throw new TeacherRegistrationError("At least one schedule slot is required.");
  }

  const cleanEmail = normalizeEmail(email);
  const lang = preferredLang === "en" ? "en" : "ar";
  const cleanSubjectIds = subjectIds.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
  const cleanGradeLevelIds = gradeLevelIds
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (cleanSubjectIds.length === 0) {
    throw new TeacherRegistrationError(
      "No valid subject IDs provided. Please check your subject selections."
    );
  }
  if (cleanGradeLevelIds.length === 0) {
    throw new TeacherRegistrationError(
      "No valid grade level IDs provided. Please check your grade level selections."
    );
  }

  const scheduleErrors = [];
  const cleanSchedules = [];
  for (const s of schedules) {
    const schedule = normalizeIncomingScheduleRow(s);
    const errors = validateSchedule(schedule, s);
    if (errors) scheduleErrors.push(...errors);
    else cleanSchedules.push(schedule);
  }
  if (scheduleErrors.length > 0) {
    throw new TeacherRegistrationError("Schedule validation failed", {
      errors: scheduleErrors,
    });
  }
  if (cleanSchedules.length === 0) {
    throw new TeacherRegistrationError("No valid schedules provided.");
  }

  return {
    fullName,
    email: cleanEmail,
    password,
    lang,
    phone,
    nationality,
    dateOfBirth,
    gender,
    photoUrl,
    yearsOfExperience,
    highestQualification,
    university,
    specialization,
    currentOccupation,
    teachingStyle,
    hourlyRate,
    teachingPhilosophy,
    achievements,
    bio,
    referencesText,
    educationSystemId,
    cleanSubjectIds,
    cleanGradeLevelIds,
    cleanSchedules,
  };
}

export async function createTeacherIdentityAndProfile(conn, normalizedInput, uploadedUrls) {
  const [existing] = await conn.query("SELECT id FROM users WHERE email = ? LIMIT 1", [
    normalizedInput.email,
  ]);
  if (existing.length > 0) {
    throw new TeacherRegistrationError("Email already registered.", {
      status: 409,
      code: "EMAIL_ALREADY_EXISTS",
    });
  }

  const passwordHash = await hashPassword(normalizedInput.password);
  const [userResult] = await conn.query(
    `
      INSERT INTO users (full_name, email, password_hash, role, preferred_lang, is_active)
      VALUES (?, ?, ?, 'teacher', ?, 1)
      `,
    [normalizedInput.fullName, normalizedInput.email, passwordHash, normalizedInput.lang]
  );
  const userId = userResult.insertId;

  const [teacherResult] = await conn.query(
    `
      INSERT INTO teachers (
        user_id, name, bio_short, gender, photo_url, is_active, status,
        years_of_experience, highest_qualification, hourly_rate,
        teaching_philosophy, achievements,
        phone, nationality, date_of_birth, university, specialization, current_occupation,
        teaching_style, bio_long, references_text, education_system_id
      )
      VALUES (
        ?, ?, NULL, ?, ?, 1, 'pending_review',
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
      `,
    [
      userId,
      normalizedInput.fullName,
      normalizedInput.gender || null,
      normalizedInput.photoUrl || null,
      String(normalizedInput.yearsOfExperience),
      String(normalizedInput.highestQualification),
      normalizedInput.hourlyRate != null ? String(normalizedInput.hourlyRate) : null,
      normalizedInput.teachingPhilosophy || null,
      normalizedInput.achievements || null,
      String(normalizedInput.phone),
      String(normalizedInput.nationality),
      normalizedInput.dateOfBirth,
      normalizedInput.university || null,
      normalizedInput.specialization || null,
      normalizedInput.currentOccupation || null,
      normalizedInput.teachingStyle || null,
      normalizedInput.bio || null,
      normalizedInput.referencesText || null,
      normalizedInput.educationSystemId ? Number(normalizedInput.educationSystemId) : null,
    ]
  );
  const teacherId = teacherResult.insertId;

  const subjectValues = normalizedInput.cleanSubjectIds.map(() => "(?, ?)").join(", ");
  const subjectParams = [];
  normalizedInput.cleanSubjectIds.forEach((sid) => subjectParams.push(teacherId, sid));
  await conn.query(`INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ${subjectValues}`, subjectParams);

  const gradeValues = normalizedInput.cleanGradeLevelIds.map(() => "(?, ?)").join(", ");
  const gradeParams = [];
  normalizedInput.cleanGradeLevelIds.forEach((gid) => gradeParams.push(teacherId, gid));
  await conn.query(
    `INSERT INTO teacher_grade_levels (teacher_id, grade_level_id) VALUES ${gradeValues}`,
    gradeParams
  );

  const scheduleValues = normalizedInput.cleanSchedules.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
  const scheduleParams = [];
  normalizedInput.cleanSchedules.forEach((s) =>
    scheduleParams.push(
      teacherId,
      s.weekday,
      s.start_time,
      s.end_time,
      s.is_group,
      s.max_students,
      s.is_active
    )
  );
  await conn.query(
    `
      INSERT INTO teacher_schedules (teacher_id, weekday, start_time, end_time, is_group, max_students, is_active)
      VALUES ${scheduleValues}
      `,
    scheduleParams
  );

  if (uploadedUrls.length > 0) {
    const videoValues = uploadedUrls.map(() => "(?, NULL, ?, ?)").join(", ");
    const videoParams = [];
    uploadedUrls.forEach((url, idx) => videoParams.push(teacherId, url, idx === 0 ? 1 : 0));
    await conn.query(
      `
        INSERT INTO teacher_videos (teacher_id, subject_id, video_url, is_primary)
        VALUES ${videoValues}
        `,
      videoParams
    );
  }

  return { userId, teacherId };
}
