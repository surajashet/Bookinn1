import express from "express";
import {
  getConfigurations,
  getConfigByKey,
  updateConfiguration,
  bulkUpdateConfigurations,
  deleteConfiguration,
  initializeDefaultConfigs
} from "../controllers/config.controller.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Initialize default configs (admin only)
router.post("/init", authenticateToken, authorizeAdmin, initializeDefaultConfigs);

// All config routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeAdmin);

router.get("/", getConfigurations);
router.get("/:key", getConfigByKey);
router.post("/", updateConfiguration);
router.post("/bulk", bulkUpdateConfigurations);
router.delete("/:key", deleteConfiguration);

export default router;