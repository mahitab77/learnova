// src/controllers/auth.controller.js
// ============================================================================
// Auth Controller (PRODUCTION-READY / SESSION-COOKIE AUTH) 
// ----------------------------------------------------------------------------

// 1. Schedule time comparison uses seconds (not string compare)
// 2. Cleaned up redundant maxStudents check
// 3. Enforce non-empty subjectIds/gradeLevelIds after cleaning
// 4. Teacher login checks teachers.is_active
// 5. OTP cleanup removes old OTPs for same email
// 6. Consistent role normalization using safeRole()

// ============================================================================

import pool from "../db.js";
import { sendOtpEmail } from "../utils/email.js";
import {
  AcademicScopeValidationError,
} from "../utils/academicScope.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  AcademicScopeValidationError as RegistrationScopeError,
  IdentityRegistrationError,
  createParentWithChildrenIdentities,
  createStudentIdentity,
} from "../services/identityRegistration.service.js";
import {
  TeacherRegistrationError,
  createTeacherIdentityAndProfile,
  normalizeAndValidateTeacherRegistrationInput,
} from "../services/teacherRegistration.service.js";
import {
  getStudentDirectLoginPolicy,
  hashOtpCode,
  normalizeEmail,
  safeRole,
  sessionDestroy,
  sessionSave,
  setLoginSession,
  timingSafeEqualStr,
  validatePassword,
} from "./helpers/authSession.helpers.js";
import crypto from "crypto";
import fs from "fs";

// Import centralized session configuration
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "../config/session.js";

/**
 * Best-effort file cleanup for uploaded videos
 */
