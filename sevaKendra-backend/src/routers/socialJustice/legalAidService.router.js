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
  updateCaseStatus,
  getCasesRequiringFollowUp,
  getCaseTimeline,
  generateCaseReport,
} from "../../modules/socialJustice/controllers/legalAidService.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

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
router.delete("/:id", verifyTokenExists, checkPermission("socialJustice", "delete"), closeFollowUpsOnDelete("LegalAid"), deleteLegalAidService);

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
router.put("/:id/status", verifyTokenExists, checkPermission("socialJustice", "edit"), updateCaseStatus);

// Sub-item endpoints (members, participants, interventions, progress reports, ...) were
// removed: they wrote to arrays these models do not have, and no screen used them.
export default router;
