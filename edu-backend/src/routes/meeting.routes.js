// src/routes/meeting.routes.js
// ============================================================================
// Meeting Routes — any authenticated user
// ============================================================================

import { Router } from "express";
import { requireSessionUser } from "../middlewares/auth.js";
import { generateZoomSignature } from "../controllers/meeting.controller.js";

const router = Router();

// All meeting routes require a valid session (any role)
router.use(requireSessionUser);

// GET /meeting/sessions/:sessionId/zoom-signature
// Returns a Zoom Meeting SDK JWT for embedded Component View
router.get("/sessions/:sessionId/zoom-signature", generateZoomSignature);

export default router;
