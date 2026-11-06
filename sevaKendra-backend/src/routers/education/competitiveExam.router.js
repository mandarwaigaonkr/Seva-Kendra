import { Router } from "express";
const router = Router();
import competitiveExamController from "../../modules/education/controllers/competitiveExam.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

// Routes
router.get(
  "/",
  verifyTokenExists, checkPermission("education", "view"),
  competitiveExamController.getAllCompetitiveExams
);
router.get(
  "/stats",
  verifyTokenExists, checkPermission("education", "view"),
  competitiveExamController.getCompetitiveExamsStats
);
router.get(
  "/filter-options",
  verifyTokenExists, checkPermission("education", "view"),
  competitiveExamController.getFilterOptions
);
router.get(
  "/:id",
  verifyTokenExists, checkPermission("education", "view"),
  competitiveExamController.getCompetitiveExamById
);
router.post(
  "/",
  verifyTokenExists, checkPermission("education", "create"),
  createAutoFollowUp("CompetitiveExams"),
  competitiveExamController.createCompetitiveExam
);
router.put(
  "/:id",
  verifyTokenExists, checkPermission("education", "edit"),
  competitiveExamController.updateCompetitiveExam
);
router.delete(
  "/:id",
  verifyTokenExists, checkPermission("education", "delete"), closeFollowUpsOnDelete("CompetitiveExams"),
  competitiveExamController.deleteCompetitiveExam
);

export default router;
