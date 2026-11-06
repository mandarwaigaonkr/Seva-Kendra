import { Router } from "express";
import {
  createWorkshopsAwareness,
  getAllWorkshopsAwareness,
  getWorkshopsAwarenessById,
  updateWorkshopsAwareness,
  deleteWorkshopsAwareness,
  getWorkshopsAwarenessStats,
  getWorkshopsAwarenessByWard,
  getWorkshopsAwarenessByHabitation,
  getWorkshopsAwarenessByGroupType,
  getWorkshopsAwarenessByCategory,
  getWorkshopsRequiringFollowUp,
  generateEffectivenessReport,
  getUpcomingWorkshops,
} from "../../modules/socialJustice/controllers/workshopsAwareness.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp, closeFollowUpsOnDelete } from "../../middleware/autoTracking.middleware.js";

const router = Router();

// CRUD routes
router.post(
  "/",
  verifyTokenExists, checkPermission("socialJustice", "create"),
  createAutoFollowUp("Workshops"),
  createWorkshopsAwareness
);
router.get("/", verifyTokenExists, checkPermission("socialJustice", "view"), getAllWorkshopsAwareness);
router.get("/stats", verifyTokenExists, checkPermission("socialJustice", "view"), getWorkshopsAwarenessStats);
router.get("/follow-up", verifyTokenExists, checkPermission("socialJustice", "view"), getWorkshopsRequiringFollowUp);
router.get("/upcoming", verifyTokenExists, checkPermission("socialJustice", "view"), getUpcomingWorkshops);
router.get(
  "/effectiveness-report",
  verifyTokenExists, checkPermission("socialJustice", "view"),
  generateEffectivenessReport
);
router.get("/:id", verifyTokenExists, checkPermission("socialJustice", "view"), getWorkshopsAwarenessById);
router.put("/:id", verifyTokenExists, checkPermission("socialJustice", "edit"), updateWorkshopsAwareness);
router.delete("/:id", verifyTokenExists, checkPermission("socialJustice", "delete"), closeFollowUpsOnDelete("Workshops"), deleteWorkshopsAwareness);

// Filter routes
router.get("/ward/:wardNo", verifyTokenExists, checkPermission("socialJustice", "view"), getWorkshopsAwarenessByWard);
router.get(
  "/habitation/:habitation",
  verifyTokenExists, checkPermission("socialJustice", "view"),
  getWorkshopsAwarenessByHabitation
);
router.get(
  "/group-type/:groupType",
  verifyTokenExists, checkPermission("socialJustice", "view"),
  getWorkshopsAwarenessByGroupType
);
router.get(
  "/category/:trainingCategory",
  verifyTokenExists, checkPermission("socialJustice", "view"),
  getWorkshopsAwarenessByCategory
);

// Special action routes

// Sub-item endpoints (members, participants, interventions, progress reports, ...) were
// removed: they wrote to arrays these models do not have, and no screen used them.
export default router;
