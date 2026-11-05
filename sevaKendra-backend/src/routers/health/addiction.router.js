import { Router } from "express";
const router = Router();
import addictionController from "../../modules/health/controllers/addiction.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp } from "../../middleware/autoTracking.middleware.js";

// Routes with authentication
router.get("/", verifyTokenExists, checkPermission("health", "view"), addictionController.getAllAddiction);
router.get("/stats", verifyTokenExists, checkPermission("health", "view"), addictionController.getAddictionStats);
router.get("/:id", verifyTokenExists, checkPermission("health", "view"), addictionController.getAddictionById);
router.post(
  "/",
  verifyTokenExists, checkPermission("health", "create"),
  createAutoFollowUp("Addiction"),
  addictionController.createAddiction
);
router.put("/:id", verifyTokenExists, checkPermission("health", "edit"), addictionController.updateAddiction);
router.delete("/:id", verifyTokenExists, checkPermission("health", "delete"), addictionController.deleteAddiction);

export default router;
