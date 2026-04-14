import { Router } from "express";
import { getGradeCatalog } from "../controllers/meta.controller.js";

const router = Router();

router.get("/grade-catalog", getGradeCatalog);

export default router;
