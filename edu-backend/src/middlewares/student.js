// src/middlewares/student.js
// ============================================================================
// STUDENT-SPECIFIC MIDDLEWARE (PRODUCTION-READY)
// ----------------------------------------------------------------------------
// ✅ Compatible with new auth.controller.js session structure
// ✅ Session-only by default (production ready)
// ✅ Maintains dev header support for local development
//
// Exports:
// 1. requireStudent        - Session-only student access
// 2. requireStudentSession - Alias for clarity
// 3. requireStudentDev     - Dev-only with header fallback
// ============================================================================

import {
  requireUser as baseRequireUser,
  requireSessionUser as baseRequireSessionUser,
} from "./auth.js";

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

// ============================================================================
// INTERNAL CHECK FUNCTIONS
// ============================================================================

/**
 * Internal: Check if user has student role
 * Assumes req.user is already attached by auth middleware
 */
function requireStudentCheck(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      source: "student.requireStudentCheck",
      code: "STUDENT_NOT_AUTHENTICATED",
      message: "Not authenticated.",
    });
  }

  const role = typeof req.user.role === "string" ? req.user.role.toLowerCase() : "";

  if (role !== "student") {
    return res.status(403).json({
      success: false,
      source: "student.requireStudentCheck",
      code: "STUDENT_FORBIDDEN",
      message: "Student access only.",
    });
  }

  return next();
}

// ============================================================================
// PRIMARY EXPORTS (SESSION-ONLY, PRODUCTION DEFAULT)
// ============================================================================

/**
 * requireStudent - Session-only student middleware
 * ----------------------------------------------------------------------------
 * ✅ Real students with valid session cookies
 * ❌ No dev header fallback
 * 
 * Use for: Student dashboard, lesson access, profile management
 */
export const requireStudent = [baseRequireSessionUser, requireStudentCheck];

/**
 * requireStudentSession - Explicit session-only alias
 * ----------------------------------------------------------------------------
 * Same behavior as requireStudent, separate instance for debugging clarity
 */
export const requireStudentSession = [baseRequireSessionUser, requireStudentCheck];

// ============================================================================
// DEV-ONLY EXPORTS (DISABLED IN PRODUCTION)
// ============================================================================

/**
 * requireStudentDev - Development-only with header fallback
 * ----------------------------------------------------------------------------
 * ❌ Disabled in production (returns 401)
 * ✅ Allows x-user-id header in development
 * 
 * Use for: Local development, testing student flows
 */
export const requireStudentDev = isProd
  ? [
      (_req, res) =>
        res.status(401).json({
          success: false,
          source: "student.requireStudentDev",
          code: "DEV_AUTH_DISABLED",
          message: "Dev header auth is disabled in production.",
        }),
    ]
  : [baseRequireUser, requireStudentCheck];

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

export const requireUser = baseRequireUser;
export const requireSessionUser = baseRequireSessionUser;