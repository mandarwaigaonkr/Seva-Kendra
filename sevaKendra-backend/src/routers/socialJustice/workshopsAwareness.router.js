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
  addParticipant,
  updateParticipantAttendance,
  addLearningObjective,
  updateLearningObjective,
  addFollowUpAction,
  updateFollowUpActionStatus,
  getWorkshopsRequiringFollowUp,
  generateEffectivenessReport,
  getUpcomingWorkshops,
} from "../../modules/socialJustice/controllers/workshopsAwareness.controller.js";
import { verifyTokenExists } from "../../middleware/authMiddleware.js";
import { checkPermission } from "../../middleware/permissionMiddleware.js";
import { createAutoFollowUp } from "../../middleware/autoTracking.middleware.js";

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
router.delete("/:id", verifyTokenExists, checkPermission("socialJustice", "delete"), deleteWorkshopsAwareness);

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
router.post("/:id/participants", verifyTokenExists, checkPermission("socialJustice", "edit"), addParticipant);
router.put(
  "/:id/participants/:participantId/attendance",
  verifyTokenExists, checkPermission("socialJustice", "edit"),
  updateParticipantAttendance
);
router.post("/:id/objectives", verifyTokenExists, checkPermission("socialJustice", "edit"), addLearningObjective);
router.put(
  "/:id/objectives/:objectiveId",
  verifyTokenExists, checkPermission("socialJustice", "edit"),
  updateLearningObjective
);
router.post("/:id/follow-up-actions", verifyTokenExists, checkPermission("socialJustice", "edit"), addFollowUpAction);
router.put(
  "/:id/follow-up-actions/:actionId/status",
  verifyTokenExists, checkPermission("socialJustice", "edit"),
  updateFollowUpActionStatus
);

export default router;
