import { Router } from "express";
const router = Router();
import hivController from "../../modules/health/controllers/hiv.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

// Routes with authentication
router.get("/", verifyTokenExists, checkPermission("health", "view"), hivController.getAllHIV);
router.get("/stats", verifyTokenExists, checkPermission("health", "view"), hivController.getHIVStats);
router.get("/:id", verifyTokenExists, checkPermission("health", "view"), hivController.getHIVById);
router.post(
  "/",
  verifyTokenExists, checkPermission("health", "create"),
  createAutoFollowUp("HIV"),
  hivController.createHIV
);
router.put("/:id", verifyTokenExists, checkPermission("health", "edit"), hivController.updateHIV);
router.delete("/:id", verifyTokenExists, checkPermission("health", "delete"), closeFollowUpsOnDelete("HIV"), hivController.deleteHIV);

export default router;
