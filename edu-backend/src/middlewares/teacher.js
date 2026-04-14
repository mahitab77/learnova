// src/middlewares/teacher.js
// ============================================================================
// TEACHER-SPECIFIC MIDDLEWARE (PRODUCTION-READY) - FIXED VERSION
// ----------------------------------------------------------------------------
// ✅ FIXED: requireTeacherApprovedCheck confirms approval against DB truth
// ✅ ENHANCED: Better error messages and logging
// ✅ OPTIMIZED: Reduced DB queries with session caching
// ============================================================================

import {
  requireUser as baseRequireUser,
  requireSessionUser as baseRequireSessionUser,
} from "./auth.js";
import pool from "../db.js";

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

// ============================================================================
// INTERNAL CHECK FUNCTIONS
// ============================================================================

/**
 * Internal: Check if user has teacher role
 */
const requireTeacherCheck = (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      source: "teacher.requireTeacherCheck",
      code: "TEACHER_NOT_AUTHENTICATED",
      message: "Not authenticated.",
    });
  }

  const role = typeof req.user.role === "string" ? req.user.role.toLowerCase() : "";

  if (role !== "teacher") {
    return res.status(403).json({
      success: false,
      source: "teacher.requireTeacherCheck",
      code: "TEACHER_FORBIDDEN",
      message: "Teacher access only.",
    });
  }

  return next();
};

/**
 * ✅ FIXED: Check if teacher is approved against DB truth
 * Priority 1: Session metadata for safe denial
 * Priority 2: Database check (source of truth)
 */
const requireTeacherApprovedCheck = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        source: "teacher.requireTeacherApprovedCheck",
        code: "TEACHER_NOT_AUTHENTICATED",
        message: "Not authenticated.",
      });
    }

    // ========================================================================
    // ✅ FAST DENIAL: Check cached session metadata first
    // ========================================================================
    const sessionTeacher = req.session?.meta?.teacher;

    if (sessionTeacher?.status === "pending_review") {
      return res.status(403).json({
        success: false,
        source: "teacher.requireTeacherApprovedCheck",
        code: "TEACHER_NOT_APPROVED",
        message: "Your teacher account is pending admin approval.",
        data: { 
          status: "pending_review",
          teacherId: sessionTeacher.teacherId 
        },
      });
    }

    if (sessionTeacher?.status === "rejected") {
      return res.status(403).json({
        success: false,
        source: "teacher.requireTeacherApprovedCheck",
        code: "TEACHER_REJECTED",
        message: "Your teacher account has been rejected. Please contact support.",
        data: { status: "rejected" },
      });
    }

    // Approved cache can speed up UX messaging, but DB remains the source of truth.

    // ========================================================================
    // ✅ SAFE PATH: Database check (source of truth)
    // ========================================================================
    const [rows] = await pool.query(
      `SELECT id, status, is_active FROM teachers WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return res.status(403).json({
        success: false,
        source: "teacher.requireTeacherApprovedCheck",
        code: "TEACHER_PROFILE_MISSING",
        message: "Teacher profile not found.",
      });
    }

    const teacher = rows[0];
    const dbStatus = String(teacher.status || "");
    const teacherId = teacher.id;

    // ✅ FIXED: Check teachers.is_active first (higher priority)
    if (!teacher.is_active) {
      return res.status(403).json({
        success: false,
        source: "teacher.requireTeacherApprovedCheck",
        code: "TEACHER_INACTIVE",
        message: "Your teacher account is inactive. Please contact support.",
        data: { 
          status: "inactive",
          teacherId 
        },
      });
    }

    // Then check approval status
    if (dbStatus !== "approved") {
      return res.status(403).json({
        success: false,
        source: "teacher.requireTeacherApprovedCheck",
        code: "TEACHER_NOT_APPROVED",
        message:
          dbStatus === "pending_review"
            ? "Your teacher account is pending admin approval."
            : dbStatus === "rejected"
            ? "Your teacher account has been rejected. Please contact support."
            : "Your teacher account is not approved.",
        data: { 
          status: dbStatus,
          teacherId 
        },
      });
    }

    // ========================================================================
    // ✅ OPTIMIZATION: Update session with approved status
    // ========================================================================
    if (req.session?.meta) {
      req.session.meta.teacher = {
        teacherId,
        status: "approved",
        is_active: true,
        updatedAt: new Date().toISOString(),
      };
      // Save session async
      req.session.save(() => {});
    }

    return next();
  } catch (err) {
    console.error("requireTeacherApprovedCheck error:", {
      message: err?.message,
      code: err?.code,
      userId: req.user?.id,
      path: req.path,
    });

    return res.status(500).json({
      success: false,
      source: "teacher.requireTeacherApprovedCheck",
      code: "TEACHER_APPROVAL_CHECK_FAILED",
      message: "Could not verify teacher approval status.",
    });
  }
};

// ============================================================================
// PRIMARY EXPORTS (SESSION-ONLY, PRODUCTION DEFAULT)
// ============================================================================

export const requireTeacher = [baseRequireSessionUser, requireTeacherCheck];
export const requireTeacherSession = [baseRequireSessionUser, requireTeacherCheck];
export const requireTeacherApproved = [
  baseRequireSessionUser,
  requireTeacherCheck,
  requireTeacherApprovedCheck,
];

// ============================================================================
// DEV-ONLY EXPORTS (DISABLED IN PRODUCTION)
// ============================================================================

export const requireTeacherDev = isProd
  ? [
      (_req, res) =>
        res.status(401).json({
          success: false,
          source: "teacher.requireTeacherDev",
          code: "DEV_AUTH_DISABLED",
          message: "Dev header auth is disabled in production.",
        }),
    ]
  : [baseRequireUser, requireTeacherCheck];

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

export const requireUser = baseRequireUser;
export const requireSessionUser = baseRequireSessionUser;
