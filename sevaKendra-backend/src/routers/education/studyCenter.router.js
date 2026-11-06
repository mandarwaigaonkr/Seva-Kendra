import { Router } from "express";
const router = Router();
import studyCenterController from "../../modules/education/controllers/studyCenter.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

// Routes with authentication and permissions
router.get("/", verifyTokenExists, checkPermission("education", "view"), studyCenterController.getAllStudyCenters);
router.get(
  "/stats",
  verifyTokenExists,
  checkPermission("education", "view"),
  studyCenterController.getStudyCentersStats
);
router.get(
  "/filter-options",
  verifyTokenExists,
  checkPermission("education", "view"),
  studyCenterController.getFilterOptions
);
router.get("/:id", verifyTokenExists, checkPermission("education", "view"), studyCenterController.getStudyCenterById);
router.post(
  "/",
  verifyTokenExists,
  checkPermission("education", "create"),
  createAutoFollowUp("StudyCenters"),
  studyCenterController.createStudyCenter
);
router.put("/:id", verifyTokenExists, checkPermission("education", "edit"), studyCenterController.updateStudyCenter);
router.delete(
  "/:id",
  verifyTokenExists,
  checkPermission("education", "delete"), closeFollowUpsOnDelete("StudyCenters"),
  studyCenterController.deleteStudyCenter
);

export default router;
