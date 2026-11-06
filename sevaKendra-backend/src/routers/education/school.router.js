import { Router } from "express";
const router = Router();
import schoolController from "../../modules/education/controllers/school.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

// Routes
router.get("/", verifyTokenExists, checkPermission("education", "view"), schoolController.getAllSchools);
router.get("/stats", verifyTokenExists, checkPermission("education", "view"), schoolController.getSchoolsStats);
router.get(
  "/filter-options",
  verifyTokenExists, checkPermission("education", "view"),
  schoolController.getFilterOptions
);
router.get("/:id", verifyTokenExists, checkPermission("education", "view"), schoolController.getSchoolById);
router.post(
  "/",
  verifyTokenExists, checkPermission("education", "create"),
  createAutoFollowUp("Schools"),
  schoolController.createSchool
);
router.put("/:id", verifyTokenExists, checkPermission("education", "edit"), schoolController.updateSchool);
router.delete("/:id", verifyTokenExists, checkPermission("education", "delete"), closeFollowUpsOnDelete("Schools"), schoolController.deleteSchool);

export default router;
