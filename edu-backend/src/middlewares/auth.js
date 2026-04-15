// src/middlewares/auth.js
// ============================================================================
// CORE AUTHENTICATION MIDDLEWARE (PRODUCTION-READY) - FIXED VERSION
// ----------------------------------------------------------------------------
// ✅ FIXED: Cookie clearing uses SESSION_COOKIE_NAME
// ✅ FIXED: Sync with auth.controller.js session structure
// ✅ ADDED: Teacher is_active validation in validateUserActive
// ✅ IMPROVED: Better error handling and logging
// ============================================================================

import pool from "../db.js";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "../config/session.js";
import { handleDevHeaderAuth } from "./devHeaderAuth.js";

/**
 * Helper: Clear session and cookie (best-effort)
 * ✅ FIXED: Uses imported SESSION_COOKIE_NAME
 */
function clearAuthSession(req, res) {
  try {
    if (req.session) {
      req.session.destroy(() => {});
    }
  } catch (err) {
    console.warn("Session destruction error:", err.message);
  }
  
  try {
    // ✅ FIXED: Use imported constant instead of hardcoded name
    //res.clearCookie(SESSION_COOKIE_NAME);
    res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
  } catch (err) {
    console.warn("Cookie clearing error:", err.message);
  }
}

/**
 * Helper: Sync req.user with session data
 * ✅ UPDATED: Aligns with auth.controller.js session structure
 */
function attachUser(req, sessionUser) {
  const role = typeof sessionUser.role === "string" ? sessionUser.role.toLowerCase() : "";
  const fullName = sessionUser.full_name || "";

  req.user = {
    id: sessionUser.id,
    full_name: fullName,
    fullName, // alias for backward compatibility
    email: sessionUser.email ?? null,
    role,
  };
  
  // ✅ UPDATED: Only attach teacher metadata if present
  // Our auth.controller sets: req.session.meta.teacher = { teacherId, status }
  if (req.session?.meta?.teacher) {
    req.user.teacher = {
      teacherId: req.session.meta.teacher.teacherId,
      status: req.session.meta.teacher.status,
    };
  }
  
  // Note: auth.controller.js doesn't set parent metadata.
  // Canonical parent<->student switching is handled in parent.controller.js
  // via session.user + parent snapshot/switch_ctx, not via activeStudentId.
}

/**
 * Helper: Validate user exists and is active in database
 * ✅ ENHANCED: Also checks teachers.is_active for teacher users
 */