function cleanupUploadedFiles(files) {
  try {
    if (!Array.isArray(files) || files.length === 0) return;
    for (const f of files) {
      if (f?.path) {
        try {
          fs.unlinkSync(f.path);
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
}

// ============================================================================
// SESSION-BASED AUTH ENDPOINTS
// ============================================================================

/* ============================================================================
 * GET /auth/me
 * ========================================================================= */
export const me = async (req, res) => {
  const u = req.session?.user;
  const rawSwitchCtx = req.session?.switch_ctx;
  const switchContext =
    rawSwitchCtx &&
    rawSwitchCtx.mode === "as_student" &&
    Number.isFinite(Number(rawSwitchCtx.parent_user_id)) &&
    Number.isFinite(Number(rawSwitchCtx.student_user_id))
      ? {
          mode: "as_student",
          parentUserId: Number(rawSwitchCtx.parent_user_id),
          studentUserId: Number(rawSwitchCtx.student_user_id),
          switchedAt:
            typeof rawSwitchCtx.switched_at === "string" ? rawSwitchCtx.switched_at : null,
        }
      : null;

  if (!u?.id) {
    return res.status(200).json({
      success: true,
      data: {
        authenticated: false,
        user: null,
        meta: {},
        activeStudentId: null,
        switchContext: null,
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      authenticated: true,
      user: u,
      meta: req.session?.meta || {},
      activeStudentId: req.session?.activeStudentId ?? null,
      switchContext,
    },
  });
};


/* ============================================================================
 * POST /auth/register-student
 * ========================================================================= */
export const registerStudent = async (req, res) => {
  const {
    fullName,
    email,
    password,
    preferredLang,
  } = req.body || {};

  const normalizedFullName = String(fullName || "").trim();
  const cleanEmail = normalizeEmail(email);

  if (!normalizedFullName || !cleanEmail || !password) {
    return res.status(400).json({
      success: false,
      message: "fullName, email and password are required.",
    });
  }

  const pwErr = validatePassword(password);
  if (pwErr) {
    return res.status(400).json({ success: false, message: pwErr });
  }

  const studentLang = preferredLang === "en" ? "en" : "ar";

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const created = await createStudentIdentity(conn, {
      fullName: normalizedFullName,
      email,
      password,
      preferredLang,
      normalizeEmail,
      scopeInput: req.body || {},
    });

    await conn.commit();

    // Auto-login
    const sessionOk = await setLoginSession(req, {
      id: created.userId,
      full_name: normalizedFullName,
      email: created.cleanEmail,
      role: "student",
    });

    return res.status(201).json({
      success: true,
      message: "Student registered successfully.",
      data: {
        userId: created.userId,
        studentId: created.studentId,
        fullName: normalizedFullName,
        email: created.cleanEmail,
        role: "student",
        preferredLang: created.studentLang,
        academicScope: {
          systemId: created.normalizedScope.systemId,
          stageId: created.normalizedScope.stageId,
          gradeLevelId: created.normalizedScope.gradeLevelId,
        },
        academicScopeSource: created.normalizedScope.source,
      },
      ...(sessionOk ? {} : { warning: "SESSION_NOT_CONFIGURED" }),
    });
  } catch (err) {
    console.error("registerStudent error:", err);

    if (conn) {
      try {
        await conn.rollback();
      } catch {
        // ignore
      }
    }

    if (err instanceof AcademicScopeValidationError || err instanceof RegistrationScopeError) {
      return res.status(err.status || 400).json({
        success: false,
        message: err.message,
        code: err.code,
        ...(process.env.NODE_ENV === "development" && { details: err.details }),
      });
    }

    if (err instanceof IdentityRegistrationError) {
      return res.status(err.status || 400).json({
        success: false,
        message: err.message,
        code: err.code,
        ...(err.field ? { field: err.field } : {}),
      });
    }

    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This email is already registered. Please log in or use a different email.",
        code: "EMAIL_ALREADY_EXISTS",
      });
    }

    return res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    if (conn) conn.release();
  }
};

/* ============================================================================
 * POST /auth/register-teacher
 * ========================================================================= */
export const registerTeacher = async (req, res) => {
  let payload = null;

  try {
    if (typeof req.body?.payload === "string") payload = JSON.parse(req.body.payload);
    else if (req.body && typeof req.body === "object") payload = req.body;
  } catch {
    return res.status(400).json({ success: false, message: "Invalid JSON payload." });
  }

  const uploadedFiles = Array.isArray(req.files) ? req.files : [];
  const uploadedUrls = uploadedFiles.map((f) => `/uploads/teacher-videos/${f.filename}`);

  let normalizedInput;
  try {
    normalizedInput = normalizeAndValidateTeacherRegistrationInput(payload, {
      normalizeEmail,
      validatePassword,
    });
  } catch (err) {
    cleanupUploadedFiles(uploadedFiles);
    if (err instanceof TeacherRegistrationError) {
      return res.status(err.status || 400).json({
        success: false,
        message: err.message,
        ...(Array.isArray(err.errors) ? { errors: err.errors } : {}),
      });
    }
    return res.status(400).json({ success: false, message: "Invalid registration payload." });
  }

  let conn;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const { userId, teacherId } = await createTeacherIdentityAndProfile(
      conn,
      normalizedInput,
      uploadedUrls
    );

    await conn.commit();

    // Auto-login with teacher metadata
    const sessionOk = await setLoginSession(req, {
      id: userId,
      full_name: normalizedInput.fullName,
      email: normalizedInput.email,
      role: "teacher",
      extra: {
        teacher: { teacherId, status: "pending_review" },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Teacher registered successfully. Your account is pending admin approval.",
      data: { 
        userId, 
        teacherId, 
        fullName: normalizedInput.fullName, 
        email: normalizedInput.email, 
        role: "teacher", 
        status: "pending_review" 
      },
      ...(sessionOk ? {} : { warning: "SESSION_NOT_CONFIGURED" }),
    });

  } catch (err) {
    console.error("registerTeacher error:", err);

    if (conn) {
      try {
        await conn.rollback();
      } catch {
        // ignore
      }
    }

    cleanupUploadedFiles(uploadedFiles);

    if (err instanceof TeacherRegistrationError) {
      return res.status(err.status || 400).json({
        success: false,
        message: err.message,
        code: err.code,
        ...(Array.isArray(err.errors) ? { errors: err.errors } : {}),
      });
    }

    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This email is already registered. Please log in or use a different email.",
        code: "EMAIL_ALREADY_EXISTS",
      });
    }

    return res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    if (conn) conn.release();
  }
};

