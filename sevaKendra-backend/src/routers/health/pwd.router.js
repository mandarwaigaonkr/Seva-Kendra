import { Router } from "express";
const router = Router();
import pwdController from "../../modules/health/controllers/pwd.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

// Routes with authentication
router.get("/", verifyTokenExists, checkPermission("health", "view"), pwdController.getAllPWD);
router.get("/stats", verifyTokenExists, checkPermission("health", "view"), pwdController.getPWDStats);
router.get("/:id", verifyTokenExists, checkPermission("health", "view"), pwdController.getPWDById);
router.post(
  "/",
  verifyTokenExists, checkPermission("health", "create"),
  createAutoFollowUp("PWD"),
  pwdController.createPWD
);
router.put("/:id", verifyTokenExists, checkPermission("health", "edit"), pwdController.updatePWD);
router.delete("/:id", verifyTokenExists, checkPermission("health", "delete"), closeFollowUpsOnDelete("PWD"), pwdController.deletePWD);

export default router;
