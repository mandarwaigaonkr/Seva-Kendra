import { Router } from "express";
const router = Router();
import adolescentsController from "../../modules/health/controllers/adolescents.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

// Routes with authentication
router.get("/", verifyTokenExists, checkPermission("health", "view"), adolescentsController.getAllAdolescents);
router.get(
  "/stats",
  verifyTokenExists, checkPermission("health", "view"),
  adolescentsController.getAdolescentStats
);
router.get("/:id", verifyTokenExists, checkPermission("health", "view"), adolescentsController.getAdolescentById);
router.post(
  "/",
  verifyTokenExists, checkPermission("health", "create"),
  createAutoFollowUp("Adolescents"),
  adolescentsController.createAdolescent
);
router.put("/:id", verifyTokenExists, checkPermission("health", "edit"), adolescentsController.updateAdolescent);
router.delete(
  "/:id",
  verifyTokenExists, checkPermission("health", "delete"), closeFollowUpsOnDelete("Adolescents"),
  adolescentsController.deleteAdolescent
);

export default router;