/* ============================================================================
 * POST /auth/register-parent-with-children
 * ========================================================================= */
export const registerParentWithChildren = async (req, res) => {
  const { parent, children, contactOption } = req.body || {};

  if (!parent || typeof parent !== "object") {
    return res.status(400).json({ success: false, message: "Parent object is required." });
  }

  const { fullName, email, password, phone, preferredLang, notes } = parent;

  if (!fullName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Parent fullName, email and password are required.",
    });
  }

  const pwErr = validatePassword(password);
  if (pwErr) return res.status(400).json({ success: false, message: pwErr });

  if (!Array.isArray(children) || children.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one child must be provided in children[].",
    });
  }

  const normalizedContactOption = contactOption === "individual" ? "individual" : "parent";

  // Validate children upfront
  for (const [index, child] of children.entries()) {
    if (!child || typeof child !== "object") {
      return res.status(400).json({ success: false, message: `Child at index ${index} is invalid.` });
    }
    if (!child.fullName) {
      return res.status(400).json({ success: false, message: `Child at index ${index} is missing fullName.` });
    }
    if (normalizedContactOption === "individual" && !normalizeEmail(child.email)) {
      return res.status(400).json({
        success: false,
        message: `Child at index ${index} is missing email (individual contact mode).`,
      });
    }
    if (normalizedContactOption === "individual" && !child.password) {
      return res.status(400).json({
        success: false,
        message: `Child at index ${index} is missing password (individual contact mode).`,
      });
    }
    if (normalizedContactOption === "individual") {
      const childPwErr = validatePassword(child.password);
      if (childPwErr) {
        return res.status(400).json({
          success: false,
          message: `Child at index ${index} has an invalid password. ${childPwErr}`,
        });
      }
    }
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const registration = await createParentWithChildrenIdentities(conn, {
      parent,
      children,
      contactOption: normalizedContactOption,
      normalizeEmail,
    });

    await conn.commit();

    // Auto-login for parent
    const sessionOk = await setLoginSession(req, {
      id: registration.parentUserId,
      full_name: fullName,
      email: registration.cleanParentEmail,
      role: "parent",
    });

    return res.status(201).json({
      success: true,
      message: "Parent and children registered successfully.",
      data: {
        parentUserId: registration.parentUserId,
        parentId: registration.parentId,
        parent: {
          fullName,
          email: registration.cleanParentEmail,
          phone: phone || null,
          preferredLang: registration.parentLang,
        },
        children: registration.createdChildren,
        contactOption: registration.normalizedContactOption,
      },
      ...(sessionOk ? {} : { warning: "SESSION_NOT_CONFIGURED" }),
    });
  } catch (err) {
    console.error("registerParentWithChildren error:", err);

    if (conn) {
      try {
        await conn.rollback();
      } catch {
        // ignore
      }
    }

    let errorMessage = "Internal server error while registering parent and children.";
    let statusCode = 500;
    let errorCode = "UNKNOWN_ERROR";

    if (err instanceof AcademicScopeValidationError || err instanceof RegistrationScopeError) {
      return res.status(err.status || 400).json({
        success: false,
        message: err.message,
        code: err.code,
        ...(process.env.NODE_ENV === "development" && { details: err.details }),
      });
    } else if (err instanceof IdentityRegistrationError) {
      statusCode = err.status || 400;
      errorCode = err.code || "IDENTITY_REGISTRATION_ERROR";
      errorMessage = err.message;
      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        code: errorCode,
        ...(err.field ? { field: err.field } : {}),
      });
    } else if (err?.code === "ER_DUP_ENTRY") {
      statusCode = 409;
      errorCode = "DB_DUPLICATE_ENTRY";
      errorMessage =
        err?.sqlMessage?.includes("users.email")
          ? "This email is already registered in the system. Please log in instead, or use a different email."
          : "A record with the same unique value already exists (likely an email conflict).";
    } else if (err?.code === "ER_NO_REFERENCED_ROW") {
      errorCode = "DB_FOREIGN_KEY_ERROR";
      errorMessage = "Database constraint error – a referenced record is missing (foreign key).";
    } else if (err?.code === "ER_DATA_TOO_LONG") {
      errorCode = "DB_DATA_TOO_LONG";
      errorMessage = "One of the fields contains data that is too long. Please shorten it and try again.";
    } else if (err?.code === "ER_BAD_NULL_ERROR") {
      errorCode = "DB_BAD_NULL_ERROR";
      errorMessage = "A required database field was empty. Please ensure all required fields are filled.";
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      code: errorCode,
      ...(process.env.NODE_ENV === "development" && {
        details: err?.message,
        dbCode: err?.code,
      }),
    });
  } finally {
    if (conn) conn.release();
  }
};

