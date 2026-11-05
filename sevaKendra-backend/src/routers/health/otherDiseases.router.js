import { Router } from "express";
const router = Router();
import otherDiseasesController from "../../modules/health/controllers/otherDiseases.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";

// Routes with authentication
router.get("/", verifyTokenExists, checkPermission("health", "view"), otherDiseasesController.getAllOtherDiseases);
router.get(
  "/stats",
  verifyTokenExists, checkPermission("health", "view"),
  otherDiseasesController.getOtherDiseasesStats
);
router.get(
  "/:id",
  verifyTokenExists, checkPermission("health", "view"),
  otherDiseasesController.getOtherDiseasesById
);
router.post(
  "/",
  verifyTokenExists, checkPermission("health", "create"),
  otherDiseasesController.createOtherDiseases
);
router.put(
  "/:id",
  verifyTokenExists, checkPermission("health", "edit"),
  otherDiseasesController.updateOtherDiseases
);
router.delete(
  "/:id",
  verifyTokenExists, checkPermission("health", "delete"),
  otherDiseasesController.deleteOtherDiseases
);

export default router;
