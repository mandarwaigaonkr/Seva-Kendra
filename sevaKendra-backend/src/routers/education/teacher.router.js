import { Router } from "express";
const router = Router();
import teacherController from "../../modules/education/controllers/teacher.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";

// Routes with authentication
router.get("/dropdown", verifyTokenExists, checkPermission("education", "view"), teacherController.getTeachersDropdown);
router.get("/stats", verifyTokenExists, checkPermission("education", "view"), teacherController.getTeachersStats);
router.get("/filter-options", verifyTokenExists, checkPermission("education", "view"), teacherController.getFilterOptions);
router.get("/", verifyTokenExists, checkPermission("education", "view"), teacherController.getAllTeachers);
router.get("/:id", verifyTokenExists, checkPermission("education", "view"), teacherController.getTeacherById);
router.post("/", verifyTokenExists, checkPermission("education", "create"), teacherController.createTeacher);
router.put("/:id", verifyTokenExists, checkPermission("education", "edit"), teacherController.updateTeacher);
router.delete("/:id", verifyTokenExists, checkPermission("education", "delete"), teacherController.deleteTeacher);

export default router;