/* ============================================================================
 * POST /auth/login
 * ✅ FIXED: Teacher login now checks teachers.is_active
 * ========================================================================= */
export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  const cleanEmail = normalizeEmail(email);

  try {
    const [rows] = await pool.query(
      `
      SELECT id, full_name, email, password_hash, role, is_active
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [cleanEmail]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const user = rows[0];

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (safeRole(user.role) === "student") {
      const directLoginPolicy = await getStudentDirectLoginPolicy(user.id);

      if (
        directLoginPolicy &&
        directLoginPolicy.parentLinkCount > 0 &&
        !directLoginPolicy.directLoginEnabled
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Direct login is disabled for this child account. Please sign in through the parent account.",
          code: "STUDENT_DIRECT_LOGIN_DISABLED",
        });
      }
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
    }

    // Teachers must be approved and active
    if (safeRole(user.role) === "teacher") {
      // ✅ FIXED: Check both status and is_active
      const [teacherRows] = await pool.query(
        `SELECT id, status, is_active FROM teachers WHERE user_id = ? LIMIT 1`,
        [user.id]
      );

      if (!teacherRows.length) {
        return res.status(403).json({
          success: false,
          message: "Teacher profile not found. Please contact support.",
        });
      }

      const teacher = teacherRows[0];
      
      // ✅ FIXED: Check teacher.is_active
      if (!teacher.is_active) {
        return res.status(403).json({
          success: false,
          message: "Your teacher account is inactive. Please contact support.",
        });
      }
      
      const status = teacher.status;
      if (status !== "approved") {
        return res.status(403).json({
          success: false,
          message:
            status === "pending_review"
              ? "Your teacher account is pending admin approval."
              : "Your teacher account has been rejected. Please contact support.",
        });
      }

      const teacherId = teacher.id;
      const sessionOk = await setLoginSession(req, {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: "teacher",
        extra: {
          teacher: { teacherId, status: "approved" },
        },
      });

      if (!sessionOk) {
        return res.status(500).json({
          success: false,
          message: "Session middleware is not configured on the server.",
          code: "SESSION_NOT_CONFIGURED",
        });
      }

      return res.json({
        success: true,
        message: "Login successful.",
        data: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: "teacher",
          teacherId,
          status: "approved",
        },
      });
    }

    // Non-teacher login
    const sessionOk = await setLoginSession(req, {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: safeRole(user.role),
    });

    if (!sessionOk) {
      return res.status(500).json({
        success: false,
        message: "Session middleware is not configured on the server.",
        code: "SESSION_NOT_CONFIGURED",
      });
    }

    return res.json({
      success: true,
      message: "Login successful.",
      data: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: safeRole(user.role),
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/* ============================================================================
 * POST /auth/logout
 * ========================================================================= */
export const logout = async (req, res) => {
  try {
    if (!req.session) {
      return res.json({ success: true, message: "Logged out." });
    }

    await sessionDestroy(req);

    // Use centralized cookie configuration
    res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);

    return res.json({ success: true, message: "Logged out." });
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ============================================================================
// PASSWORD RESET FLOW
// ============================================================================

/* ============================================================================
 * POST /auth/request-reset
 * ✅ FIXED: Clean up old OTPs for same email before generating new one
 * ========================================================================= */
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ success: false, message: "Email is required." });

  const cleanEmail = normalizeEmail(email);

  try {
    const fallbackOtpId = crypto.randomUUID();
    const [rows] = await pool.query(`SELECT id, full_name FROM users WHERE email = ? LIMIT 1`, [
      cleanEmail,
    ]);

    let issuedOtpId = fallbackOtpId;
    if (rows.length) {
      const user = rows[0];
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      issuedOtpId = crypto.randomUUID();
      const otpHash = hashOtpCode(otp);

      // Keep one live reset challenge per email (resolved/older rows are replaced).
      await pool.query(`DELETE FROM password_reset_otps WHERE email = ?`, [cleanEmail]);
      await pool.query(
        `
        INSERT INTO password_reset_otps (otp_id, email, code_hash, user_id, expires_at)
        VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
        `,
        [issuedOtpId, cleanEmail, otpHash, user.id]
      );

      await sendOtpEmail(cleanEmail, otp, user.full_name);
    }

    // Store reset challenge server-side for this anonymous browser session.
    if (req.session) {
      req.session.passwordResetChallenge = {
        email: cleanEmail,
        otpId: issuedOtpId,
        issuedAt: new Date().toISOString(),
      };
      await sessionSave(req);
    }

    return res.json({
      success: true,
      message: "OTP sent to your email.",
    });
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    return res.status(500).json({ success: false, message: "Could not send OTP." });
  }
};

/* ============================================================================
 * POST /auth/verify-reset
 * ========================================================================= */
export const verifyPasswordReset = async (req, res) => {
  const { email, otp, newPassword, otpId } = req.body || {};
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      message: "email, otp and newPassword are required." 
    });
  }

  const pwErr = validatePassword(newPassword);
  if (pwErr) return res.status(400).json({ success: false, message: pwErr });

  const cleanEmail = normalizeEmail(email);
  try {
    const sessionChallenge = req.session?.passwordResetChallenge;
    const candidateOtpId =
      typeof otpId === "string" && otpId.trim().length > 0
        ? otpId.trim()
        : typeof sessionChallenge?.otpId === "string"
        ? sessionChallenge.otpId
        : "";

    if (!candidateOtpId) {
      return res.status(400).json({ success: false, message: "OTP not found or expired." });
    }

    const [otpRows] = await pool.query(
      `
      SELECT code_hash, user_id
      FROM password_reset_otps
      WHERE email = ?
        AND otp_id = ?
        AND expires_at > NOW()
      LIMIT 1
      `,
      [cleanEmail, candidateOtpId]
    );

    if (!otpRows.length) {
      return res.status(400).json({ success: false, message: "OTP not found or expired." });
    }

    const storedHash = String(otpRows[0].code_hash || "");
    const incomingHash = hashOtpCode(otp);
    if (!timingSafeEqualStr(storedHash, incomingHash)) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    const passwordHash = await hashPassword(newPassword);
    const resetUserId = Number(otpRows[0].user_id);

    await pool.query(
      `
      UPDATE users
      SET password_hash = ?
      WHERE id = ?
      `,
      [passwordHash, resetUserId]
    );

    // Cleanup policy: remove resolved reset rows for this email and trim expired rows.
    await pool.query(`DELETE FROM password_reset_otps WHERE email = ?`, [cleanEmail]);
    await pool.query(`DELETE FROM password_reset_otps WHERE expires_at <= NOW()`);
    if (req.session?.passwordResetChallenge) {
      delete req.session.passwordResetChallenge;
      await sessionSave(req);
    }

    return res.json({
      success: true,
      message: "Password updated successfully."
    });
  } catch (err) {
    console.error("verifyPasswordReset error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

