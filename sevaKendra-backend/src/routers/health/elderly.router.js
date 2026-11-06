import { Router } from "express";
const router = Router();
import elderlyController from "../../modules/health/controllers/elderly.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

// Routes with authentication
router.get("/", verifyTokenExists, checkPermission("health", "view"), elderlyController.getAllElderly);
router.get("/stats", verifyTokenExists, checkPermission("health", "view"), elderlyController.getElderlyStats);
router.get("/:id", verifyTokenExists, checkPermission("health", "view"), elderlyController.getElderlyById);
router.post(
  "/",
  verifyTokenExists, checkPermission("health", "create"),
  createAutoFollowUp("Elderly"),
  elderlyController.createElderly
);
router.put("/:id", verifyTokenExists, checkPermission("health", "edit"), elderlyController.updateElderly);
router.delete("/:id", verifyTokenExists, checkPermission("health", "delete"), closeFollowUpsOnDelete("Elderly"), elderlyController.deleteElderly);

export default router;
