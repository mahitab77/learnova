// src/routes/subject.routes.js
import { Router } from "express";
import { getAllSubjects } from "../controllers/subject.controller.js";

const router = Router();

// GET /subjects
router.get("/", getAllSubjects);

export default router;