async function validateUserActive(userId, userRole) {
  try {
    // Check user exists and is active
    const [userRows] = await pool.query(
      "SELECT id, is_active FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    // User no longer exists in DB (deleted)
    if (!userRows.length) {
      return {
        ok: false,
        status: 401,
        payload: {
          success: false,
          code: "AUTH_USER_NOT_FOUND",
          message: "Authentication failed: user no longer exists.",
        },
      };
    }

    // User exists but is inactive
    if (!userRows[0].is_active) {
      return {
        ok: false,
        status: 403,
        payload: {
          success: false,
          code: "AUTH_USER_INACTIVE",
          message: "This user account is inactive or blocked.",
        },
      };
    }

    // ✅ ENHANCED: For teachers, also check teachers.is_active
    if (userRole === "teacher") {
      const [teacherRows] = await pool.query(
        "SELECT is_active FROM teachers WHERE user_id = ? LIMIT 1",
        [userId]
      );

      if (teacherRows.length && !teacherRows[0].is_active) {
        return {
          ok: false,
          status: 403,
          payload: {
            success: false,
            code: "AUTH_TEACHER_INACTIVE",
            message: "Your teacher account is inactive. Please contact support.",
          },
        };
      }
    }

    return { ok: true };
  } catch (err) {
    console.error("validateUserActive error:", err);
    return {
      ok: false,
      status: 500,
      payload: {
        success: false,
        code: "AUTH_VALIDATION_ERROR",
        message: "Error validating user status.",
      },
    };
  }
}

// ============================================================================
// PRIMARY AUTH MIDDLEWARE
// ============================================================================

/**
 * requireUser - Flexible Authentication Middleware
 */
export const requireUser = async (req, res, next) => {
  try {
    // 1) Upstream auth already attached a user
    if (req.user?.id) {
      if (typeof req.user.role === "string") {
        req.user.role = req.user.role.toLowerCase();
      }
      return next();
    }

    // 2) Session cookie auth (primary production path)
    if (req.session?.user?.id) {
      const sessUser = req.session.user;
      const userRole = typeof sessUser.role === "string" ? sessUser.role.toLowerCase() : "";

      // ✅ ENHANCED: Pass user role for teacher is_active check
      const validation = await validateUserActive(sessUser.id, userRole);
      if (!validation.ok) {
        // Session is stale (deleted/inactive user) - clear auth
        clearAuthSession(req, res);
        return res.status(validation.status).json({
          ...validation.payload,
          source: "auth.requireUser",
        });
      }

      attachUser(req, sessUser);
      return next();
    }

    // 3) Optional dev-only header auth fallback is isolated in a separate module.
    const handledByDevHeader = await handleDevHeaderAuth(req, res, next, {
      attachUser,
      validateUserActive,
    });
    if (handledByDevHeader) {
      return;
    }

    // 4) No session and no dev header auth path enabled/available.
    if (!req.session?.user?.id) {
      return res.status(401).json({
        success: false,
        source: "auth.requireUser",
        code: "AUTH_MISSING",
        message: "Authentication failed: no active session was found.",
        description: "Please log in again so a valid session cookie is created.",
      });
    }
  } catch (err) {
    console.error("requireUser middleware error:", {
      message: err?.message,
      code: err?.code,
      path: req.path,
      method: req.method,
    });

    return res.status(500).json({
      success: false,
      source: "auth.requireUser",
      code: "AUTH_INTERNAL_ERROR",
      message: "Internal authentication error.",
    });
  }
};

/**
 * requireSessionUser - Strict Session-Only Authentication
 */
export const requireSessionUser = async (req, res, next) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({
        success: false,
        source: "auth.requireSessionUser",
        code: "SESSION_REQUIRED",
        message: "Login required (session cookie missing).",
      });
    }

    const sessUser = req.session.user;
    const userRole = typeof sessUser.role === "string" ? sessUser.role.toLowerCase() : "";

    // ✅ ENHANCED: Pass user role for teacher is_active check
    const validation = await validateUserActive(sessUser.id, userRole);
    if (!validation.ok) {
      clearAuthSession(req, res);
      return res.status(validation.status).json({
        ...validation.payload,
        source: "auth.requireSessionUser",
      });
    }

    attachUser(req, sessUser);
    return next();
  } catch (err) {
    console.error("requireSessionUser middleware error:", {
      message: err?.message,
      code: err?.code,
      path: req.path,
      method: req.method,
    });

    return res.status(500).json({
      success: false,
      source: "auth.requireSessionUser",
      code: "AUTH_INTERNAL_ERROR",
      message: "Internal authentication error.",
    });
  }
};

// ============================================================================
// HELPER EXPORTS
// ============================================================================

/**
 * Check if user has specific role(s)
 */
export const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const normalizedRoles = roles.map(r => r.toLowerCase());
  
  return async (req, res, next) => {
    try {
      // First ensure user is authenticated
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          source: "auth.requireRole",
          code: "ROLE_CHECK_UNAUTHENTICATED",
          message: "Authentication required for role check.",
        });
      }

      const userRole = String(req.user.role || "").toLowerCase();
      
      if (!normalizedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          source: "auth.requireRole",
          code: "ROLE_FORBIDDEN",
          message: `Access restricted. Required role(s): ${roles.join(", ")}.`,
          data: { required: roles, actual: userRole },
        });
      }

      next();
    } catch (err) {
      console.error("requireRole middleware error:", err);
      return res.status(500).json({
        success: false,
        source: "auth.requireRole",
        code: "ROLE_CHECK_INTERNAL_ERROR",
        message: "Internal error during role verification.",
      });
    }
  };
};
