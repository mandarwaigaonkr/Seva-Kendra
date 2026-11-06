import { Router } from "express";
const router = Router();
import scStudentController from "../../modules/education/controllers/scStudent.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

// Routes
router.get("/", verifyTokenExists, checkPermission("education", "view"), scStudentController.getAllSCStudents);
router.get("/stats", verifyTokenExists, checkPermission("education", "view"), scStudentController.getSCStudentsStats);
router.get(
  "/filter-options",
  verifyTokenExists, checkPermission("education", "view"),
  scStudentController.getFilterOptions
);
router.get("/:id", verifyTokenExists, checkPermission("education", "view"), scStudentController.getSCStudentById);
router.post(
  "/",
  verifyTokenExists, checkPermission("education", "create"),
  createAutoFollowUp("SCStudents"),
  scStudentController.createSCStudent
);
router.put("/:id", verifyTokenExists, checkPermission("education", "edit"), scStudentController.updateSCStudent);
router.delete("/:id", verifyTokenExists, checkPermission("education", "delete"), closeFollowUpsOnDelete("SCStudents"), scStudentController.deleteSCStudent);

export default router;
