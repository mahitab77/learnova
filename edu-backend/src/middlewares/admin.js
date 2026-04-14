// src/middlewares/admin.js
// ============================================================================
// ADMIN-SPECIFIC MIDDLEWARE (PRODUCTION-READY)
// ----------------------------------------------------------------------------
// ✅ Compatible with new auth.controller.js session structure
// ✅ Session-only by default (production ready)
// ✅ Maintains strict admin-only access control
//
// Exports:
// 1. requireAdmin        - Session-only admin access
// 2. requireAdminSession - Alias for clarity  
// 3. requireAdminDev     - Dev-only with header fallback
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
 * Internal: Check if user has admin role
 * Assumes req.user is already attached by auth middleware
 */
const requireAdminCheck = (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      source: "admin.requireAdminCheck",
      code: "ADMIN_NOT_AUTHENTICATED",
      message: "Not authenticated.",
    });
  }

  const role = typeof req.user.role === "string" ? req.user.role.toLowerCase() : "";
  if (role !== "admin") {
    return res.status(403).json({
      success: false,
      source: "admin.requireAdminCheck",
      code: "ADMIN_FORBIDDEN",
      message: "Admin access only.",
    });
  }

  return next();
};

// ============================================================================
// PRIMARY EXPORTS (SESSION-ONLY, PRODUCTION DEFAULT)
// ============================================================================

/**
 * requireAdmin - Session-only admin middleware
 * ----------------------------------------------------------------------------
 * ✅ Real admins with valid session cookies
 * ❌ No dev header fallback
 * 
 * Use for: Admin dashboard, user management, teacher approvals
 */
export const requireAdmin = [baseRequireSessionUser, requireAdminCheck];

/**
 * requireAdminSession - Explicit session-only alias
 * ----------------------------------------------------------------------------
 * Same behavior as requireAdmin, explicit naming
 */
export const requireAdminSession = requireAdmin;

// ============================================================================
// DEV-ONLY EXPORTS (DISABLED IN PRODUCTION)
// ============================================================================

/**
 * requireAdminDev - Development-only with header fallback
 * ----------------------------------------------------------------------------
 * ❌ Disabled in production (returns 401)
 * ✅ Allows x-user-id header in development
 * 
 * Use for: Local development, testing admin flows
 */
export const requireAdminDev = isProd
  ? [
      (_req, res) =>
        res.status(401).json({
          success: false,
          source: "admin.requireAdminDev",
          code: "DEV_AUTH_DISABLED",
          message: "Dev header auth is disabled in production.",
        }),
    ]
  : [baseRequireUser, requireAdminCheck];

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

export const requireUser = baseRequireUser;
export const requireSessionUser = baseRequireSessionUser;