// src/middlewares/moderator.js
// ============================================================================
// MODERATOR-SPECIFIC MIDDLEWARE
// ----------------------------------------------------------------------------
// ✅ Compatible with auth.controller.js session structure
// ✅ Session-only (production ready)
// ✅ Moderator-only access control
//
// Exports:
// 1. requireModerator        - Session-only moderator access
// 2. requireModeratorSession - Alias for clarity
// 3. requireModeratorDev     - Dev-only with header fallback
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
 * Internal: Check if user has moderator role
 * Assumes req.user is already attached by auth middleware
 */
const requireModeratorCheck = (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      source: "moderator.requireModeratorCheck",
      code: "MODERATOR_NOT_AUTHENTICATED",
      message: "Not authenticated.",
    });
  }

  const role = typeof req.user.role === "string" ? req.user.role.toLowerCase() : "";
  if (role !== "moderator") {
    return res.status(403).json({
      success: false,
      source: "moderator.requireModeratorCheck",
      code: "MODERATOR_FORBIDDEN",
      message: "Moderator access only.",
    });
  }

  return next();
};

// ============================================================================
// PRIMARY EXPORTS (SESSION-ONLY, PRODUCTION DEFAULT)
// ============================================================================

/**
 * requireModerator - Session-only moderator middleware
 */
export const requireModerator = [baseRequireSessionUser, requireModeratorCheck];

/**
 * requireModeratorSession - Explicit session-only alias
 */
export const requireModeratorSession = requireModerator;

// ============================================================================
// DEV-ONLY EXPORTS (DISABLED IN PRODUCTION)
// ============================================================================

/**
 * requireModeratorDev - Development-only with header fallback
 */
export const requireModeratorDev = isProd
  ? [
      (_req, res) =>
        res.status(401).json({
          success: false,
          source: "moderator.requireModeratorDev",
          code: "DEV_AUTH_DISABLED",
          message: "Dev header auth is disabled in production.",
        }),
    ]
  : [baseRequireUser, requireModeratorCheck];

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

export const requireUser = baseRequireUser;
export const requireSessionUser = baseRequireSessionUser;
