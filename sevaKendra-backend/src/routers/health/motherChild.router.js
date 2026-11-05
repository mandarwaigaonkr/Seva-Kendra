import { Router } from "express";
const router = Router();
import motherChildController from "../../modules/health/controllers/motherChild.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp } from "../../middleware/autoTracking.middleware.js";

// Routes with authentication
router.get("/", verifyTokenExists, checkPermission("health", "view"), motherChildController.getAllMotherChild);
router.get(
  "/stats",
  verifyTokenExists, checkPermission("health", "view"),
  motherChildController.getMotherChildStats
);
router.get("/:id", verifyTokenExists, checkPermission("health", "view"), motherChildController.getMotherChildById);
router.post(
  "/",
  verifyTokenExists, checkPermission("health", "create"),
  createAutoFollowUp("MotherChild"),
  motherChildController.createMotherChild
);
router.put("/:id", verifyTokenExists, checkPermission("health", "edit"), motherChildController.updateMotherChild);
router.delete(
  "/:id",
  verifyTokenExists, checkPermission("health", "delete"),
  motherChildController.deleteMotherChild
);

export default router;
