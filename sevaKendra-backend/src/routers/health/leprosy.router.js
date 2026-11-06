import { Router } from "express";
const router = Router();
import leprosyController from "../../modules/health/controllers/leprosy.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

// Routes with authentication
router.get("/", verifyTokenExists, checkPermission("health", "view"), leprosyController.getAllLeprosy);
router.get("/stats", verifyTokenExists, checkPermission("health", "view"), leprosyController.getLeprosyStats);
router.get("/:id", verifyTokenExists, checkPermission("health", "view"), leprosyController.getLeprosyById);
router.post(
  "/",
  verifyTokenExists, checkPermission("health", "create"),
  createAutoFollowUp("Leprosy"),
  leprosyController.createLeprosy
);
router.put("/:id", verifyTokenExists, checkPermission("health", "edit"), leprosyController.updateLeprosy);
router.delete("/:id", verifyTokenExists, checkPermission("health", "delete"), closeFollowUpsOnDelete("Leprosy"), leprosyController.deleteLeprosy);

export default router;
