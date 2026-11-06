import { Router } from "express";
const router = Router();
import healthCampController from "../../modules/health/controllers/healthCamp.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

// Routes with authentication and permissions
router.get("/", verifyTokenExists, checkPermission("health", "view"), healthCampController.getAllHealthCamps);
router.get(
  "/stats",
  verifyTokenExists,
  checkPermission("health", "view"),
  healthCampController.getHealthCampsStats
);
router.get("/:id", verifyTokenExists, checkPermission("health", "view"), healthCampController.getHealthCampById);
router.post(
  "/",
  verifyTokenExists,
  checkPermission("health", "create"),
  createAutoFollowUp("HealthCamps"),
  healthCampController.createHealthCamp
);
router.put("/:id", verifyTokenExists, checkPermission("health", "edit"), healthCampController.updateHealthCamp);
router.delete("/:id", verifyTokenExists, checkPermission("health", "delete"), closeFollowUpsOnDelete("HealthCamps"), healthCampController.deleteHealthCamp);

export default router;
