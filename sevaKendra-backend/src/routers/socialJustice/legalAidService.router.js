import { Router } from "express";
import {
  createLegalAidService,
  getAllLegalAidServices,
  getLegalAidServiceById,
  updateLegalAidService,
  deleteLegalAidService,
  getLegalAidServiceStats,
  getLegalAidServicesByWard,
  getLegalAidServicesByHabitation,
  getLegalAidServicesByCaseType,
  getLegalAidServicesByCaseStatus,
  getLegalAidServicesByPriority,
  addInterventionStep,
  updateInterventionStep,
  updateCaseStatus,
  getCasesRequiringFollowUp,
  getCaseTimeline,
  generateCaseReport,
} from "../../modules/socialJustice/controllers/legalAidService.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp } from "../../middleware/autoTracking.middleware.js";

const router = Router();

// CRUD routes
router.post(
  "/",
  verifyTokenExists, checkPermission("socialJustice", "create"),
  createAutoFollowUp("LegalAid"),
  createLegalAidService
);
router.get("/", verifyTokenExists, checkPermission("socialJustice", "view"), getAllLegalAidServices);
router.get("/stats", verifyTokenExists, checkPermission("socialJustice", "view"), getLegalAidServiceStats);
router.get("/follow-up", verifyTokenExists, checkPermission("socialJustice", "view"), getCasesRequiringFollowUp);
router.get("/report", verifyTokenExists, checkPermission("socialJustice", "view"), generateCaseReport);
router.get("/:id", verifyTokenExists, checkPermission("socialJustice", "view"), getLegalAidServiceById);
router.put("/:id", verifyTokenExists, checkPermission("socialJustice", "edit"), updateLegalAidService);
router.delete("/:id", verifyTokenExists, checkPermission("socialJustice", "delete"), deleteLegalAidService);

// Filter routes
router.get("/ward/:wardNo", verifyTokenExists, checkPermission("socialJustice", "view"), getLegalAidServicesByWard);
router.get(
  "/habitation/:habitation",
  verifyTokenExists, checkPermission("socialJustice", "view"),
  getLegalAidServicesByHabitation
);
router.get(
  "/case-type/:caseType",
  verifyTokenExists, checkPermission("socialJustice", "view"),
  getLegalAidServicesByCaseType
);
router.get(
  "/case-status/:caseStatus",
  verifyTokenExists, checkPermission("socialJustice", "view"),
  getLegalAidServicesByCaseStatus
);
router.get(
  "/priority/:priorityLevel",
  verifyTokenExists, checkPermission("socialJustice", "view"),
  getLegalAidServicesByPriority
);

// Special action routes
router.get("/:id/timeline", verifyTokenExists, checkPermission("socialJustice", "view"), getCaseTimeline);
router.post("/:id/interventions", verifyTokenExists, checkPermission("socialJustice", "edit"), addInterventionStep);
router.put(
  "/:id/interventions/:stepId",
  verifyTokenExists, checkPermission("socialJustice", "edit"),
  updateInterventionStep
);
router.put("/:id/status", verifyTokenExists, checkPermission("socialJustice", "edit"), updateCaseStatus);

export default router;
