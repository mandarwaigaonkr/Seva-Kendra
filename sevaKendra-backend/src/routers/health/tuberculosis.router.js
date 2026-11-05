import { Router } from "express";
const router = Router();
import tuberculosisController from "../../modules/health/controllers/tuberculosis.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp } from "../../middleware/autoTracking.middleware.js";

// Routes with authentication
router.get("/", verifyTokenExists, checkPermission("health", "view"), tuberculosisController.getAllTuberculosis);
router.get(
  "/stats",
  verifyTokenExists, checkPermission("health", "view"),
  tuberculosisController.getTuberculosisStats
);
router.get(
  "/:id",
  verifyTokenExists, checkPermission("health", "view"),
  tuberculosisController.getTuberculosisById
);
router.post(
  "/",
  verifyTokenExists, checkPermission("health", "create"),
  createAutoFollowUp("Tuberculosis"),
  tuberculosisController.createTuberculosis
);
router.put(
  "/:id",
  verifyTokenExists, checkPermission("health", "edit"),
  tuberculosisController.updateTuberculosis
);
router.delete(
  "/:id",
  verifyTokenExists, checkPermission("health", "delete"),
  tuberculosisController.deleteTuberculosis
);

export default router;
